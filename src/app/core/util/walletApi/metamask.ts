import { Injectable } from '@angular/core';
import {
  EthWalletName,
  ETH_CROSS_SWAP_CONTRACT_HASH,
  METAMASK_CHAIN_ID,
  NETWORK,
  SwapStateType,
  SwapTransaction,
  SWAP_CONTRACT_CHAIN_ID,
  Token,
  UNI_SWAP_CONTRACT_HASH,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  UPDATE_METAMASK_NETWORK_ID,
  UPDATE_PENDING_TX,
} from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable, of, Unsubscribable } from 'rxjs';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import Web3 from 'web3';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface State {
  swap: SwapStateType;
}
@Injectable()
export class MetaMaskWalletApiService {
  myWalletName: EthWalletName = 'MetaMask';
  accountAddress: string;
  requestTxStatusInterval: Unsubscribable;

  swap$: Observable<any>;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;
  metamaskNetworkId: number;

  ethereum;
  isConnected: boolean;
  web3;
  swapperJson;
  ethErc20Json;
  uniswapJson;

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService
  ) {
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.metamaskNetworkId = state.metamaskNetworkId;
    });
  }

  connect(chain: string): void {
    if (!(window as any).ethereum) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    this.web3 = new Web3((window as any).ethereum);
    this.ethereum = (window as any).ethereum;
    this.getSwapperJson();
    this.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((result) => {
        this.commonService.log(result);
        this.accountAddress = result[0];
        let dispatchAccountType;
        let dispatchWalletNameType;
        switch (chain) {
          case 'ETH':
            dispatchAccountType = UPDATE_ETH_ACCOUNT;
            dispatchWalletNameType = UPDATE_ETH_WALLET_NAME;
            break;
          case 'BSC':
            dispatchAccountType = UPDATE_BSC_ACCOUNT;
            dispatchWalletNameType = UPDATE_BSC_WALLET_NAME;
            break;
          case 'HECO':
            dispatchAccountType = UPDATE_HECO_ACCOUNT;
            dispatchWalletNameType = UPDATE_HECO_WALLET_NAME;
            break;
        }
        this.store.dispatch({
          type: dispatchAccountType,
          data: this.accountAddress,
        });
        this.store.dispatch({
          type: dispatchWalletNameType,
          data: this.myWalletName,
        });
        this.addListener();
      })
      .catch((error) => {
        this.nzMessage.error(error.message);
      });
  }

  async uniSwapExactTokensForETH(): Promise<any> {
    // if (this.checkNetwork(fromToken) === false) {
    //   return;
    // }
    const json = await this.getUniSwapJson();
    const uniswapContract = new this.web3.eth.Contract(
      json,
      UNI_SWAP_CONTRACT_HASH
    );
    try {
      await new Promise((resolve, reject) => {
        uniswapContract.methods
          .swapExactTokensForETHSupportingFeeOnTransferTokens(
            new BigNumber(1).shiftedBy(18),
            0,
            [
              '0xaD6D458402F60fD3Bd25163575031ACDce07538D', // dai
              '0xc778417E063141139Fce010982780140Aa0cD5Ab', // weth
            ],
            '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
            Math.floor(Date.now() / 1000 + 600)
          )
          .send({ from: '0xd34E3B073a484823058Ab76fc2304D5394beafE4' })
          .on('error', (error) => {
            console.log(error);
          })
          .on('transactionHash', (hash) => {
            console.log('hash: ' + hash);
          })
          .on('receipt', (receipt) => {
            console.log(receipt);
            if (receipt.status === false) {
              this.nzMessage.error('Transaction failed');
              this.store.dispatch({ type: UPDATE_PENDING_TX, data: null });
            }
          });
      });
      // this.handleTx(fromToken, toToken, inputAmount, hash);
      // return hash;
    } catch (error) {
      console.error(error);
      this.handleDapiError(error);
      // this.nzMessage.error(error.message);
    }
  }

  async uniSwapExactETHForTokens(): Promise<any> {
    // if (this.checkNetwork(fromToken) === false) {
    //   return;
    // }
    const json = await this.getUniSwapJson();
    const uniswapContract = new this.web3.eth.Contract(
      json,
      UNI_SWAP_CONTRACT_HASH
    );
    try {
      await new Promise((resolve, reject) => {
        uniswapContract.methods
          .swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [
              '0xc778417E063141139Fce010982780140Aa0cD5Ab', // weth
              '0xaD6D458402F60fD3Bd25163575031ACDce07538D', // dai
            ],
            '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
            Math.floor(Date.now() / 1000 + 600)
          )
          .send({
            from: '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
            value: new BigNumber(0.001).shiftedBy(18),
          })
          .on('error', (error) => {
            console.log(error);
          })
          .on('transactionHash', (hash) => {
            console.log(hash);
          })
          .on('receipt', (receipt) => {
            console.log(receipt);
            if (receipt.status === false) {
              this.nzMessage.error('Transaction failed');
              this.store.dispatch({ type: UPDATE_PENDING_TX, data: null });
            }
          });
      });
      // this.handleTx(fromToken, toToken, inputAmount, hash);
      // return hash;
    } catch (error) {
      console.error(error);
      this.handleDapiError(error);
      // this.nzMessage.error(error.message);
    }
  }

  async uniSwapExactTokensForTokens(): Promise<any> {
    // if (this.checkNetwork(fromToken) === false) {
    //   return;
    // }
    const json = await this.getUniSwapJson();
    const uniswapContract = new this.web3.eth.Contract(
      json,
      UNI_SWAP_CONTRACT_HASH
    );
    try {
      await new Promise((resolve, reject) => {
        uniswapContract.methods
          .swapExactTokensForTokensSupportingFeeOnTransferTokens(
            new BigNumber(0.0000001).shiftedBy(18),
            0,
            [
              '0xc778417E063141139Fce010982780140Aa0cD5Ab', // weth
              '0xaD6D458402F60fD3Bd25163575031ACDce07538D', // dai
            ],
            '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
            Math.floor(Date.now() / 1000 + 600)
          )
          .send({ from: '0xd34E3B073a484823058Ab76fc2304D5394beafE4' })
          .on('error', (error) => {
            console.log(error);
          })
          .on('transactionHash', (hash) => {
            console.log(hash);
          })
          .on('receipt', (receipt) => {
            console.log(receipt);
            if (receipt.status === false) {
              this.nzMessage.error('Transaction failed');
              this.store.dispatch({ type: UPDATE_PENDING_TX, data: null });
            }
          });
      });
      // this.handleTx(fromToken, toToken, inputAmount, hash);
      // return hash;
    } catch (error) {
      console.error(error);
      this.handleDapiError(error);
      // this.nzMessage.error(error.message);
    }
  }

  async swapCrossChain(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    fromAddress: string,
    toAddress: string
  ): Promise<string> {
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH
    );
    try {
      const hash: string = await new Promise((resolve, reject) => {
        swapContract.methods
          .swap(
            `0x${fromToken.assetID}`, // fromAssetHash
            1, // toPoolId
            SWAP_CONTRACT_CHAIN_ID[toToken.chain], // toChainId
            toAddress, // toAddress
            new BigNumber(inputAmount).shiftedBy(fromToken.decimals), // amount
            0, // fee
            1 // id
          )
          .send({ from: fromAddress })
          .on('error', reject)
          .on('transactionHash', resolve)
          .on('receipt', (receipt) => {
            console.log(receipt);
            if (receipt.status === false) {
              this.nzMessage.error('Transaction failed');
              this.store.dispatch({ type: UPDATE_PENDING_TX, data: null });
            }
          });
      });
      console.log(hash);
      this.handleTx(fromToken, toToken, inputAmount, hash);
      return hash;
    } catch (error) {
      console.error(error);
      this.handleDapiError(error);
      // this.nzMessage.error(error.message);
    }
  }

  async getAllowance(fromToken: Token, fromAddress: string): Promise<string> {
    const json = await this.getEthErc20Json();
    const ethErc20Contract = new this.web3.eth.Contract(
      json,
      fromToken.assetID
    );
    const result = await ethErc20Contract.methods
      .allowance(fromAddress, ETH_CROSS_SWAP_CONTRACT_HASH)
      .call();
    console.log('allowance: ' + result);
    return new BigNumber(result).shiftedBy(-fromToken.decimals).toFixed();
  }

  async approve(fromToken: Token, fromAddress: string): Promise<any> {
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getEthErc20Json();
    const ethErc20Contract = new this.web3.eth.Contract(
      json,
      fromToken.assetID
    );
    try {
      const result = await new Promise((resolve, reject) => {
        ethErc20Contract.methods
          .approve(
            ETH_CROSS_SWAP_CONTRACT_HASH,
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
          )
          .send({ from: fromAddress })
          .on('error', reject)
          .on('receipt', resolve);
      });
      console.log('approve result: ' + result);
      return result;
    } catch (error) {
      console.error(error);
      this.handleDapiError(error);
    }
  }

  //#region
  private handleTx(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    txHash: string
  ): void {
    const pendingTx: SwapTransaction = {
      txid: txHash,
      isPending: true,
      min: false,
      fromToken,
      toToken,
      amount: inputAmount,
      progress: {
        step1: { hash: '', status: 1 },
        step2: { hash: '', status: 0 },
        step3: { hash: '', status: 0 },
      },
    };
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
  }

  private handleDapiError(error): void {
    switch (error.code) {
      case 4001:
        this.nzMessage.error('The request was rejected by the user');
        break;
      case -32602:
        this.nzMessage.error('The parameters were invalid');
        break;
      case -32603:
        this.nzMessage.error('Internal error'); // transaction underpriced
        break;
    }
  }

  private addListener(): void {
    this.ethereum
      .request({ method: 'net_version' })
      .then((chainId) => {
        this.commonService.log('chainId: ' + chainId);
        this.store.dispatch({
          type: UPDATE_METAMASK_NETWORK_ID,
          data: Number(chainId),
        });
      })
      .catch((error) => {
        this.nzMessage.error(error.message);
      });
    this.ethereum.on('accountsChanged', (accounts) => {
      this.accountAddress = accounts.length > 0 ? accounts[0] : null;
      this.updateAccount(this.accountAddress);
      if (
        this.accountAddress === null &&
        this.ethWalletName === this.myWalletName
      ) {
        this.updateWalletName(null);
      }
    });
    this.ethereum.on('chainChanged', (chainId) => {
      this.commonService.log('chainId: ' + chainId);
      this.store.dispatch({
        type: UPDATE_METAMASK_NETWORK_ID,
        data: Number(chainId),
      });
    });
  }

  private checkNetwork(fromToken: Token): boolean {
    if (this.metamaskNetworkId !== METAMASK_CHAIN_ID[fromToken.chain]) {
      this.nzMessage.error(
        `Please switch network to ${fromToken.chain} ${NETWORK} on MetaMask wallet.`
      );
      return false;
    }
    return true;
  }

  private getUniSwapJson(): Promise<any> {
    if (this.uniswapJson) {
      return of(this.uniswapJson).toPromise();
    }
    return this.http
      .get('assets/contracts-json/UniswapV2Router02.json')
      .pipe(
        map((res) => {
          this.uniswapJson = res;
          return res;
        })
      )
      .toPromise();
  }

  private getEthErc20Json(): Promise<any> {
    if (this.ethErc20Json) {
      return of(this.ethErc20Json).toPromise();
    }
    return this.http
      .get('assets/contracts-json/eth-erc20.json')
      .pipe(
        map((res) => {
          this.ethErc20Json = res;
          return res;
        })
      )
      .toPromise();
  }

  private getSwapperJson(): Promise<any> {
    if (this.swapperJson) {
      return of(this.swapperJson).toPromise();
    }
    return this.http
      .get('assets/contracts-json/eth-swapper.json')
      .pipe(
        map((res) => {
          this.swapperJson = res;
          return res;
        })
      )
      .toPromise();
  }

  private updateAccount(data: string): void {
    if (this.ethWalletName === 'MetaMask') {
      this.store.dispatch({
        type: UPDATE_ETH_ACCOUNT,
        data,
      });
    }
    if (this.bscWalletName === 'MetaMask') {
      this.store.dispatch({
        type: UPDATE_BSC_ACCOUNT,
        data,
      });
    }
    if (this.hecoWalletName === 'MetaMask') {
      this.store.dispatch({
        type: UPDATE_HECO_ACCOUNT,
        data,
      });
    }
  }

  private updateWalletName(data: string): void {
    if (this.ethWalletName === 'MetaMask') {
      this.store.dispatch({
        type: UPDATE_ETH_WALLET_NAME,
        data,
      });
    }
    if (this.bscWalletName === 'MetaMask') {
      this.store.dispatch({
        type: UPDATE_BSC_WALLET_NAME,
        data,
      });
    }
    if (this.hecoWalletName === 'MetaMask') {
      this.store.dispatch({
        type: UPDATE_HECO_WALLET_NAME,
        data,
      });
    }
  }
  //#endregion
}
