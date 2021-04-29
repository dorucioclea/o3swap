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
import { interval, Observable, Unsubscribable } from 'rxjs';
import { wallet } from '@cityofzion/neon-js';
import BigNumber from 'bignumber.js';
import { take } from 'rxjs/operators';
import { RpcApiService } from '../../api/rpc.service';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class O3NeoWalletApiService {
  walletName: NeoWalletName = 'O3';
  o3DapiIsReady = false;

  swap$: Observable<any>;
  transaction: SwapTransaction;
  neoAccountAddress: string;

  listerTxinterval: Unsubscribable;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService,
    private apiService: ApiService,
    private rpcApiService: RpcApiService
  ) {
    o3dapi.initPlugins([o3dapiNeo]);
    o3dapi.NEO.addEventListener(o3dapi.NEO.Constants.EventName.READY, () => {
      this.o3DapiIsReady = true;
    });
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.transaction = Object.assign({}, state.transaction);
      this.neoAccountAddress = state.neoAccountAddress;
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
    this.listerTxReceipt(localTx);
  }

  connect(): Promise<string> {
    if (this.o3DapiIsReady === false) {
      this.nzMessage.info(
        'O3 dAPI is not ready, please open O3 wallet before use.'
      );
    }
    return o3dapi.NEO.getAccount()
      .then((result) => {
        this.commonService.log(result);
        if (!result.address) {
          return;
        }
        this.nzMessage.success('Connection succeeded!');
        this.neoAccountAddress = result.address;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.neoAccountAddress,
        });
        this.store.dispatch({
          type: UPDATE_NEO_WALLET_NAME,
          data: this.walletName,
        });
        this.getBalances();
        return this.neoAccountAddress;
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
          type: 'Address', // 收件人地址
          value: toAddress,
        },
      ],
      assetIntentOverrides: {
        inputs: utxoRes.utxoList,
        outputs: [
          {
            address: wallet.getAddressFromScriptHash(NEO_NNEO_CONTRACT_HASH), // 合约地址
            asset: toToken.assetID, // neo asset Id
            value: inputAmount,
          },
          // 还有可能会有找零。应该是 getUxo得到的 sum - amount
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
        address: wallet.getAddressFromScriptHash(NEO_NNEO_CONTRACT_HASH), // 合约地址
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
        value: this.neoAccountAddress,
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
        type: 'Address', // sender (用户小端序Hash)
        value: this.neoAccountAddress,
      },
      {
        type: 'Integer', // amountIn (用户的输入额度， 不包含聚合swap的手续费)
        value: this.swapService.getAmountIn(fromToken, inputAmount),
      },
      {
        type: 'Integer', // amountOutMin (用户允许获得的代币数量最小值)
        value: this.swapService.getMinAmountOut(receiveAmount, slipValue),
      },
      {
        type: 'Array', // paths (输入资产 到 输出资产 的路径)
        value: chooseSwapPath.assetHashPath,
      },
      {
        type: 'Array', // toStandardTokenPaths (输入资产 到 nNeo(fUSDT) 的路径， 如输入资产为nNeo, 则仅为 nNeo)
        value: toNeoswapPath.map((assetHash) => ({
          type: 'Hash160',
          value: assetHash,
        })),
      },
      {
        type: 'Integer', // deadline (交易有效的截止时间戳)
        value: Math.floor(Date.now() / 1000 + deadline * 60),
      },
      {
        type: 'Integer', // SwapWayIndex (采取Swap的交易平台序列号)
        value: 0,
      },
      {
        type: 'Hash160', // receiver (目标链收款地址)
        value: this.swapService.getHash160FromAddress(toAddress),
      },
      {
        type: 'Integer', // toChainID (目标链id)
        value: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      },
      {
        type: 'Integer', // ProjectIndex (项目序列号)
        value: 0,
      },
      // IsMix 表示是否swap 后得到的资产通过混币器后跨链， 例如 nNeo -> fWETH, 但fWETH无法跨链，通过混币器转换 fWETH -> pxWETH
      // 如果使用混币器， 则填入跨链资产Hash, 如果不使用， 内容可以任意填写
      {
        type: 'Boolean', // IsMix （是否通过混币器）
        value: isMix,
      },
      {
        type: 'Hash160', // CrossAssetHash （混币原资产Hash）
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
  private listerTxReceipt(tx: SwapTransaction): void {
    const getTx = () => {
      this.rpcApiService
        .getO3TxByHash(tx.txid)
        .then((txid) => {
          if (
            this.commonService.add0xHash(txid) ===
            this.commonService.add0xHash(this.transaction.txid)
          ) {
            if (this.listerTxinterval) {
              this.listerTxinterval.unsubscribe();
            }
            this.transaction.isPending = false;
            this.store.dispatch({
              type: UPDATE_PENDING_TX,
              data: this.transaction,
            });
            this.getBalances();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };
    getTx();
    if (this.listerTxinterval) {
      this.listerTxinterval.unsubscribe();
    }
    this.listerTxinterval = interval(5000).subscribe(() => {
      getTx();
    });
  }

  private getBalances(
    fromTokenAssetId?: string,
    inputAmount?: string
  ): Promise<boolean> {
    if (this.o3DapiIsReady === false) {
      return;
    }
    if (NETWORK === 'TestNet') {
      this.store.dispatch({
        type: UPDATE_NEO_BALANCES,
        data: {},
      });
      return;
    }
    return this.rpcApiService
      .getO3TokenBalance(this.neoAccountAddress)
      .then((addressTokens) => {
        this.store.dispatch({
          type: UPDATE_NEO_BALANCES,
          data: addressTokens,
        });
        if (
          addressTokens[fromTokenAssetId] &&
          new BigNumber(addressTokens[fromTokenAssetId].amount).comparedTo(
            new BigNumber(inputAmount)
          ) >= 0
        ) {
          return true;
        } else {
          return false;
        }
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
      this.listerTxReceipt(this.transaction);
    }
  }
  //#endregion
}
