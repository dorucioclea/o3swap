import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SwapService } from '../swap.service';
import { CommonService } from '../common.service';
import { ApiService } from '../../api/api.service';
import {
  NeoWalletName,
  SWAP_CONTRACT_HASH,
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
  NeolineNetwork,
  NEOLINE_NETWORK,
} from '@lib';
import { Observable } from 'rxjs';
import { wallet } from '@cityofzion/neon-js';
import BigNumber from 'bignumber.js';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class NeolineWalletApiService {
  myWalletName: NeoWalletName = 'NeoLine';
  accountAddress: string;

  swap$: Observable<any>;
  neoWalletName: NeoWalletName;
  transaction: SwapTransaction;
  neolineNetwork: NeolineNetwork;

  neolineDapi;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private apiService: ApiService
  ) {
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.neoWalletName = state.neoWalletName;
      this.transaction = Object.assign({}, state.transaction);
      this.neolineNetwork = state.neolineNetwork;
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

  getBalances(
    fromTokenAssetId?: string,
    inputAmount?: string
  ): Promise<boolean> {
    return this.neolineDapi
      .getBalance({
        params: [{ address: this.accountAddress }],
        network: NEOLINE_NETWORK,
      })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.accountAddress];
        // console.log(tokens);
        const tempTokenBalance = {};
        tokens.forEach((tokenItem: any) => {
          tempTokenBalance[tokenItem.asset_id || tokenItem.assetID] = tokenItem;
        });
        // console.log('temp: ' + tempTokenBalance);
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
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }

  checkNetwork(): boolean {
    if (this.neolineNetwork !== NEOLINE_NETWORK) {
      this.nzMessage.error(
        `Please switch network to ${NEOLINE_NETWORK} on NeoLine wallet.`
      );
      return false;
    }
    return true;
  }

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
        const txHash = (txid as string).startsWith('0x') ? txid : '0x' + txid;
        const pendingTx: SwapTransaction = {
          txid: txHash,
          isPending: true,
          min: false,
          fromTokenName: fromToken.symbol,
          toToken,
          amount: inputAmount,
        };
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
        window.addEventListener(
          'NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED',
          (result: any) => {
            // console.log(result.detail.txid);
            if (result.detail.txid === txHash) {
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
        const txHash = (txid as string).startsWith('0x') ? txid : '0x' + txid;
        const pendingTx: SwapTransaction = {
          txid: txHash,
          isPending: true,
          min: false,
          fromTokenName: fromToken.symbol,
          toToken,
          amount: inputAmount,
        };
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
        window.addEventListener(
          'NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED',
          (result: any) => {
            // console.log(result.detail.txid);
            if (result.detail.txid === txHash) {
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
        this.swapService.handleNeoDapiError(error, 'NeoLine');
      });
  }

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
    const toNeoswapPath = await this.swapService.getToStandSwapPath(
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
        const txHash = (txid as string).startsWith('0x') ? txid : '0x' + txid;
        const pendingTx: SwapTransaction = {
          txid: txHash,
          isPending: true,
          min: false,
          fromTokenName: fromToken.symbol,
          toToken,
          amount: inputAmount,
        };
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
        window.addEventListener(
          'NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED',
          (result: any) => {
            // console.log(result.detail.txid);
            if (result.detail.txid === txHash) {
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
    const toNeoswapPath = await this.swapService.getToStandSwapPath(
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
        value: this.swapService.getAssetHashPath(chooseSwapPath.swapPath),
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
      {
        type: 'Hash160',
        value: this.swapService.getHash160FromAddress(toAddress),
      },
      {
        type: 'Integer',
        value: 2,
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
        scriptHash: SWAP_CONTRACT_HASH,
        operation: 'DelegateSwapTokenInForTokenOutNCrossChain',
        args,
      })
      .then(({ txid }) => {
        const txHash = (txid as string).startsWith('0x') ? txid : '0x' + txid;
        const pendingTx: SwapTransaction = {
          txid: txHash,
          isPending: true,
          min: false,
          fromTokenName: fromToken.symbol,
          toToken,
          amount: inputAmount,
        };
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
        window.addEventListener(
          'NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED',
          (result: any) => {
            // console.log(result.detail.txid);
            if (result.detail.txid === txHash) {
              this.getBalances();
            }
          }
        );
        return txHash;
      })
      .catch((error) => {
        console.log(error);
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
    this.neolineDapi.getNetworks().then((res) => {
      this.neolineNetwork = res.defaultNetwork;
      this.store.dispatch({
        type: UPDATE_NEOLINE_NETWORK,
        data: this.neolineNetwork,
      });
      if (NEOLINE_NETWORK !== this.neolineNetwork) {
        this.nzMessage.error(
          `Please switch network to ${NEOLINE_NETWORK} on NeoLine wallet.`
        );
      } else {
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
        if (NEOLINE_NETWORK !== this.neolineNetwork) {
          this.nzMessage.error(
            `Please switch network to ${NEOLINE_NETWORK} on NeoLine wallet.`
          );
        } else {
          this.getBalances();
        }
      }
    );
  }
}
