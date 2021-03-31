import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import {
  NeoWalletName,
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_PENDING_TX,
  SWAP_CROSS_CHAIN_CONTRACT_HASH,
  SwapTransaction,
} from '@lib';
import { Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class O3NeoWalletApiService {
  walletName: NeoWalletName = 'O3';
  accountAddress: string;

  swap$: Observable<any>;
  transaction: SwapTransaction;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService
  ) {
    o3dapi.initPlugins([o3dapiNeo]);
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.transaction = Object.assign({}, state.transaction);
    });
  }

  connect(): void {
    o3dapi.NEO.getAccount()
      .then((result) => {
        // console.log(result);
        this.accountAddress = result.address;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.accountAddress,
        });
        this.store.dispatch({
          type: UPDATE_NEO_WALLET_NAME,
          data: this.walletName,
        });
        this.getBalances();
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
      params: [{ address: this.accountAddress }],
      network: 'MainNet',
    })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.accountAddress];
        const tempTokenBalance = {};
        tokens.forEach((tokenItem: any) => {
          tempTokenBalance[tokenItem.asset_id || tokenItem.assetID] = tokenItem;
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
    return o3dapi.NEO.invoke({
      scriptHash: SWAP_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOut',
      args,
    })
      .then(({ txid }) => {
        const txHash = '0x' + txid;
        const pendingTx: SwapTransaction = {
          txid: txHash,
          isPending: true,
          min: false,
          fromTokenName: fromToken.symbol,
          toTokenName:
            chooseSwapPath.swapPath[chooseSwapPath.swapPath.length - 1],
          amount: inputAmount,
        };
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
        o3dapi.NEO.addEventListener(
          o3dapi.NEO.Constants.EventName.TRANSACTION_CONFIRMED,
          (result) => {
            if (result.txid === txHash) {
              this.getBalances();
              this.transaction.isPending = false;
              this.store.dispatch({
                type: UPDATE_PENDING_TX,
                data: this.transaction,
              });
            }
          }
        );
        return txHash;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  async swapCrossChain(
    fromToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number,
    toAddress: string,
    isMix: boolean = false,
    crossAssetHash: string = ''
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
        value: this.swapService.getAssetHashPath(chooseSwapPath.swapPath),
      },
      {
        type: 'Integer',
        value: Math.floor(Date.now() / 1000 + deadline * 60),
      },
      {
        type: 'Integer',
        value: 0,
      },
      {
        type: 'Hash160',
        value: this.swapService.getHash160FromAddress(toAddress),
      },
      {
        type: 'Integer',
        value: 1,
      },
      {
        type: 'Integer',
        value: 56,
      },
      {
        type: 'Boolean',
        value: isMix,
      },
      {
        type: 'Hash160',
        value: crossAssetHash,
      },
    ];
    return o3dapi.NEO.invoke({
      scriptHash: SWAP_CROSS_CHAIN_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOutNCrossChain',
      args,
    })
      .then(({ txid }) => {
        const txHash = '0x' + txid;
        const pendingTx: SwapTransaction = {
          txid: txHash,
          isPending: true,
          min: false,
          fromTokenName: fromToken.symbol,
          toTokenName:
            chooseSwapPath.swapPath[chooseSwapPath.swapPath.length - 1],
          amount: inputAmount,
        };
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
        o3dapi.NEO.addEventListener(
          o3dapi.NEO.Constants.EventName.TRANSACTION_CONFIRMED,
          (result) => {
            if (result.txid === txHash) {
              this.getBalances();
              this.transaction.isPending = false;
              this.store.dispatch({
                type: UPDATE_PENDING_TX,
                data: this.transaction,
              });
            }
          }
        );
        return txHash;
      })
      .catch((error) => {
        console.log(error);
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }
}
