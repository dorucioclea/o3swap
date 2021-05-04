import { RESET_VAULT_WALLET, UPDATE_VAULT_STAKE_PENDING_TX, UPDATE_VAULT_WALLET } from '@lib';

const initialState = {
  vaultWallet: null,
  // {
  //   walletName: null,
  //   address: null,
  //   chain: null,
  // },
};

export default function vault(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_VAULT_WALLET:
      setSessionStorage('valueWallet', action.data);
      return { ...state, vaultWallet: action.data };
    case RESET_VAULT_WALLET:
      setSessionStorage('valueWallet', null);
      return { ...state, vaultWallet: null };
    case UPDATE_VAULT_STAKE_PENDING_TX:
      setlocalStorage('vaultStakeTransaction', action.data);
      return { ...state, liquidityTransaction: action.data };
    default:
      return state;
  }
}

function setSessionStorage(key: string, value: string): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function setlocalStorage(key: string, value: string): void {
  localStorage.setItem(key, JSON.stringify(value));
}
