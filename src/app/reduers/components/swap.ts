import {
  SwapStateType,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  RESET_NEO_BALANCES,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_NEO_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_METAMASK_CHAIN_ID,
  UPDATE_NEOLINE_IS_MAINNET,
} from '@lib';

const initialState: SwapStateType = {
  neoWalletName: null,
  ethWalletName: null,
  neoAccountAddress: null,
  ethAccountAddress: null,
  balances: {}, // neo 链连接钱包的balances
  neolineIsMainNet: true,
  metamaskIsMainNet: true,
};

export default function swap(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_NEO_WALLET_NAME:
      return { ...state, neoWalletName: action.data };
    case UPDATE_ETH_WALLET_NAME:
      return { ...state, ethWalletName: action.data };

    case UPDATE_NEO_ACCOUNT:
      return { ...state, neoAccountAddress: action.data };
    case UPDATE_ETH_ACCOUNT:
      return { ...state, ethAccountAddress: action.data };

    case UPDATE_NEO_BALANCES:
      return { ...state, balances: action.data };
    case RESET_NEO_BALANCES:
      return { ...state, balances: {} };

    case UPDATE_NEOLINE_IS_MAINNET:
      return { ...state, neolineIsMainNet: action.data };
    case UPDATE_METAMASK_CHAIN_ID:
      return { ...state, metamaskIsMainNet: action.data };
    default:
      return state;
  }
}
