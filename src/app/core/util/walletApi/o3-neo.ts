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
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_PENDING_TX,
  SwapTransaction,
  NEO_NNEO_CONTRACT_HASH,
  NEOLINE_NETWORK,
} from '@lib';
import { Observable } from 'rxjs';
import { wallet } from '@cityofzion/neon-js';
import BigNumber from 'bignumber.js';

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
    private commonService: CommonService,
    private apiService: ApiService
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

  getBalances(
    fromTokenAssetId?: string,
    inputAmount?: string
  ): Promise<boolean> {
    if (NEOLINE_NETWORK === 'TestNet') {
      this.store.dispatch({
        type: UPDATE_NEO_BALANCES,
        data: {},
      });
      return;
    }
    o3dapi.NEO.getBalance({
      params: [{ address: this.accountAddress }],
      network: NEOLINE_NETWORK,
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
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }

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
        this.swapService.handleNeoDapiError(error, 'NeoLine');
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
    const checkBalance = await this.getBalances(fromToken.assetID, inputAmount);
    if (checkBalance !== true) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const toNeoswapPath = await this.swapService.getToStandardSwapPath(
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
    const toNeoswapPath = await this.swapService.getToStandardSwapPath(
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
    return o3dapi.NEO.invoke({
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
        console.log(error);
        this.swapService.handleNeoDapiError(error, 'O3');
      });
  }
}
