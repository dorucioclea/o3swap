import { NeoWalletName, EthWalletName } from './wallet';

export interface SwapTransaction {
  txid: string;
  isPending: boolean;
  min: boolean;
  fromTokenName: string;
  toTokenName: string;
  amount: string;
}
export interface SwapStateType {
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  neoAccountAddress: string;
  ethAccountAddress: string;
  balances: object;
  neolineIsMainNet: boolean;
  metamaskIsMainNet: boolean;
  transaction: SwapTransaction;
}

export const SWAP_CONTRACT_HASH = '0x7a10eeaaf99871fe0a9a39ebd027c97705585666';
export const SWAP_CROSS_CHAIN_CONTRACT_HASH =
  '0x812d7291e2f0c89255cf355c1027872257d1ca37';
export const O3SWAP_FEE_PERCENTAGE = 0.3; // 系统收费 0.3%
export const ALL_PERCENTAGE = 1.003;

// export const NEO_SCRIPTHASH =
//   '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
