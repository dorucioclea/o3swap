export type WalletType = 'O3' | 'NeoLine';

export type Chain = 'neo' | 'eth';

export interface Account {
  address: string;
  label: string;
}
