import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import {
  Account,
  NeoWalletName,
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
} from '@lib';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class O3WalletApiService {
  walletName: NeoWalletName = 'O3';

  account: Account;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService
  ) {
    o3dapi.initPlugins([o3dapiNeo]);
  }

  connect(): boolean | void {
    o3dapi.NEO.getAccount()
      .then((result) => {
        // console.log(result);
        if (this.commonService.isNeoAddress(result.address)) {
          this.account = result;
          this.store.dispatch({
            type: UPDATE_NEO_ACCOUNT,
            data: this.account,
          });
          this.store.dispatch({
            type: UPDATE_NEO_WALLET_NAME,
            data: this.walletName,
          });
          this.getBalances();
        } else {
          this.nzMessage.error('Please connect to Neo wallet');
        }
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  getBalances(): void {
    this.store.dispatch({
      type: UPDATE_NEO_BALANCES,
      data: {},
    });
    return;
    o3dapi.NEO.getBalance({
      params: [{ address: this.account.address }],
      network: 'MainNet',
    })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.account.address];
        const tempTokenBalance = {};
        tokens.forEach((tokenItem: any) => {
          tempTokenBalance[tokenItem.assetID] = tokenItem;
        });
        this.store.dispatch({
          type: UPDATE_NEO_BALANCES,
          data: tempTokenBalance,
        });
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  async swap(
    fromToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number
  ): Promise<string> {
    const toNeoswapPath = await this.swapService.getToNeoSwapPath(
      fromToken,
      inputAmount
    );
    const args = [
      {
        type: 'Address',
        value: this.account.address,
      },
      {
        type: 'Integer',
        value: this.swapService.getAmountIn(fromToken, inputAmount),
      },
      {
        type: 'Integer',
        value: this.swapService.getAmountOutMin(chooseSwapPath, slipValue),
      },
      {
        type: 'Array',
        value: chooseSwapPath.swapPath.map((assetName) => ({
          type: 'Hash160',
          value: this.swapService.getNeoAssetHashByName(assetName),
        })),
      },
      {
        type: 'Array',
        value: toNeoswapPath.map((assetName) => ({
          type: 'Hash160',
          value: this.swapService.getNeoAssetHashByName(assetName),
        })),
      },
      {
        type: 'Integer',
        value: Math.floor(Date.now() / 1000 + deadline * 60),
      },
      {
        type: 'Integer',
        value: 0,
      },
    ];
    return o3dapi.NEO.invoke({
      scriptHash: SWAP_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOut',
      args,
    })
      .then(({ txid }) => {
        const txHash = '0x' + txid;
        o3dapi.NEO.addEventListener(
          o3dapi.NEO.Constants.EventName.TRANSACTION_CONFIRMED,
          (result) => {
            if (result.txid === txHash) {
              this.getBalances();
            }
          }
        );
        return txHash;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }
}
