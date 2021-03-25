import {
  SwapStateType,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_IS_MAINNET,
  RESET_NEO_BALANCES,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_NEO_WALLET_NAME,
} from '@lib';

const initialState: SwapStateType = {
  neoWalletName: null,
  neoAccount: null,
  balances: {},
  isMainNet: true,
  ethWalletName: null,
  ethAccount: null,
};

export default function swap(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_NEO_WALLET_NAME:
      return { ...state, neoWalletName: action.data };
    case UPDATE_ETH_WALLET_NAME:
      return { ...state, ethWalletName: action.data };
    case UPDATE_NEO_ACCOUNT:
      return { ...state, neoAccount: action.data };
    case UPDATE_NEO_BALANCES:
      return { ...state, balances: action.data };
    case RESET_NEO_BALANCES:
      return { ...state, balances: {} };
    case UPDATE_NEO_IS_MAINNET:
      return { ...state, isMainNet: action.data };
    default:
      return state;
  }
}
