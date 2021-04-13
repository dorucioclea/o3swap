import { Network } from './network';
import { Token } from './token';
import { NeoWalletName, EthWalletName } from './wallet';

export type TxProgress = {
  step1: { hash: string; status: 0 | 1 | 2 }; // 0 = 未开始, 1 = 进行中, 2 = 已完成
  step2: { hash: string; status: 0 | 1 | 2 }; // 0 = 未开始, 1 = 进行中, 2 = 已完成
  step3: { hash: string; status: 0 | 1 | 2 }; // 0 = 未开始, 1 = 进行中, 2 = 已完成
};

export interface SwapTransaction {
  txid: string;
  isPending: boolean;
  min: boolean;
  fromToken: Token;
  toToken: Token;
  amount: string;
  progress?: TxProgress;
}

export interface SwapStateType {
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  balances: object;
  ethBalances: object;
  bscBalances: object;
  hecoBalances: object;
  neolineNetwork: Network;
  metamaskNetworkId: number;
  transaction: SwapTransaction;
}

// export const NEO_SCRIPTHASH =
//   '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
export type ApproveContract = 'poly' | 'uniAggregator';
