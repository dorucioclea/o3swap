export type WalletName = 'O3' | 'NeoLine' | 'MetaMask';
export type NeoWalletName = 'O3' | 'NeoLine';
export type EthWalletName = 'O3' | 'MetaMask';

export const CHAIN_ID_ETHEREUM = 2;
export const CHAIN_ID_ONTOLOGY = 3;
export const CHAIN_ID_NEO = 4;

export interface Wallet {
  name: WalletName;
  chainId: number;
  logo: string;
  downloadUrl: string;
}

export interface NeoWallet extends Wallet {
  name: NeoWalletName;
}
export interface EthWallet extends Wallet {
  name: EthWalletName;
}
export const NEO_WALLETS: NeoWallet[] = [
  {
    name: 'NeoLine',
    chainId: CHAIN_ID_NEO,
    logo: '/assets/images/logo-NeoLine.png',
    downloadUrl:
      'https://chrome.google.com/webstore/detail/neoline/cphhlgmgameodnhkjdmkpanlelnlohao',
  },
  {
    name: 'O3',
    chainId: CHAIN_ID_NEO,
    logo: '/assets/images/logo-O3.png',
    downloadUrl: 'https://o3.network/#download',
  },
];

export const ETH_WALLETS: EthWallet[] = [
  {
    name: 'MetaMask',
    chainId: CHAIN_ID_ETHEREUM,
    logo: '/assets/images/logo-MetaMask.png',
    downloadUrl:
      'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
  },
  {
    name: 'O3',
    chainId: CHAIN_ID_NEO,
    logo: '/assets/images/logo-O3.png',
    downloadUrl: 'https://o3.network/#download',
  },
];
