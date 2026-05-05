export const NAORIS_TOKEN_CONTRACT = '0x1b379A79c91a540b2bcd612b4d713f31De1b80cc';

export const TOTAL_SUPPLY = 4000000000;

export const DEFAULT_WALLETS = [
  {
    address: '0x1b379A79c91a540b2bcd612b4d713f31De1b80cc',
    label: 'NAORIS Token Contract',
    walletType: 'Utility',
  },
  {
    address: '0xaa2a4B4CD952645201D34f66F1C054b98ceF7263',
    label: 'DecubateVestingV3 Proxy',
    walletType: 'Vesting Contract',
  },
  {
    address: '0x76f998714623EE2d96E8cA834a6C942A67CaeB54',
    label: 'MultiSigWallet',
    walletType: 'Multisig Wallet',
  },
  {
    address: '0xE866F2dC5928E40a36a9F46a63F8005C72874FdB',
    label: 'Gnosis Safe Proxy',
    walletType: 'Gnosis Safe',
  },
  {
    address: '0xbc8821d23d5D064DE269dC6abec92d96C89BdD7a',
    label: 'Large Holder Wallet',
    walletType: 'Large Holder',
  },
];

export const SEVERITY_THRESHOLDS = {
  LOW: 1000000,
  MEDIUM: 4000000, // 0.1%
  HIGH: 20000000, // 0.5%
  CRITICAL: 40000000, // 1%
};
