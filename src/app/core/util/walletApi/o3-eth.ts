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

  connect(): void {
    o3dapi.ETH.request({ method: 'eth_requestAccounts' })
      .then((res) => {
        // console.log(res);
        this.accountAddress = res.result[0];
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
        if (error.type) {
          this.handleDapiError(error);
        } else {
          this.nzMessage.error(error.message);
        }
      });
  }
  addListener(): void {
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
  handleDapiError(error): void {
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
}
