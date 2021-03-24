import {
  UPDATE_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_DAPI_JS,
  UPDATE_NEO_IS_MAINNET,
  RESET_NEO_ACCOUNT,
} from '@lib';

const initialState = {
  neoDapi: null,
  account: null,
  balances: {},
  isMainNet: null,
};

export default function swap(state = initialState, action): any {
  switch (action.type) {
    case RESET_NEO_ACCOUNT:
      return initialState;
    case UPDATE_NEO_DAPI_JS:
      return { ...state, neoDapi: action.data };
    case UPDATE_ACCOUNT:
      return { ...state, account: action.data };
    case UPDATE_NEO_BALANCES:
      return { ...state, balances: action.data };
    case UPDATE_NEO_IS_MAINNET:
      return { ...state, isMainNet: action.data };
    default:
      return state;
  }
}
