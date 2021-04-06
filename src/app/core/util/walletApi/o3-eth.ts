import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import o3dapiEth from 'o3-dapi-eth';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import {
  NeoWalletName,
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
} from '@lib';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class O3EthWalletApiService {
  walletName: NeoWalletName = 'O3';
  accountAddress: string;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService
  ) {
    o3dapi.initPlugins([o3dapiEth]);
  }

  connect(chain: string): void {
    o3dapi.ETH.request({ method: 'eth_requestAccounts' })
      .then((res) => {
        this.commonService.log(res);
        this.accountAddress = res.result[0];
        let dispatchAccountType;
        let dispatchWalletNameType;
        switch (chain) {
          case 'ETH':
            dispatchAccountType = UPDATE_ETH_ACCOUNT;
            dispatchWalletNameType = UPDATE_ETH_WALLET_NAME;
            break;
          case 'BSC':
            dispatchAccountType = UPDATE_BSC_ACCOUNT;
            dispatchWalletNameType = UPDATE_BSC_WALLET_NAME;
            break;
          case 'HECO':
            dispatchAccountType = UPDATE_HECO_ACCOUNT;
            dispatchWalletNameType = UPDATE_HECO_WALLET_NAME;
            break;
        }
        this.store.dispatch({
          type: dispatchAccountType,
          data: this.accountAddress,
        });
        this.store.dispatch({
          type: dispatchWalletNameType,
          data: this.walletName,
        });
        this.addListener();
      })
      .catch((error) => {
        if (error.type) {
          this.handleDapiError(error);
        } else {
          this.nzMessage.error(error.message);
        }
      });
  }

  //#region
  private addListener(): void {
    // o3dapi.ETH.addEventListener(
    //   o3dapi.ETH.Constants.EventName.CONNECTED,
    //   (res) => {
    //     this.accountAddress = res.result.length > 0 ? res.result[0] : null;
    //     this.store.dispatch({
    //       type: UPDATE_ETH_ACCOUNT,
    //       data: this.accountAddress,
    //     });
    //     if (this.accountAddress === null) {
    //       this.store.dispatch({
    //         type: UPDATE_ETH_WALLET_NAME,
    //         data: null,
    //       });
    //     }
    //   }
    // );
  }

  private handleDapiError(error): void {
    switch (error.type) {
      case 'NO_PROVIDER':
        this.swapService.toDownloadWallet(this.walletName);
        break;
      case 'CONNECTION_DENIED':
        this.nzMessage.error(
          'The user rejected the request to connect with your dApp'
        );
        break;
      default:
        this.nzMessage.error(error.type);
        break;
    }
  }
  //#endregion
}
