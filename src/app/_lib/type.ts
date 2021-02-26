export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
}

export type WalletType = 'O3' | 'NeoLine';

export type Chain = 'neo' | 'eth';
