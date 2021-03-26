import { Injectable } from '@angular/core';
import {
  EthWalletName,
  SwapStateType,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_METAMASK_CHAIN_ID,
} from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { SwapService } from '../swap.service';
interface State {
  swap: SwapStateType;
}
@Injectable()
export class MetaMaskWalletApiService {
  myWalletName: EthWalletName = 'MetaMask';
  accountAddress: string;

  swap$: Observable<any>;
  ethWalletName: EthWalletName;

  ethereum;
  isConnected: boolean;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService
  ) {
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.ethWalletName = state.ethWalletName;
    });
  }

  connect(): void {
    if (!(window as any).ethereum) {
      this.swapService.toDownloadWallet(this.myWalletName);
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
          data: this.myWalletName,
        });
        this.addListener();
      })
      .catch((error) => {
        this.nzMessage.error(error.message);
      });
  }

  addListener(): void {
    this.ethereum
      .request({ method: 'net_version' })
      .then((chainId) => {
        this.store.dispatch({
          type: UPDATE_METAMASK_CHAIN_ID,
          data: chainId,
        });
      })
      .catch((error) => {
        this.nzMessage.error(error.message);
      });
    this.ethereum.on('accountsChanged', (accounts) => {
      this.accountAddress = accounts.length > 0 ? accounts[0] : null;
      this.store.dispatch({
        type: UPDATE_ETH_ACCOUNT,
        data: this.accountAddress,
      });
      if (
        this.accountAddress === null &&
        this.ethWalletName === this.myWalletName
      ) {
        this.store.dispatch({
          type: UPDATE_ETH_WALLET_NAME,
          data: null,
        });
      }
    });
    this.ethereum.on('chainChanged', (chainId) => {
      this.store.dispatch({
        type: UPDATE_METAMASK_CHAIN_ID,
        data: chainId,
      });
    });
  }
}
