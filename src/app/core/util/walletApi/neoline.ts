import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';
import { CommonService } from '../common.service';
import { ApiService } from '../../api/api.service';
import {
  NeoWalletName,
  NEO_SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEOLINE_NETWORK,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_PENDING_TX,
  SwapTransaction,
  NEO_NNEO_CONTRACT_HASH,
  Network,
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
export class NeolineWalletApiService {
  myWalletName: NeoWalletName = 'NeoLine';

  swap$: Observable<any>;
  neoWalletName: NeoWalletName;
  neoAccountAddress: string;
  transaction: SwapTransaction;
  neolineNetwork: Network;

  neolineDapi;
  listerTxinterval: Unsubscribable;
  blockNumberInterval: Unsubscribable;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private apiService: ApiService,
    private rpcApiService: RpcApiService
  ) {
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.neoWalletName = state.neoWalletName;
      this.neoAccountAddress = state.neoAccountAddress;
      this.transaction = Object.assign({}, state.transaction);
      this.neolineNetwork = state.neolineNetwork;
    });
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapi = new (window as any).NEOLine.Init();
    });
  }

  //#region connect
  init(): void {
    // local transaction
    const localTxString = localStorage.getItem('transaction');
    if (localTxString) {
      this.handleLocalTx(localTxString);
    }
    // auto connect
    const sessionNeoWalletName = sessionStorage.getItem(
      'neoWalletName'
    ) as NeoWalletName;
    if (sessionNeoWalletName !== 'NeoLine') {
      return;
    }
    const autoConnectInterval = interval(1000)
      .pipe(take(5))
      .subscribe(() => {
        if (this.neolineDapi) {
          autoConnectInterval.unsubscribe();
          this.connect(false);
        }
      });
  }

  connect(showMessage = true): Promise<string> {
    if (this.neolineDapi === undefined) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    return this.neolineDapi
      .getAccount()
      .then((result) => {
        if (showMessage) {
          this.nzMessage.success('Connection succeeded!');
        }
        this.commonService.log(result);
        this.neoAccountAddress = result.address;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.neoAccountAddress,
        });
        this.store.dispatch({
          type: UPDATE_NEO_WALLET_NAME,
          data: this.myWalletName,
        });
        this.addListener();
        this.getBalances();
        this.listenBlockNumber();
        return this.neoAccountAddress;
      })
      .catch((error) => {
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }
  //#endregion

  //#region NEO nNEO swap
  async mintNNeo(
    fromToken: Token, // neo
    toToken: Token, // nneo
    inputAmount: string
  ): Promise<string> {
    if (this.checkNetwork() === false) {
      return;
    }
    const checkBalance = await this.getBalances(fromToken.assetID, inputAmount);
    if (checkBalance !== true) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    return this.neolineDapi
      .invoke({
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
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }

  async releaseNeo(
    fromToken: Token, // nneo
    toToken: Token, // neo
    inputAmount: string,
    toAddress: string
  ): Promise<string> {
    if (this.checkNetwork() === false) {
      return;
    }
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
    return this.neolineDapi
      .invoke(params)
      .then(({ txid }) => {
        const txHash = this.commonService.add0xHash(txid);
        this.handleTx(fromToken, toToken, inputAmount, inputAmount, txHash);
        return txHash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }
  //#endregion

  //#region swap
  async swap(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    slipValue: number,
    deadline: number
  ): Promise<string> {
    if (this.checkNetwork() === false) {
      return;
    }
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
    return this.neolineDapi
      .invoke({
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
        this.commonService.log(error);
        this.swapService.handleNeoDapiError(error, 'NeoLine');
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
    if (this.checkNetwork() === false) {
      return;
    }
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
        value: chooseSwapPath.assetHashPath,
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
      {
        type: 'Hash160',
        value: this.swapService.getHash160FromAddress(toAddress),
      },
      {
        type: 'Integer', // toChainID (目标链id)
        value: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      },
      {
        type: 'Integer',
        value: 0,
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
    return this.neolineDapi
      .invoke({
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
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }
  //#endregion

  //#region private function
  handleLocalTx(localTxString: string): void {
    if (localTxString === null || localTxString === undefined) {
      return;
    }
    const localTx: SwapTransaction = JSON.parse(localTxString);
    if (localTx.fromToken.chain !== 'NEO' || localTx.walletName !== 'NeoLine') {
      return;
    }
    this.transaction = localTx;
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: localTx });
    if (localTx.isPending === false) {
      return;
    }
    this.listerTxReceipt(localTx);
  }

  private listenBlockNumber(): void {
    if (this.blockNumberInterval) {
      return;
    }
    this.blockNumberInterval = interval(15000).subscribe(() => {
      this.getBalances();
      // 没有连接时不获取 balances
      if (this.neoWalletName !== 'NeoLine') {
        this.blockNumberInterval.unsubscribe();
      }
    });
  }

  private getBalances(
    fromTokenAssetId?: string,
    inputAmount?: string
  ): Promise<boolean> {
    if (!this.neolineDapi) {
      return;
    }
    return this.rpcApiService
      .getNeoLineTokenBalance(this.neoAccountAddress)
      .then((addressTokens) => {
        if (this.neoWalletName !== this.myWalletName) {
          return;
        }
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

  private checkNetwork(): boolean {
    if (this.neolineNetwork !== NETWORK) {
      this.nzMessage.error(
        `Please switch network to ${NETWORK} on NeoLine extension.`
      );
      return false;
    }
    return true;
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
      walletName: 'NeoLine',
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

  private listerTxReceipt(tx: SwapTransaction): void {
    const getTx = () => {
      this.rpcApiService
        .getNeoLineTxByHash(tx.txid)
        .then((result) => {
          if (
            this.commonService.add0xHash(result.txid) ===
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

  private addListener(): void {
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.neoAccountAddress = result.detail.address;
        this.store.dispatch({
          type: UPDATE_NEO_ACCOUNT,
          data: this.neoAccountAddress,
        });
        if (this.neoWalletName === this.myWalletName) {
          this.getBalances();
        }
      }
    );
    this.neolineDapi.getNetworks().then((res) => {
      this.neolineNetwork = res.defaultNetwork;
      this.store.dispatch({
        type: UPDATE_NEOLINE_NETWORK,
        data: this.neolineNetwork,
      });
      if (NETWORK === this.neolineNetwork) {
        this.getBalances();
      }
    });
    window.addEventListener(
      'NEOLine.NEO.EVENT.NETWORK_CHANGED',
      (result: any) => {
        this.neolineNetwork = result.detail.defaultNetwork;
        this.store.dispatch({
          type: UPDATE_NEOLINE_NETWORK,
          data: this.neolineNetwork,
        });
        if (NETWORK === this.neolineNetwork) {
          this.getBalances();
        }
      }
    );
  }
  //#endregion
}
