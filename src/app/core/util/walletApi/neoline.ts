import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService, SwapService } from '@core';
import {
  Account,
  NeoWalletName,
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_IS_MAINNET,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
} from '@lib';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class NeolineWalletApiService {
  walletName: NeoWalletName = 'NeoLine';
  neolineDapi;

  account: Account;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService
  ) {
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapi = new (window as any).NEOLine.Init();
    });
  }

  connect(): boolean | void {
    if (this.neolineDapi === undefined) {
      this.swapService.toDownloadWallet(this.walletName);
      return;
    }
    this.neolineDapi
      .getAccount()
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
          this.initNeolineJs();
          this.getBalances();
        } else {
          this.nzMessage.error('Please connect to Neo wallet');
        }
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }

  getBalances(): void {
    this.neolineDapi
      .getBalance({
        params: [{ address: this.account.address }],
        network: 'TestNet',
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
        this.swapService.handleNeoDapiError(error, 'NeoLine');
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
    return this.neolineDapi
      .invoke({
        scriptHash: SWAP_CONTRACT_HASH,
        operation: 'DelegateSwapTokenInForTokenOut',
        args,
      })
      .then(({ txid }) => {
        const txHash = '0x' + txid;
        window.addEventListener(
          'NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED',
          (result: any) => {
            if (result.detail.txid === txHash) {
              this.getBalances();
            }
          }
        );
        return txHash;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }

  private initNeolineJs(): void {
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.account = result.detail;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.account,
        });
        this.getBalances();
      }
    );
    // this.neolineDapi.getNetworks().then((res) => {
    //   if ((res.defaultNetwork as string).toLowerCase().includes('test')) {
    //     this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: false });
    //     this.nzMessage.error('Please connect wallet to the main net.');
    //   } else {
    //     this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: true });
    //   }
    // });
    // window.addEventListener(
    //   'NEOLine.NEO.EVENT.NETWORK_CHANGED',
    //   (result: any) => {
    //     if (
    //       (result.detail.defaultNetwork as string)
    //         .toLowerCase()
    //         .includes('test')
    //     ) {
    //       this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: false });
    //       this.getBalances();
    //       this.nzMessage.error('Please connect wallet to the main net.');
    //     } else {
    //       this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: true });
    //     }
    //   }
    // );
  }
}
