import { UPDATE_WALLET_TYPE, WalletType, Chain } from '@lib';

interface StateType {
  walletType: WalletType;
  chain: Chain;
}

const initialState: StateType = {
  walletType: null,
  chain: 'neo',
};

export default function wallet(state: StateType = initialState, action): any {
  switch (action.type) {
    case UPDATE_WALLET_TYPE:
      return { ...state, walletType: action.data };
    default:
      return state;
  }
}
