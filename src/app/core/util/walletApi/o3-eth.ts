import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import o3dapi from 'o3-dapi-core';
import o3dapiEth from 'o3-dapi-eth';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import {
  NeoWalletName,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  SwapStateType,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  CHAIN_TOKENS,
  EthWalletName,
  ETH_CROSS_SWAP_CONTRACT_HASH,
  METAMASK_CHAIN_ID,
  SWAP_CONTRACT_CHAIN_ID,
  Token,
  UNI_SWAP_CONTRACT_HASH,
  UPDATE_BSC_BALANCES,
  UPDATE_ETH_BALANCES,
  UPDATE_HECO_BALANCES,
  UPDATE_PENDING_TX,
  NETWORK,
  SwapTransaction,
  UPDATE_METAMASK_NETWORK_ID,
  ETH_SOURCE_ASSET_HASH,
  METAMASK_CHAIN,
  USD_TOKENS,
} from '@lib';
import BigNumber from 'bignumber.js';
import { Unsubscribable, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import Web3 from 'web3';

interface State {
  swap: SwapStateType;
}

@Injectable()
export class O3EthWalletApiService {
  myWalletName: NeoWalletName = 'O3';
  accountAddress: string;

  requestTxStatusInterval: Unsubscribable;

  swap$: Observable<any>;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;
  o3DesktopId: number;

  isConnected: boolean;
  web3 = new Web3();
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
    o3dapi.initPlugins([o3dapiEth]);
  }

  connect(chain: string): void {
    o3dapi.ETH.request({ method: 'eth_requestAccounts' })
      .then(async (res) => {
        console.log(res);
        this.accountAddress = res.result[0];
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
        this.handleDapiError(error);
      });
  }

  async getBalance(): Promise<boolean> {
    const chainId = new BigNumber(this.o3DesktopId, 16).toNumber();
    const chain = METAMASK_CHAIN[chainId];
    if (!chain) {
      return;
    }
    let dispatchBalanceType;
    let tempTokenBalance: Token[];
    return new Promise(async (resolve, reject) => {
      switch (chain) {
        case 'ETH':
          dispatchBalanceType = UPDATE_ETH_BALANCES;
          tempTokenBalance = JSON.parse(JSON.stringify(CHAIN_TOKENS.ETH));
          break;
        case 'BSC':
          dispatchBalanceType = UPDATE_BSC_BALANCES;
          tempTokenBalance = JSON.parse(JSON.stringify(CHAIN_TOKENS.BSC));
          break;
        case 'HECO':
          dispatchBalanceType = UPDATE_HECO_BALANCES;
          tempTokenBalance = JSON.parse(JSON.stringify(CHAIN_TOKENS.HECO));
          break;
      }
      const result = {};
      for (const item of tempTokenBalance) {
        result[item.assetID] = JSON.parse(JSON.stringify(item));
        result[item.assetID].amount = await this.getBalancByHash(item);
      }
      console.log(result);
      this.store.dispatch({
        type: dispatchBalanceType,
        data: result,
      });
      resolve(true);
    });
  }

  async getBalancByHash(token: Token): Promise<string> {
    const chainId = new BigNumber(this.o3DesktopId, 16).toNumber();
    const chain = METAMASK_CHAIN[chainId];
    if (!chain) {
      return;
    }
    if (token.assetID !== ETH_SOURCE_ASSET_HASH) {
      const json = await this.getEthErc20Json();
      const ethErc20Contract = new this.web3.eth.Contract(json, token.assetID);
      const data = ethErc20Contract.methods
        .balanceOf(this.accountAddress)
        .encodeABI();
      return o3dapi.ETH.request({
        method: 'eth_call',
        params: [
          this.getSendTransactionParams(
            this.accountAddress,
            token.assetID,
            data
          ),
          'latest',
        ],
      })
        .then((balance) => {
          return new BigNumber(balance).shiftedBy(-token.decimals).toFixed();
        })
        .catch((error) => {
          console.log(error);
          this.handleDapiError(error);
        });
    } else {
      return o3dapi.ETH.request({
        method: 'eth_getBalance',
        params: [this.accountAddress, 'latest'],
      })
        .then((balance) => {
          return new BigNumber(balance, 16)
            .shiftedBy(-token.decimals)
            .toFixed();
        })
        .catch((error) => {
          this.handleDapiError(error);
        });
    }
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
    const data = uniswapContract.methods
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
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(
          '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
          UNI_SWAP_CONTRACT_HASH,
          data,
          '0'
        ),
      ],
    })
      .then((hash) => {
        // this.handleTx(fromToken, toToken, inputAmount, hash);
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
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
    const data = uniswapContract.methods
      .swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        [
          '0xc778417E063141139Fce010982780140Aa0cD5Ab', // weth
          '0xaD6D458402F60fD3Bd25163575031ACDce07538D', // dai
        ],
        '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
        Math.floor(Date.now() / 1000 + 600)
      )
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(
          '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
          UNI_SWAP_CONTRACT_HASH,
          data,
          new BigNumber(0.001).shiftedBy(18).toFixed()
        ),
      ],
    })
      .then((hash) => {
        // this.handleTx(fromToken, toToken, inputAmount, hash);
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
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

    const data = uniswapContract.methods
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
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(
          '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
          UNI_SWAP_CONTRACT_HASH,
          data,
          '0'
        ),
      ],
    })
      .then((hash) => {
        // this.handleTx(fromToken, toToken, inputAmount, hash);
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  async swapCrossChain(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    receiveAmount: string,
    slipValue: number,
    polyFee: string
  ): Promise<string> {
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain]
    );
    const bigNumberPolyFee = new BigNumber(polyFee)
      .shiftedBy(18)
      .dp(0)
      .toFixed();
    const data = swapContract.methods
      .swap(
        this.commonService.add0xHash(fromToken.assetID), // fromAssetHash
        1, // toPoolId
        SWAP_CONTRACT_CHAIN_ID[toToken.chain], // toChainId
        this.commonService.add0xHash(toToken.assetID), // toAssetHash
        toAddress, // toAddress
        new BigNumber(inputAmount).shiftedBy(fromToken.decimals), // amount
        this.swapService.getMinAmountOut(receiveAmount, slipValue), // minAmountOut
        bigNumberPolyFee, // fee
        1 // id
      )
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(
          fromAddress,
          ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain],
          data,
          bigNumberPolyFee
        ),
      ],
    })
      .then((hash) => {
        this.handleTx(fromToken, toToken, inputAmount, hash);
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  async addLiquidity(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    address: string,
    toChainId: number,
    minAmountOut: string,
    fee: string
  ): Promise<string> {
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain]
    );
    const bigNumberPolyFee = new BigNumber(fee).shiftedBy(18).dp(0).toFixed();
    const data = swapContract.methods
      .add_liquidity(
        this.commonService.add0xHash(fromToken.assetID), // fromAssetHash
        1, // toPoolId
        toChainId, // toChainId
        address, // toAddress
        new BigNumber(inputAmount).shiftedBy(fromToken.decimals), // amount
        minAmountOut,
        bigNumberPolyFee, // fee
        1 // id
      )
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(
          address,
          ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain],
          data,
          bigNumberPolyFee
        ),
      ],
    })
      .then((hash) => {
        this.handleTx(fromToken, toToken, inputAmount, hash);
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  async removeLiquidity(
    fromToken: Token, // LP token
    inputAmount: string,
    address: string,
    toChainId: number,
    minAmountOut: string,
    fee: string
  ): Promise<string> {
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain]
    );
    const usdtToken = USD_TOKENS.find((item) => item.chain === fromToken.chain);
    const bigNumberPolyFee = new BigNumber(fee).shiftedBy(18).dp(0).toFixed();
    const data = swapContract.methods
      .remove_liquidity(
        this.commonService.add0xHash(fromToken.assetID), // fromAssetHash
        1, // toPoolId
        toChainId, // toChainId
        this.commonService.add0xHash(usdtToken.assetID),
        address, // toAddress
        new BigNumber(inputAmount).shiftedBy(fromToken.decimals), // amount
        minAmountOut, // minAmountOut
        bigNumberPolyFee, // fee
        1 // id
      )
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(
          address,
          ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain],
          data,
          bigNumberPolyFee
        ),
      ],
    })
      .then((hash) => {
        this.handleTx(fromToken, usdtToken, inputAmount, hash);
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  async getAllowance(fromToken: Token, fromAddress: string): Promise<string> {
    const json = await this.getEthErc20Json();
    const ethErc20Contract = new this.web3.eth.Contract(
      json,
      fromToken.assetID
    );
    const data = ethErc20Contract.methods
      .allowance(fromAddress, ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain])
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_call',
      params: [
        this.getSendTransactionParams(fromAddress, fromToken.assetID, data),
      ],
    })
      .then((result) => {
        console.log('allowance: ' + result);
        return new BigNumber(result).shiftedBy(-fromToken.decimals).toFixed();
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
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
    const data = ethErc20Contract.methods
      .approve(
        ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain],
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      )
      .encodeABI();
    return o3dapi.ETH.request({
      method: 'eth_sendTransaction',
      params: [
        this.getSendTransactionParams(fromAddress, fromToken.assetID, data),
      ],
    })
      .then((hash) => {
        // this.handleTx(fromToken, toToken, inputAmount, hash);
        return this.listerTxReceipt(hash);
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  //#region
  private handleTx(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    // receiveAmount: string,
    txHash: string
  ): void {
    const pendingTx: SwapTransaction = {
      txid: txHash,
      isPending: true,
      min: false,
      fromToken,
      toToken,
      amount: inputAmount,
      receiveAmount: new BigNumber(inputAmount).shiftedBy(-toToken.decimals).toFixed(),
      progress: {
        step1: { hash: '', status: 1 },
        step2: { hash: '', status: 0 },
        step3: { hash: '', status: 0 },
      },
    };
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: pendingTx });
    this.listerTxReceipt(txHash);
  }

  listerTxReceipt(txHash: string): void {
    const timer = setInterval(async () => {
      o3dapi.ETH.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      })
        .then((receipt) => {
          console.log(receipt);
          if (receipt) {
            if (new BigNumber(receipt.status, 16).isZero()) {
              this.nzMessage.error('Transaction failed');
              this.store.dispatch({ type: UPDATE_PENDING_TX, data: null });
            }
            clearInterval(timer);
          }
        })
        .catch((error) => {
          clearInterval(timer);
          this.handleDapiError(error);
        });
    }, 5000);
  }

  private getSendTransactionParams(
    from: string,
    to: string,
    data: string,
    value?: string,
    gas?: string,
    gasPrice?: string
  ): object {
    if (value && !value.startsWith('0x')) {
      value = '0x' + new BigNumber(value).toString(16);
    }
    to = this.commonService.add0xHash(to);
    return {
      from,
      to,
      value,
      gas,
      gasPrice,
      data,
    };
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
    o3dapi.ETH.request({ method: 'net_version' })
      .then((res) => {
        const id = Number(res.result);
        if (this.o3DesktopId !== id) {
          this.o3DesktopId = id;
          // this.store.dispatch({
          //   type: UPDATE_O3DESKTOP_NETWORK_ID,
          //   data: id,
          // });
          this.getBalance();
        }
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
    // this.ethereum.on('accountsChanged', (accounts) => {
    //   this.accountAddress = accounts.length > 0 ? accounts[0] : null;
    //   this.updateAccount(this.accountAddress);
    //   if (
    //     this.accountAddress === null &&
    //     this.ethWalletName === this.myWalletName
    //   ) {
    //     this.updateWalletName(null);
    //   }
    //   if (this.accountAddress) {
    //     this.getBalance();
    //   }
    // });
    // this.ethereum.on('chainChanged', (chainId) => {
    //   const id = Number(chainId);
    //   if (this.metamaskNetworkId !== id) {
    //     this.metamaskNetworkId = id;
    //     this.store.dispatch({
    //       type: UPDATE_METAMASK_NETWORK_ID,
    //       data: id,
    //     });
    //     this.getBalance();
    //   }
    // });
    o3dapi.ETH.addEventListener(
      o3dapi.ETH.Constants.EventName.NETWORK_CHANGED,
      (res) => {
        console.log(res);
        console.log(`NETWORK_CHANGED: ${res.result}`);
      }
    );
  }

  private checkNetwork(fromToken: Token): boolean {
    if (this.o3DesktopId !== METAMASK_CHAIN_ID[fromToken.chain]) {
      this.nzMessage.error(
        `Please switch network to ${fromToken.chain} ${NETWORK} on O3 desktop extension.`
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
