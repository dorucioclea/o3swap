import {
  SwapStateType,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  RESET_NEO_BALANCES,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_NEO_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_METAMASK_NETWORK_ID,
  UPDATE_NEOLINE_NETWORK,
  UPDATE_PENDING_TX,
  CrossChainToToken,
} from '@lib';

const initialState: SwapStateType = {
  neoWalletName: null,
  ethWalletName: null,
  neoAccountAddress: null,
  ethAccountAddress: null,
  balances: {}, // neo 链连接钱包的balances
  neolineNetwork: null,
  metamaskNetworkId: null,
  transaction: null,
  // transaction: {
  //   txid: '0f4787014a5442fc02843dc376548fa7a4dd400a92850f783873b034d84dccd5',
  //   isPending: true,
  //   min: false,
  //   fromTokenName: 'nNEO',
  //   toToken: CrossChainToToken,
  //   amount: '100',
  // },
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

    case UPDATE_NEOLINE_NETWORK:
      return { ...state, neolineNetwork: action.data };
    case UPDATE_METAMASK_NETWORK_ID:
      return { ...state, metamaskNetworkId: action.data };

    case UPDATE_PENDING_TX:
      return { ...state, transaction: action.data };
    default:
      return state;
  }
}
