import { ethers } from 'ethers';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
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
  return onSnapshot(collection(db, 'wallets'), (snap) => {
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

async function evaluateRules(walletData: any, naorisBalance: number, txAmount?: number, txHash?: string) {
  try {
    const rulesSnap = await getDocs(query(collection(db, 'alertRules'), where('isActive', '==', true)));
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
        
        // Prevent duplicate alerts for the same balance trigger (naive debounce)
        const existingSnap = await getDocs(query(
          collection(db, 'alerts'),
          where('walletAddress', '==', walletData.address),
          where('alertType', '==', alertData.alertType),
          where('createdAt', '>', Date.now() - 3600000)
        ));
          
        if (existingSnap.empty) {
          await addDoc(collection(db, 'alerts'), alertData);
          console.log(`[Worker] ALERT! ${rule.name} triggered for ${walletData.label}`);
        }
      }
    }
  } catch (err) {
    console.error("[Worker] Error evaluating rules:", err);
  }
}

async function updateWalletBalanceRealtime(address: string) {
  if (!contract || !provider) return;
  try {
    const naorisBalanceRaw = await contract.balanceOf(address);
    const ethBalanceRaw = await provider.getBalance(address);
    
    const naorisBalance = Number(ethers.formatUnits(naorisBalanceRaw, 18));
    const ethBalance = Number(ethers.formatEther(ethBalanceRaw));

    const snap = await getDocs(query(collection(db, 'wallets'), where('address', '==', address)));
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        naorisBalance,
        ethBalance,
        lastActivityAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    return naorisBalance;
  } catch (err) {
    console.error(`[Worker] Balance update error for ${address}:`, err);
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
    
    let riskLevel = RiskLevel.LOW;
    if (amountFormatted >= SEVERITY_THRESHOLDS.CRITICAL) riskLevel = RiskLevel.CRITICAL;
    else if (amountFormatted >= SEVERITY_THRESHOLDS.HIGH) riskLevel = RiskLevel.HIGH;
    else if (amountFormatted >= SEVERITY_THRESHOLDS.MEDIUM) riskLevel = RiskLevel.MEDIUM;

    const txData = {
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

    try {
      // Save Transaction
      await setDoc(doc(db, 'transactions', transactionHash), txData);
      
      const activeAddr = isFromMonitored ? fromLower : toLower;
      
      // Update balances immediately for the involved monitored wallet
      const currentBalance = await updateWalletBalanceRealtime(activeAddr);
      
      const walletSnap = await getDocs(query(collection(db, 'wallets'), where('address', '==', activeAddr)));
      
      if (!walletSnap.empty) {
        const wDoc = walletSnap.docs[0];
        const wData = wDoc.data();
        const telemetry = await getTelemetry(transactionHash);

        // Evaluate Custom Rules for this transaction
        await evaluateRules(wData, currentBalance || Number(wData.naorisBalance || 0), amountFormatted, transactionHash);

        // Fallback: Default High-Value alerting
        if (riskLevel !== RiskLevel.LOW || isFromMonitored) {
          const alertData = {
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
          await addDoc(collection(db, 'alerts'), alertData);
        }
      }
      
      console.log(`[Worker] Success: Processed ${transactionHash}`);
    } catch (err) {
      console.error("[Worker] Firestore write error:", err);
    }
  }
}

async function syncWalletBalances() {
  console.log("[Worker] Starting scheduled balance synchronization...");
  try {
    const walletsSnap = await getDocs(collection(db, 'wallets'));
    
    for (const wDoc of walletsSnap.docs) {
      const data = wDoc.data();
      if (!data.isActive) continue;

      const address = data.address;
      try {
        const naorisBalanceRaw = await contract!.balanceOf(address);
        const ethBalanceRaw = await provider!.getBalance(address);
        
        const naorisBalance = Number(ethers.formatUnits(naorisBalanceRaw, 18));
        const ethBalance = Number(ethers.formatEther(ethBalanceRaw));

        await updateDoc(wDoc.ref, {
          naorisBalance,
          ethBalance,
          lastActivityAt: Date.now(),
          updatedAt: Date.now()
        });

        // Evaluate Custom Rules for current state
        await evaluateRules(data, naorisBalance);

        // Fallback: Hardcoded Critical Threshold
        if (naorisBalance > SEVERITY_THRESHOLDS.CRITICAL) {
          const alertData = {
            alertType: 'Critical Balance Detected',
            severity: AlertSeverity.CRITICAL,
            walletAddress: address,
            walletLabel: data.label,
            amount: naorisBalance,
            reason: `Heuristic check: Critical holding threshold exceeded (${naorisBalance.toLocaleString()}).`,
            status: AlertStatus.NEW,
            createdAt: Date.now()
          };
          await addDoc(collection(db, 'alerts'), alertData);
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
      await setDoc(doc(db, 'sync', 'ethereum'), {
        lastBlock: block,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.warn("[Worker] Sync state warning (likely rate limit):", err.message);
    }
  }, 120000); // 2 minutes to be very safe from rate limits
}
