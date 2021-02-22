export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
}

export type WalletType = 'O3' | 'NeoLine';

export class Exchange {
  huobi: any;
  binance: any;
  coinbase: any;
}

export class RateChain {
  neo: any;
  eth: any;
}
