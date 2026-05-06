import { ethers } from 'ethers';
import { adminDb as db, FieldValue } from '../lib/firebase-admin.ts';
import { NAORIS_TOKEN_CONTRACT, TOTAL_SUPPLY, SEVERITY_THRESHOLDS } from '../constants.ts';
import { RiskLevel, AlertSeverity, AlertStatus, AlertRule, AlertRuleType } from '../types.ts';

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

let trackedAddresses: Set<string> = new Set();
let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

function setupAddressTracking() {
  console.log("[Worker] Initializing real-time address tracking...");
  return db.collection('wallets').onSnapshot((snap) => {
    const newAddresses = new Set<string>();
    snap.forEach(snapDoc => {
      const data = snapDoc.data();
      if (data.isActive) {
        newAddresses.add(data.address.toLowerCase());
      }
    });
    trackedAddresses = newAddresses;
    console.log(`[Worker] Real-time tracking updated: ${trackedAddresses.size} active wallets.`);
  }, (err) => {
    console.error("[Worker] Address tracking error:", err);
  });
}

async function getTelemetry(txHash?: string) {
  if (!txHash || !provider) return {};
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return {};
    
    return {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') + ' Gwei' : undefined,
      networkHealth: 'Stable'
    };
  } catch (err) {
    console.warn(`[Worker] Could not fetch telemetry for ${txHash}:`, err);
    return {};
  }
}

async function evaluateRules(userId: string, walletData: any, naorisBalance: number, txAmount?: number, txHash?: string) {
  try {
    const rulesSnap = await db.collection('alertRules')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();
    const telemetry = await getTelemetry(txHash);
    
    for (const rDoc of rulesSnap.docs) {
      const rule = rDoc.data() as AlertRule;
      let triggered = false;

      // Handle Balance Rules
      if (rule.ruleType === AlertRuleType.BALANCE_ABOVE || rule.ruleType === AlertRuleType.BALANCE_BELOW) {
        if (rule.comparison === 'greater_than' && naorisBalance > rule.threshold) triggered = true;
        if (rule.comparison === 'less_than' && naorisBalance < rule.threshold) triggered = true;
      }

      // Handle Transfer Rules
      if (txAmount && rule.ruleType === AlertRuleType.LARGE_TRANSFER) {
        if (txAmount > rule.threshold) triggered = true;
      }

      if (triggered) {
        const alertData = {
          userId,
          alertType: `Rule Triggered: ${rule.name}`,
          severity: rule.severity,
          walletAddress: walletData.address,
          walletLabel: walletData.label,
          amount: txAmount || naorisBalance,
          txHash: txHash || '',
          reason: rule.description,
          recommendedAction: 'Autonomous detection triggered. Review entity history immediately.',
          status: AlertStatus.NEW,
          createdAt: Date.now(),
          ...telemetry
        };
        
        // Prevent duplicate alerts for the same balance trigger (naive debounce) for this user
        const existingSnap = await db.collection('alerts')
          .where('userId', '==', userId)
          .where('walletAddress', '==', walletData.address)
          .where('alertType', '==', alertData.alertType)
          .where('createdAt', '>', Date.now() - 3600000)
          .get();
          
        if (existingSnap.empty) {
          await db.collection('alerts').add(alertData);
          console.log(`[Worker] ALERT! ${rule.name} triggered for user ${userId} wallet ${walletData.label}`);
        }
      }
    }
  } catch (err) {
    console.error("[Worker] Error evaluating rules:", err);
  }
}

async function updateWalletBalanceRealtime(userId: string, address: string) {
  if (!contract || !provider) return;
  try {
    const naorisBalanceRaw = await contract.balanceOf(address);
    const ethBalanceRaw = await provider.getBalance(address);
    
    const naorisBalance = Number(ethers.formatUnits(naorisBalanceRaw, 18));
    const ethBalance = Number(ethers.formatEther(ethBalanceRaw));

    const snap = await db.collection('wallets')
      .where('userId', '==', userId)
      .where('address', '==', address)
      .get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        naorisBalance,
        ethBalance,
        lastActivityAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    return naorisBalance;
  } catch (err) {
    console.error(`[Worker] Balance update error for ${address} (user: ${userId}):`, err);
  }
}

async function processTransaction(log: any) {
  const { from, to, value, transactionHash, blockNumber } = log;
  if (!from || !to) return;
  
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const isFromMonitored = trackedAddresses.has(fromLower);
  const isToMonitored = trackedAddresses.has(toLower);

  if (isFromMonitored || isToMonitored) {
    console.log(`[Worker] Match detected! TX: ${transactionHash}`);
    
    const amountFormatted = Number(ethers.formatUnits(value, 18));
    const percentTotalSupply = (amountFormatted / TOTAL_SUPPLY) * 100;
    
    let riskLevel: RiskLevel = RiskLevel.LOW;
    if (amountFormatted >= SEVERITY_THRESHOLDS.CRITICAL) riskLevel = RiskLevel.CRITICAL;
    else if (amountFormatted >= SEVERITY_THRESHOLDS.HIGH) riskLevel = RiskLevel.HIGH;
    else if (amountFormatted >= SEVERITY_THRESHOLDS.MEDIUM) riskLevel = RiskLevel.MEDIUM;

    const activeAddr = isFromMonitored ? fromLower : toLower;

    try {
      // Find all users monitoring this address
      const walletSnap = await db.collection('wallets').where('address', '==', activeAddr).get();
      const telemetry = await getTelemetry(transactionHash);

      for (const wDoc of walletSnap.docs) {
        const wData = wDoc.data();
        const userId = wData.userId;

        const txData = {
          userId,
          txHash: transactionHash,
          blockNumber,
          timestamp: Date.now(),
          fromAddress: from,
          toAddress: to,
          amountRaw: value.toString(),
          amountFormatted,
          percentTotalSupply,
          tokenContract: NAORIS_TOKEN_CONTRACT,
          direction: isFromMonitored ? 'Outbound' : 'Inbound',
          riskLevel,
          status: 'Confirmed'
        };

        // Save Per-User Transaction
        await db.collection('transactions').doc(`${userId}_${transactionHash}`).set(txData);
        
        // Update balances for this specific user's wallet record
        const currentBalance = await updateWalletBalanceRealtime(userId, activeAddr);
        
        // Evaluate Custom Rules for this transaction for this user
        await evaluateRules(userId, wData, currentBalance || Number(wData.naorisBalance || 0), amountFormatted, transactionHash);

        // Fallback: Default High-Value alerting
        if (riskLevel !== RiskLevel.LOW || isFromMonitored) {
          const alertData = {
            userId,
            alertType: isFromMonitored ? 'Large Outbound Transfer' : 'Whale Accumulation',
            severity: riskLevel as unknown as AlertSeverity,
            walletAddress: activeAddr,
            walletLabel: wData.label,
            txHash: transactionHash,
            amount: amountFormatted,
            reason: `Heuristic check: Large movement of ${amountFormatted.toLocaleString()} NAORIS.`,
            recommendedAction: 'Monitor recipient address for secondary dispersals.',
            status: AlertStatus.NEW,
            createdAt: Date.now(),
            ...telemetry
          };
          await db.collection('alerts').add(alertData);
        }
      }
      
      console.log(`[Worker] Success: Processed ${transactionHash} for ${walletSnap.size} monitors.`);
    } catch (err) {
      console.error("[Worker] Firestore multi-user write error:", err);
    }
  }
}

async function syncWalletBalances() {
  console.log("[Worker] Starting scheduled balance synchronization...");
  try {
    const walletsSnap = await db.collection('wallets').get();
    
    for (const wDoc of walletsSnap.docs) {
      const data = wDoc.data();
      if (!data.isActive) continue;

      const address = data.address;
      try {
        const naorisBalanceRaw = await contract!.balanceOf(address);
        const ethBalanceRaw = await provider!.getBalance(address);
        
        const naorisBalance = Number(ethers.formatUnits(naorisBalanceRaw, 18));
        const ethBalance = Number(ethers.formatEther(ethBalanceRaw));

        await wDoc.ref.update({
          naorisBalance,
          ethBalance,
          lastActivityAt: Date.now(),
          updatedAt: Date.now()
        });

        // Evaluate Custom Rules for current state
        await evaluateRules(data.userId, data, naorisBalance);

        // Fallback: Hardcoded Critical Threshold
        if (naorisBalance > SEVERITY_THRESHOLDS.CRITICAL) {
          const alertData = {
            userId: data.userId,
            alertType: 'Critical Balance Detected',
            severity: AlertSeverity.CRITICAL,
            walletAddress: address,
            walletLabel: data.label,
            amount: naorisBalance,
            reason: `Heuristic check: Critical holding threshold exceeded (${naorisBalance.toLocaleString()}).`,
            status: AlertStatus.NEW,
            createdAt: Date.now()
          };
          await db.collection('alerts').add(alertData);
        }
      } catch (err) {
        console.error(`[Worker] Error syncing balance for ${address}:`, err);
      }
    }
    console.log("[Worker] Balance synchronization complete.");
  } catch (err) {
    console.error("[Worker] Error in syncWalletBalances:", err);
  }
}

export async function startWorker() {
  const rpcUrl = process.env.ETH_RPC_URL || "https://eth.llamarpc.com";
  provider = new ethers.JsonRpcProvider(rpcUrl);
  contract = new ethers.Contract(NAORIS_TOKEN_CONTRACT, ERC20_ABI, provider);

  console.log("[Worker] Starting NAORIS monitoring service...");

  setupAddressTracking();
  await syncWalletBalances(); // Initial sync
  
  setInterval(syncWalletBalances, 10 * 60 * 1000); // Sync every 10 mins

  const setupListener = () => {
    console.log("[Worker] Subscribing to Transfer events...");
    contract!.on("Transfer", (from, to, value, event) => {
      try {
        processTransaction({
          from,
          to,
          value,
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber
        });
      } catch (err) {
        console.error("[Worker] Event processing error:", err);
      }
    });

    provider!.on("error", (err) => {
      console.warn("[Worker] Provider error, reconnecting:", err);
      contract!.removeAllListeners();
      setTimeout(setupListener, 10000);
    });
  };

  setupListener();

  // Sync state polling
  setInterval(async () => {
    try {
      const block = await provider!.getBlockNumber();
      await db.collection('sync').doc('ethereum').set({
        lastBlock: block,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.warn("[Worker] Sync state warning (likely rate limit):", err.message);
    }
  }, 120000); // 2 minutes to be very safe from rate limits
}
