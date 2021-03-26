import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';
import { CommonService } from '../common.service';
import {
  NeoWalletName,
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEOLINE_IS_MAINNET,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
} from '@lib';
import { Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class NeolineWalletApiService {
  myWalletName: NeoWalletName = 'NeoLine';
  accountAddress: string;

  swap$: Observable<any>;
  neoWalletName: NeoWalletName;

  neolineDapi;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService
  ) {
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.neoWalletName = state.neoWalletName;
    });
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapi = new (window as any).NEOLine.Init();
    });
  }

  connect(): void {
    if (this.neolineDapi === undefined) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    this.neolineDapi
      .getAccount()
      .then((result) => {
        // console.log(result);
        this.accountAddress = result.address;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.accountAddress,
        });
        this.store.dispatch({
          type: UPDATE_NEO_WALLET_NAME,
          data: this.myWalletName,
        });
        this.addListener();
        this.getBalances();
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }

  getBalances(): void {
    this.neolineDapi
      .getBalance({
        params: [{ address: this.accountAddress }],
        network: 'TestNet',
      })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.accountAddress];
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
        value: this.accountAddress,
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

  private addListener(): void {
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.accountAddress = result.detail.address;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.accountAddress,
        });
        if (this.neoWalletName === this.myWalletName) {
          this.getBalances();
        }
      }
    );
    // this.neolineDapi.getNetworks().then((res) => {
    //   if ((res.defaultNetwork as string).toLowerCase().includes('test')) {
    //     this.store.dispatch({ type: UPDATE_NEOLINE_IS_MAINNET, data: false });
    //     this.nzMessage.error('Please switch network to MainNet on NeoLine wallet.');
    //   } else {
    //     this.store.dispatch({ type: UPDATE_NEOLINE_IS_MAINNET, data: true });
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
    //       this.store.dispatch({ type: UPDATE_NEOLINE_IS_MAINNET, data: false });
    //       this.getBalances();
    //       this.nzMessage.error('Please switch network to MainNet on NeoLine wallet.');
    //     } else {
    //       this.store.dispatch({ type: UPDATE_NEOLINE_IS_MAINNET, data: true });
    //     }
    //   }
    // );
  }
}
