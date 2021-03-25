import { Injectable } from '@angular/core';
import {
  EthWalletName,
  SwapStateType,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
} from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class MetaMaskWalletApiService {
  walletName: EthWalletName = 'MetaMask';
  accountAddress: string;

  ethereum;
  isConnected: boolean;
  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService
  ) {}

  connect(): void {
    if (!(window as any).ethereum) {
      this.swapService.toDownloadWallet(this.walletName);
      return;
    }
    this.ethereum = (window as any).ethereum;
    this.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((result) => {
        this.accountAddress = result[0];
        this.store.dispatch({
          type: UPDATE_ETH_ACCOUNT,
          data: this.accountAddress,
        });
        this.store.dispatch({
          type: UPDATE_ETH_WALLET_NAME,
          data: this.walletName,
        });
        this.addListener();
      })
      .catch((error) => {
        this.nzMessage.error(error.message);
      });
  }

  addListener(): void {
    this.ethereum.on('accountsChanged', (accounts) => {
      this.accountAddress = accounts.length > 0 ? accounts[0] : null;
      this.store.dispatch({
        type: UPDATE_ETH_ACCOUNT,
        data: this.accountAddress,
      });
      if (this.accountAddress === null) {
        this.store.dispatch({
          type: UPDATE_ETH_WALLET_NAME,
          data: null,
        });
      }
    });
  }
}
