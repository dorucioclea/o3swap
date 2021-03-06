import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import { ApiService } from '../../api/api.service';
import {
  NeoWalletName,
  NEO_SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_PENDING_TX,
  SwapTransaction,
  NEO_NNEO_CONTRACT_HASH,
  NETWORK,
  SWAP_CONTRACT_CHAIN_ID,
} from '@lib';
import { interval, Observable } from 'rxjs';
import { wallet } from '@cityofzion/neon-js';
import BigNumber from 'bignumber.js';
import { take } from 'rxjs/operators';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class O3NeoWalletApiService {
  walletName: NeoWalletName = 'O3';
  accountAddress: string;
  o3DapiIsReady = false;

  swap$: Observable<any>;
  transaction: SwapTransaction;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService,
    private apiService: ApiService
  ) {
    o3dapi.initPlugins([o3dapiNeo]);
    o3dapi.NEO.addEventListener(o3dapi.NEO.Constants.EventName.READY, () => {
      this.o3DapiIsReady = true;
    });
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.transaction = Object.assign({}, state.transaction);
    });
  }

  init(): void {
    const localTxString = localStorage.getItem('transaction');
    if (localTxString === null || localTxString === undefined) {
      return;
    }
    const localTx: SwapTransaction = JSON.parse(localTxString);
    if (localTx.fromToken.chain !== 'NEO' || localTx.walletName !== 'O3') {
      return;
    }
    this.transaction = localTx;
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: localTx });
    if (localTx.isPending === false) {
      return;
    }
    const getTx = () => {
      if (this.o3DapiIsReady === false) {
        return;
      }
      o3dapi.NEO.getTransaction({
        txid: this.commonService.add0xHash(localTx.txid),
        network: NETWORK,
      })
        .then((result) => {
          if (intervalTx) {
            intervalTx.unsubscribe();
          }
          if (
            this.commonService.add0xHash(result.txid) ===
            this.commonService.add0xHash(localTx.txid)
          ) {
            this.getBalances();
            this.transaction.isPending = false;
            this.store.dispatch({
              type: UPDATE_PENDING_TX,
              data: this.transaction,
            });
          }
        })
        .catch((error) => {
          this.commonService.log(error);
        });
    };
    getTx();
    const intervalTx = interval(5000).subscribe(() => {
      getTx();
    });
  }

  connect(): Promise<string> {
    if (this.o3DapiIsReady === false) {
      this.nzMessage.info('O3 dAPI is not ready, please open O3 wallet before use.');
    }
    return o3dapi.NEO.getAccount()
      .then((result) => {
        this.commonService.log(result);
        if (!result.address) {
          return;
        }
        this.nzMessage.success('Connection succeeded!');
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
        return this.accountAddress;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  //#region NEO nNEO swap
  async mintNNeo(
    fromToken: Token, // neo
    toToken: Token, // nneo
    inputAmount: string
  ): Promise<string> {
    const checkBalance = await this.getBalances(fromToken.assetID, inputAmount);
    if (checkBalance !== true) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    return o3dapi.NEO.invoke({
      scriptHash: NEO_NNEO_CONTRACT_HASH,
      operation: 'mintTokens',
      args: [],
      attachedAssets: {
        NEO: inputAmount,
      },
    })
      .then(({ txid }) => {
        const txHash = this.commonService.add0xHash(txid);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          new BigNumber(inputAmount).shiftedBy(toToken.decimals).toFixed(),
          txHash
        );
        return txHash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  async releaseNeo(
    fromToken: Token, // nneo
    toToken: Token, // neo
    inputAmount: string,
    toAddress: string
  ): Promise<string> {
    const checkBalance = await this.getBalances(fromToken.assetID, inputAmount);
    if (checkBalance !== true) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const utxoRes = await this.apiService.getUtxo(toAddress, inputAmount);
    if (utxoRes === false) {
      this.nzMessage.error('System busy');
      return;
    }
    const params = {
      scriptHash: NEO_NNEO_CONTRACT_HASH,
      operation: 'refund',
      args: [
        {
          type: 'Address', // ???????????????
          value: toAddress,
        },
      ],
      assetIntentOverrides: {
        inputs: utxoRes.utxoList,
        outputs: [
          {
            address: wallet.getAddressFromScriptHash(NEO_NNEO_CONTRACT_HASH), // ????????????
            asset: toToken.assetID, // neo asset Id
            value: inputAmount,
          },
          // ???????????????????????????????????? getUxo????????? sum - amount
        ],
      },
      triggerContractVerification: false,
      extra_witness: [
        {
          invocationScript: '520131',
          verificationScript: '',
          scriptHash: NEO_NNEO_CONTRACT_HASH,
        },
      ],
    };
    if (utxoRes.sum > inputAmount) {
      params.assetIntentOverrides.outputs.push({
        address: wallet.getAddressFromScriptHash(NEO_NNEO_CONTRACT_HASH), // ????????????
        asset: toToken.assetID, // neo asset Id
        value: String(utxoRes.sum - Number(inputAmount)),
      });
    }
    return o3dapi.NEO.invoke(params)
      .then(({ txid }) => {
        const txHash = this.commonService.add0xHash(txid);
        this.handleTx(fromToken, toToken, inputAmount, inputAmount, txHash);
        return txHash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }
  //#endregion

  async swap(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number
  ): Promise<string> {
    const checkBalance = await this.getBalances(fromToken.assetID, inputAmount);
    if (checkBalance !== true) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const toNeoswapPath = await this.apiService.getToStandardSwapPath(
      fromToken,
      inputAmount
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
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
        value: this.swapService.getMinAmountOut(receiveAmount, slipValue),
      },
      {
        type: 'Array',
        value: chooseSwapPath.assetHashPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
        })),
      },
      {
        type: 'Array',
        value: toNeoswapPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
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
      scriptHash: NEO_SWAP_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOut',
      args,
    })
      .then(({ txid }) => {
        const txHash = this.commonService.add0xHash(txid);
        this.handleTx(fromToken, toToken, inputAmount, receiveAmount, txHash);
        return txHash;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  async swapCrossChain(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number,
    toAddress: string,
    isMix: boolean = false,
    crossAssetHash: string = ''
  ): Promise<string> {
    const checkBalance = await this.getBalances(fromToken.assetID, inputAmount);
    if (checkBalance !== true) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const toNeoswapPath = await this.apiService.getToStandardSwapPath(
      fromToken,
      inputAmount
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const args = [
      {
        type: 'Address', // sender (???????????????Hash)
        value: this.accountAddress,
      },
      {
        type: 'Integer', // amountIn (???????????????????????? ???????????????swap????????????)
        value: this.swapService.getAmountIn(fromToken, inputAmount),
      },
      {
        type: 'Integer', // amountOutMin (??????????????????????????????????????????)
        value: this.swapService.getMinAmountOut(receiveAmount, slipValue),
      },
      {
        type: 'Array', // paths (???????????? ??? ???????????? ?????????)
        value: chooseSwapPath.assetHashPath,
      },
      {
        type: 'Array', // toStandardTokenPaths (???????????? ??? nNeo(fUSDT) ???????????? ??????????????????nNeo, ????????? nNeo)
        value: toNeoswapPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
        })),
      },
      {
        type: 'Integer', // deadline (??????????????????????????????)
        value: Math.floor(Date.now() / 1000 + deadline * 60),
      },
      {
        type: 'Integer', // SwapWayIndex (??????Swap????????????????????????)
        value: 0,
      },
      {
        type: 'Hash160', // receiver (?????????????????????)
        value: this.swapService.getHash160FromAddress(toAddress),
      },
      {
        type: 'Integer', // toChainID (?????????id)
        value: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      },
      {
        type: 'Integer', // ProjectIndex (???????????????)
        value: 0,
      },
      // IsMix ????????????swap ????????????????????????????????????????????? ?????? nNeo -> fWETH, ???fWETH???????????????????????????????????? fWETH -> pxWETH
      // ???????????????????????? ?????????????????????Hash, ?????????????????? ????????????????????????
      {
        type: 'Boolean', // IsMix ???????????????????????????
        value: isMix,
      },
      {
        type: 'Hash160', // CrossAssetHash ??????????????????Hash???
        value: crossAssetHash,
      },
    ];
    return o3dapi.NEO.invoke({
      scriptHash: NEO_SWAP_CONTRACT_HASH,
      operation: 'DelegateSwapTokenInForTokenOutNCrossChain',
      args,
    })
      .then(({ txid }) => {
        const txHash = this.commonService.add0xHash(txid);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          txHash,
          false
        );
        return txHash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

  //#region private function
  private getBalances(
    fromTokenAssetId?: string,
    inputAmount?: string
  ): Promise<boolean> {
    if (NETWORK === 'TestNet') {
      this.store.dispatch({
        type: UPDATE_NEO_BALANCES,
        data: {},
      });
      return;
    }
    return o3dapi.NEO.getBalance({
      params: [{ address: this.accountAddress }],
      network: NETWORK,
    })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.accountAddress] || [];
        const tempTokenBalance = {};
        tokens.forEach((tokenItem: any) => {
          tempTokenBalance[tokenItem.asset_id || tokenItem.assetID] = tokenItem;
        });
        this.store.dispatch({
          type: UPDATE_NEO_BALANCES,
          data: tempTokenBalance,
        });
        if (
          tempTokenBalance[fromTokenAssetId] &&
          new BigNumber(tempTokenBalance[fromTokenAssetId].amount).comparedTo(
            new BigNumber(inputAmount)
          ) >= 0
        ) {
          return true;
        } else {
          return false;
        }
      })
      .catch((error) => {
        this.commonService.log(error);
      });
  }

  private handleTx(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    receiveAmount: string,
    txHash: string,
    addLister = true
  ): void {
    const pendingTx: SwapTransaction = {
      txid: this.commonService.remove0xHash(txHash),
      isPending: true,
      min: false,
      fromToken,
      toToken,
      amount: inputAmount,
      receiveAmount: new BigNumber(receiveAmount)
        .shiftedBy(-toToken.decimals)
        .toFixed(),
      walletName: 'O3',
    };
    if (addLister === false) {
      pendingTx.progress = {
        step1: { hash: '', status: 1 },
        step2: { hash: '', status: 0 },
        step3: { hash: '', status: 0 },
      };
    }
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
    if (addLister) {
      o3dapi.NEO.addEventListener(
        o3dapi.NEO.Constants.EventName.TRANSACTION_CONFIRMED,
        (result) => {
          this.commonService.log(result);
          if ((txHash as string).includes(result.txid)) {
            this.getBalances();
            this.transaction.isPending = false;
            this.store.dispatch({
              type: UPDATE_PENDING_TX,
              data: this.transaction,
            });
          }
        }
      );
    }
  }
  //#endregion
}
