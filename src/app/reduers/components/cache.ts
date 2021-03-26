import { ADD_TX, CONFIRMED_TX } from '@lib';

const initialState = {
  txStatus: {},
};

export default function cache(state = initialState, action): any {
  switch (action.type) {
    case CONFIRMED_TX:
      return {
        ...state,
        txStatus: confirmedTx(state.txStatus, action.data),
      };
    case ADD_TX:
      return {
        ...state,
        txStatus: addTx(state.txStatus, action.data),
      };
    default:
      return state;
  }
}

function confirmedTx(txs, newTxid): any {
  const res = Object.assign({}, txs);
  res[newTxid] = true;
  return res;
}

function addTx(txs, newTxid): any {
  const res = Object.assign({}, txs);
  res[newTxid] = false;
  return res;
}
