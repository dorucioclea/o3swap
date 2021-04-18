import { Injectable } from '@angular/core';
import {
  EthWalletName,
  ETH_CROSS_SWAP_CONTRACT_HASH,
  NETWORK,
  SwapStateType,
  SwapTransaction,
  SWAP_CONTRACT_CHAIN_ID,
  Token,
  UPDATE_ETH_BALANCES,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  UPDATE_METAMASK_NETWORK_ID,
  UPDATE_PENDING_TX,
  UPDATE_BSC_BALANCES,
  UPDATE_HECO_BALANCES,
  ETH_SOURCE_ASSET_HASH,
  METAMASK_CHAIN,
  USD_TOKENS,
  AssetQueryResponseItem,
  O3_AGGREGATOR_SLIPVALUE,
  TxAtPage,
  UPDATE_BRIDGE_PENDING_TX,
  UPDATE_LIQUIDITY_PENDING_TX,
  BRIDGE_SLIPVALUE,
  RESET_ETH_BALANCES,
  RESET_BSC_BALANCES,
  RESET_HECO_BALANCES,
  WETH_ASSET_HASH,
  AGGREGATOR_CONTRACT,
  CHAINS,
} from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { interval, Observable, of, Unsubscribable } from 'rxjs';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import Web3 from 'web3';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ApiService } from '../../api/api.service';
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
  transaction: SwapTransaction;
  bridgeeTransaction: SwapTransaction;
  liquidityTransaction: SwapTransaction;

  ethereum;
  web3: Web3;
  wEthJson;
  swapperJson;
  ethErc20Json;
  aggregatorSwapJson = {
    BSC: {
      Pancakeswap: null,
    },
    ETH: {
      Uniswap: null,
    },
    HECO: {
      'Mdex-Heco': null,
    },
  };

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService,
    private apiService: ApiService
  ) {
    this.swap$ = store.select('swap');
    this.swap$.subscribe((state) => {
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.metamaskNetworkId = state.metamaskNetworkId;
      this.transaction = Object.assign({}, state.transaction);
      this.bridgeeTransaction = Object.assign({}, state.bridgeeTransaction);
      this.liquidityTransaction = Object.assign({}, state.liquidityTransaction);
    });
  }

  //#region connect
  init(): void {
    setTimeout(() => {
      if ((window as any).ethereum && (window as any).ethereum.isConnected()) {
        const localEthWalletName = sessionStorage.getItem(
          'ethWalletName'
        ) as EthWalletName;
        const localBscWalletName = sessionStorage.getItem(
          'bscWalletName'
        ) as EthWalletName;
        const localHecoWalletName = sessionStorage.getItem(
          'hecoWalletName'
        ) as EthWalletName;
        if (localEthWalletName === 'MetaMask') {
          this.connect('ETH', false);
        }
        if (localBscWalletName === 'MetaMask') {
          this.connect('BSC', false);
        }
        if (localHecoWalletName === 'MetaMask') {
          this.connect('HECO', false);
        }
      }
    }, 1000);
  }

  connect(chain: string, showMessage = true): Promise<string> {
    if (!(window as any).ethereum) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    this.web3 = new Web3((window as any).ethereum);
    this.ethereum = (window as any).ethereum;
    return this.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((result) => {
        if (result.length <= 0) {
          return;
        }
        this.commonService.log(result);
        this.accountAddress = result[0];
        if (showMessage) {
          this.nzMessage.success('Connection succeeded!');
        }
        this.getBalance();
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
        return this.accountAddress;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }
  checkNetwork(fromToken: Token): boolean {
    const chainId = new BigNumber(this.ethereum.chainId, 16).toNumber();
    const chain = METAMASK_CHAIN[chainId];
    if (chain !== fromToken.chain) {
      this.nzMessage.error(
        `Please switch network to ${fromToken.chain} ${NETWORK} on MetaMask extension.`
      );
      return false;
    }
    return true;
  }
  getChain(): string {
    this.ethereum = (window as any).ethereum;
    if ((window as any).ethereum) {
      const chainId = new BigNumber(
        (window as any).ethereum.chainId,
        16
      ).toNumber();
      return METAMASK_CHAIN[chainId];
    } else {
      return null;
    }
  }
  //#endregion

  //#region eth weth swap
  async depositWEth(
    fromToken: Token, // eth
    toToken: Token, // weth
    inputAmount: string,
    fromAddress: string
  ): Promise<any> {
    console.log(`\u001b[32m  ✓ eth swap weth \u001b[0m`);
    const json = await this.getWEthJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      WETH_ASSET_HASH[fromToken.chain].assetID
    );
    const data = swapContract.methods.deposit().encodeABI();
    const value = new BigNumber(inputAmount)
      .shiftedBy(fromToken.decimals)
      .toFixed();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            WETH_ASSET_HASH[fromToken.chain].assetID,
            data,
            value
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          new BigNumber(inputAmount).shiftedBy(toToken.decimals).toFixed(),
          hash,
          'swap',
          false
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }

  async withdrawalWeth(
    fromToken: Token, // weth
    toToken: Token, // eth
    inputAmount: string,
    fromAddress: string
  ): Promise<any> {
    console.log(`\u001b[32m  ✓ eth swap weth \u001b[0m`);
    const json = await this.getWEthJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      WETH_ASSET_HASH[fromToken.chain].assetID
    );
    const data = swapContract.methods
      .withdraw(new BigNumber(inputAmount).shiftedBy(fromToken.decimals))
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            WETH_ASSET_HASH[fromToken.chain].assetID,
            data
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          new BigNumber(inputAmount).shiftedBy(toToken.decimals).toFixed(),
          hash,
          'swap',
          false
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }
  //#endregion

  //#region balance
  async getBalance(targetChain?: CHAINS): Promise<boolean> {
    console.log('getBalance-----------');
    const chainId = new BigNumber(this.ethereum.chainId, 16).toNumber();
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
          tempTokenBalance = JSON.parse(
            JSON.stringify(this.apiService.CHAIN_TOKENS.ETH)
          );
          break;
        case 'BSC':
          dispatchBalanceType = UPDATE_BSC_BALANCES;
          tempTokenBalance = JSON.parse(
            JSON.stringify(this.apiService.CHAIN_TOKENS.BSC)
          );
          break;
        case 'HECO':
          dispatchBalanceType = UPDATE_HECO_BALANCES;
          tempTokenBalance = JSON.parse(
            JSON.stringify(this.apiService.CHAIN_TOKENS.HECO)
          );
          break;
      }
      const result = {};
      for (const item of tempTokenBalance) {
        const tempAmount = await this.getBalancByHash(item);
        if (tempAmount) {
          result[item.assetID] = JSON.parse(JSON.stringify(item));
          result[item.assetID].amount = tempAmount;
        }
      }
      console.log(result);
      this.store.dispatch({
        type: dispatchBalanceType,
        data: result,
      });
      if (this.ethWalletName === 'MetaMask' && chain !== 'ETH') {
        this.store.dispatch({
          type: RESET_ETH_BALANCES,
        });
      }
      if (this.ethWalletName === 'MetaMask' && chain !== 'BSC') {
        this.store.dispatch({
          type: RESET_BSC_BALANCES,
        });
      }
      if (this.ethWalletName === 'MetaMask' && chain !== 'HECO') {
        this.store.dispatch({
          type: RESET_HECO_BALANCES,
        });
      }
      resolve(true);
    });
  }

  async getBalancByHash(token: Token): Promise<string> {
    const chainId = new BigNumber(this.ethereum.chainId, 16).toNumber();
    const chain = METAMASK_CHAIN[chainId];
    if (!chain) {
      return;
    }
    if (token.assetID !== ETH_SOURCE_ASSET_HASH) {
      const json = await this.getEthErc20Json();
      const ethErc20Contract = new this.web3.eth.Contract(json, token.assetID);
      const data = await ethErc20Contract.methods
        .balanceOf(this.accountAddress)
        .encodeABI();
      return this.ethereum
        .request({
          method: 'eth_call',
          params: [
            this.getSendTransactionParams(
              this.accountAddress,
              token.assetID,
              data
            ),
          ],
        })
        .then((balance) => {
          if (
            balance &&
            !new BigNumber(balance).isNaN() &&
            new BigNumber(balance).comparedTo(0) > 0
          ) {
            return new BigNumber(balance).shiftedBy(-token.decimals).toFixed();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      return this.ethereum
        .request({
          method: 'eth_getBalance',
          params: [this.accountAddress, 'latest'],
        })
        .then((balance) => {
          if (
            balance &&
            !new BigNumber(balance).isNaN() &&
            new BigNumber(balance).comparedTo(0) > 0
          ) {
            return new BigNumber(balance, 16)
              .shiftedBy(-token.decimals)
              .toFixed();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  //#endregion

  //#region USDT BUSD PUSD swap
  async swapCrossChain(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    receiveAmount: string,
    slipValue: number,
    polyFee: string,
    txAtPage: TxAtPage
  ): Promise<string> {
    console.log('poly swap');
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain]
    );
    const bigNumberPolyFee = new BigNumber(polyFee)
      .shiftedBy(18)
      .dp(0)
      .toFixed();
    const params = {
      fromAssetHash: this.commonService.add0xHash(fromToken.assetID),
      toPoolId: 1,
      toChainId: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      toAssetHash: this.commonService.add0xHash(toToken.assetID),
      toAddress,
      amount: new BigNumber(inputAmount).shiftedBy(fromToken.decimals),
      minOutAmount: this.swapService.getMinAmountOut(receiveAmount, slipValue),
      fee: bigNumberPolyFee,
      id: 1,
    };
    console.log(params);
    console.log(`value: ${bigNumberPolyFee}`);
    const data = swapContract.methods
      .swap(
        params.fromAssetHash,
        params.toPoolId,
        params.toChainId,
        params.toAssetHash,
        params.toAddress,
        params.amount,
        params.minOutAmount,
        params.fee,
        params.id
      )
      .encodeABI();
    return this.ethereum
      .request({
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
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          txAtPage
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }
  //#endregion

  //#region eth uni
  async swapExactTokensForETH(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    deadline: number
  ): Promise<any> {
    console.log(`\u001b[32m  ✓ ${chooseSwapPath.aggregator} \u001b[0m`);
    console.log('swapExactTokensForETH');
    const json = await this.getAggregatorSwapJson(
      fromToken.chain,
      chooseSwapPath.aggregator
    );
    const swapContract = new this.web3.eth.Contract(
      json,
      AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator]
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      amountIn: new BigNumber(inputAmount).shiftedBy(fromToken.decimals),
      swapAmountOutMin: this.swapService.getMinAmountOut(
        receiveAmount,
        O3_AGGREGATOR_SLIPVALUE
      ),
      path: chooseSwapPath.assetHashPath,
      to: toAddress,
      deadline: Math.floor(Date.now() / 1000 + deadline * 60),
    };
    console.log(params);
    const data = swapContract.methods
      .swapExactTokensForETHSupportingFeeOnTransferTokens(
        params.amountIn,
        params.swapAmountOutMin,
        params.path,
        params.to,
        params.deadline
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator],
            data
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          'swap',
          false
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }

  async swapExactETHForTokens(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    deadline: number
  ): Promise<any> {
    console.log(`\u001b[32m  ✓ ${chooseSwapPath.aggregator} \u001b[0m`);
    console.log('swapExactETHForTokens');
    const json = await this.getAggregatorSwapJson(
      fromToken.chain,
      chooseSwapPath.aggregator
    );
    const swapContract = new this.web3.eth.Contract(
      json,
      AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator]
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      swapAmountOutMin: this.swapService.getMinAmountOut(
        receiveAmount,
        O3_AGGREGATOR_SLIPVALUE
      ),
      path: chooseSwapPath.assetHashPath,
      to: toAddress,
      deadline: Math.floor(Date.now() / 1000 + deadline * 60),
    };
    console.log(params);
    const value = new BigNumber(inputAmount)
      .shiftedBy(fromToken.decimals)
      .toFixed();
    console.log(`value: ${value}`);
    const data = swapContract.methods
      .swapExactETHForTokensSupportingFeeOnTransferTokens(
        params.swapAmountOutMin,
        params.path,
        params.to,
        params.deadline
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator],
            data,
            value
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          'swap',
          false
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }

  async swapExactTokensForTokens(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    deadline: number
  ): Promise<any> {
    console.log(`\u001b[32m  ✓ ${chooseSwapPath.aggregator} \u001b[0m`);
    console.log('swapExactTokensForTokens');
    const json = await this.getAggregatorSwapJson(
      fromToken.chain,
      chooseSwapPath.aggregator
    );
    const swapContract = new this.web3.eth.Contract(
      json,
      AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator]
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      amountIn: new BigNumber(inputAmount)
        .shiftedBy(fromToken.decimals)
        .dp(0)
        .toFixed(),
      swapAmountOutMin: this.swapService.getMinAmountOut(
        receiveAmount,
        O3_AGGREGATOR_SLIPVALUE
      ),
      path: chooseSwapPath.assetHashPath,
      to: toAddress,
      deadline: Math.floor(Date.now() / 1000 + deadline * 60),
    };
    console.log(params);
    const data = swapContract.methods
      .swapExactTokensForTokensSupportingFeeOnTransferTokens(
        params.amountIn,
        params.swapAmountOutMin,
        params.path,
        params.to,
        params.deadline
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator],
            data
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          'swap',
          false
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }

  async swapExactETHForTokensCrossChain(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    slipValue: number,
    polyFee: string,
    deadline: number
  ): Promise<string> {
    console.log(`\u001b[32m  ✓ ${chooseSwapPath.aggregator} \u001b[0m`);
    console.log('swapExactETHForTokensCrossChain');
    const json = await this.getAggregatorSwapJson(
      fromToken.chain,
      chooseSwapPath.aggregator
    );
    const swapContract = new this.web3.eth.Contract(
      json,
      AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator]
    );
    const amountOutA = chooseSwapPath.amount[chooseSwapPath.amount.length - 2];
    const bigNumberPolyFee = new BigNumber(polyFee)
      .shiftedBy(18)
      .dp(0)
      .toFixed();
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      swapAmountOutMin: this.swapService.getMinAmountOut(
        amountOutA,
        O3_AGGREGATOR_SLIPVALUE
      ),
      path: chooseSwapPath.assetHashPath,
      to: toAddress,
      deadline: Math.floor(Date.now() / 1000 + deadline * 60),
      toPoolId: 1,
      toChainId: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      toAssetHash: this.commonService.add0xHash(toToken.assetID),
      polyMinOutAmount: this.swapService.getMinAmountOut(
        receiveAmount,
        slipValue
      ),
      fee: bigNumberPolyFee,
    };
    console.log(params);
    const value = new BigNumber(inputAmount)
      .shiftedBy(fromToken.decimals)
      .plus(new BigNumber(bigNumberPolyFee))
      .dp(0)
      .toFixed();
    console.log(`value: ${value}`);
    const data = swapContract.methods
      .swapExactETHForTokensSupportingFeeOnTransferTokensCrossChain(
        params.swapAmountOutMin,
        params.path,
        params.to,
        params.deadline,
        params.toPoolId,
        params.toChainId,
        params.toAssetHash,
        params.polyMinOutAmount,
        params.fee
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator],
            data,
            value
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          'swap'
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }

  async swapExactTokensForTokensCrossChain(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    slipValue: number,
    polyFee: string,
    deadline: number
  ): Promise<string> {
    console.log(`\u001b[32m  ✓ ${chooseSwapPath.aggregator} \u001b[0m`);
    console.log('swapExactTokensForTokensCrossChain');
    const json = await this.getAggregatorSwapJson(
      fromToken.chain,
      chooseSwapPath.aggregator
    );
    const swapContract = new this.web3.eth.Contract(
      json,
      AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator]
    );
    const amountOutA = chooseSwapPath.amount[chooseSwapPath.amount.length - 2];
    const bigNumberPolyFee = new BigNumber(polyFee)
      .shiftedBy(18)
      .dp(0)
      .toFixed();
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      amountIn: new BigNumber(inputAmount)
        .shiftedBy(fromToken.decimals)
        .dp(0)
        .toFixed(),
      swapAmountOutMin: this.swapService.getMinAmountOut(
        amountOutA,
        O3_AGGREGATOR_SLIPVALUE
      ),
      path: chooseSwapPath.assetHashPath,
      to: toAddress,
      deadline: Math.floor(Date.now() / 1000 + deadline * 60),
      toPoolId: 1,
      toChainId: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      toAssetHash: this.commonService.add0xHash(toToken.assetID),
      polyMinOutAmount: this.swapService.getMinAmountOut(
        receiveAmount,
        slipValue
      ),
      fee: bigNumberPolyFee,
    };
    console.log(params);
    console.log(`value: ${bigNumberPolyFee}`);
    const data = swapContract.methods
      .swapExactTokensForTokensSupportingFeeOnTransferTokensCrossChain(
        params.amountIn,
        params.swapAmountOutMin,
        params.path,
        params.to,
        params.deadline,
        params.toPoolId,
        params.toChainId,
        params.toAssetHash,
        params.polyMinOutAmount,
        params.fee
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            fromAddress,
            AGGREGATOR_CONTRACT[fromToken.chain][chooseSwapPath.aggregator],
            data,
            bigNumberPolyFee
          ),
        ],
      })
      .then((hash) => {
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          'swap'
        );
        return hash;
      })
      .catch((error) => {
        console.log(error);
        this.handleDapiError(error);
      });
  }
  //#endregion

  //#region liquidity
  async addLiquidity(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    address: string,
    toChainId: number,
    receiveAmount: string,
    fee: string
  ): Promise<string> {
    console.log('add liquidity');
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain]
    );
    const bigNumberPolyFee = new BigNumber(fee).shiftedBy(18).dp(0).toFixed();
    const params = {
      fromAssetHash: this.commonService.add0xHash(fromToken.assetID),
      toPoolId: 1,
      toChainId,
      toAddress: address,
      amount: new BigNumber(inputAmount).shiftedBy(fromToken.decimals),
      minOutAmount: this.swapService.getMinAmountOut(
        receiveAmount,
        BRIDGE_SLIPVALUE
      ),
      fee: bigNumberPolyFee,
      id: 1,
    };
    console.log(params);
    console.log(`value: ${bigNumberPolyFee}`);
    const data = swapContract.methods
      .add_liquidity(
        params.fromAssetHash,
        params.toPoolId,
        params.toChainId,
        params.toAddress,
        params.amount,
        params.minOutAmount,
        params.fee,
        params.id
      )
      .encodeABI();
    return this.ethereum
      .request({
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
        console.log(hash);
        this.handleTx(
          fromToken,
          toToken,
          inputAmount,
          receiveAmount,
          hash,
          'liquidity'
        );
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
    receiveAmount: string,
    fee: string
  ): Promise<string> {
    console.log('remove liquidity');
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain]
    );
    const usdtToken = USD_TOKENS.find((item) => item.chain === fromToken.chain);
    const bigNumberPolyFee = new BigNumber(fee).shiftedBy(18).dp(0).toFixed();
    const params = {
      fromAssetHash: this.commonService.add0xHash(fromToken.assetID),
      toPoolId: 1,
      toChainId,
      toAssetHash: this.commonService.add0xHash(usdtToken.assetID),
      toAddress: address,
      amount: new BigNumber(inputAmount).shiftedBy(fromToken.decimals),
      minOutAmount: this.swapService.getMinAmountOut(
        receiveAmount,
        BRIDGE_SLIPVALUE
      ),
      fee: bigNumberPolyFee,
      id: 1,
    };
    console.log(params);
    console.log(`value: ${bigNumberPolyFee}`);
    const data = swapContract.methods
      .remove_liquidity(
        params.fromAssetHash,
        params.toPoolId,
        params.toChainId,
        params.toAssetHash,
        params.toAddress,
        params.amount,
        params.minOutAmount,
        params.fee,
        params.id
      )
      .encodeABI();
    return this.ethereum
      .request({
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
        console.log(hash);
        this.handleTx(
          fromToken,
          usdtToken,
          inputAmount,
          receiveAmount,
          hash,
          'liquidity'
        );
        return hash;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }
  //#endregion

  //#region approve
  async getAllowance(
    fromToken: Token,
    fromAddress: string,
    aggregator?: string
  ): Promise<string> {
    console.log('\u001b[32m  ✓ start get allowance \u001b[0m');
    let tokenhash = fromToken.assetID;
    if (
      fromToken.symbol === WETH_ASSET_HASH[fromToken.chain].standardTokenSymbol
    ) {
      tokenhash = WETH_ASSET_HASH[fromToken.chain].assetID;
    }
    const json = await this.getEthErc20Json();
    const ethErc20Contract = new this.web3.eth.Contract(json, tokenhash);
    let contract = ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain];
    if (aggregator) {
      contract = AGGREGATOR_CONTRACT[fromToken.chain][aggregator];
    }
    const data = ethErc20Contract.methods
      .allowance(fromAddress, contract)
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_call',
        params: [this.getSendTransactionParams(fromAddress, tokenhash, data)],
      })
      .then((result) => {
        console.log('allowance: ' + result);
        console.log('aggregator: ' + aggregator);
        if (new BigNumber(result, 16).isNaN()) {
          return 0;
        }
        return new BigNumber(result, 16)
          .shiftedBy(-fromToken.decimals)
          .toFixed();
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  async approve(
    fromToken: Token,
    fromAddress: string,
    aggregator?: string
  ): Promise<any> {
    let tokenhash = fromToken.assetID;
    if (
      fromToken.symbol === WETH_ASSET_HASH[fromToken.chain].standardTokenSymbol
    ) {
      tokenhash = WETH_ASSET_HASH[fromToken.chain].assetID;
    }
    let contract = ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain];
    if (aggregator) {
      contract = AGGREGATOR_CONTRACT[fromToken.chain][aggregator];
    }
    const json = await this.getEthErc20Json();
    const ethErc20Contract = new this.web3.eth.Contract(json, tokenhash);
    const data = ethErc20Contract.methods
      .approve(
        contract,
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      )
      .encodeABI();
    try {
      const hash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [this.getSendTransactionParams(fromAddress, tokenhash, data)],
      });
      return hash;
    } catch (error) {
      this.handleDapiError(error);
      console.log(error);
    }
  }

  getReceipt(hash: string): Promise<any> {
    return this.ethereum
      .request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      })
      .then((receipt) => {
        if (receipt) {
          if (new BigNumber(receipt.status, 16).isZero()) {
            return false;
          } else {
            return true;
          }
        }
        return null;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }
  //#endregion

  //#region private function
  private handleTx(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    receiveAmount: string,
    txHash: string,
    txAtPage: TxAtPage,
    hasCrossChain = true
  ): void {
    const pendingTx: SwapTransaction = {
      txid: this.commonService.remove0xHash(txHash),
      isPending: true,
      isFailed: false,
      min: false,
      fromToken,
      toToken,
      amount: inputAmount,
      receiveAmount: new BigNumber(receiveAmount)
        .shiftedBy(-toToken.decimals)
        .toFixed(),
    };
    if (hasCrossChain) {
      pendingTx.progress = {
        step1: { hash: '', status: 1 },
        step2: { hash: '', status: 0 },
        step3: { hash: '', status: 0 },
      };
    }
    let dispatchType: string;
    switch (txAtPage) {
      case 'swap':
        dispatchType = UPDATE_PENDING_TX;
        this.transaction = pendingTx;
        break;
      case 'bridge':
        dispatchType = UPDATE_BRIDGE_PENDING_TX;
        this.bridgeeTransaction = pendingTx;
        break;
      case 'liquidity':
        dispatchType = UPDATE_LIQUIDITY_PENDING_TX;
        this.liquidityTransaction = pendingTx;
        break;
    }
    this.store.dispatch({ type: dispatchType, data: pendingTx });
    this.listerTxReceipt(txHash, dispatchType, hasCrossChain, txAtPage);
  }

  private listerTxReceipt(
    txHash: string,
    dispatchType: string,
    hasCrossChain = true,
    txAtPage: TxAtPage
  ): void {
    if (this.requestTxStatusInterval) {
      this.requestTxStatusInterval.unsubscribe();
    }
    this.requestTxStatusInterval = interval(5000).subscribe(() => {
      let currentTx: SwapTransaction;
      switch (txAtPage) {
        case 'swap':
          currentTx = this.transaction;
          break;
        case 'bridge':
          currentTx = this.bridgeeTransaction;
          break;
        case 'liquidity':
          currentTx = this.liquidityTransaction;
          break;
      }
      this.ethereum
        .request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        })
        .then((receipt) => {
          console.log(receipt);
          if (receipt) {
            this.requestTxStatusInterval.unsubscribe();
            currentTx.isPending = false;
            if (new BigNumber(receipt.status, 16).isZero()) {
              currentTx.isFailed = true;
            } else {
              if (hasCrossChain === false) {
                this.getBalance();
              }
            }
            this.store.dispatch({ type: dispatchType, data: currentTx });
          }
        })
        .catch((error) => {
          this.requestTxStatusInterval.unsubscribe();
          this.handleDapiError(error);
        });
    });
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
    console.log(error);
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
        const id = Number(chainId);
        if (this.metamaskNetworkId !== id) {
          this.metamaskNetworkId = id;
          this.store.dispatch({
            type: UPDATE_METAMASK_NETWORK_ID,
            data: id,
          });
        }
      })
      .catch((error) => {
        this.handleDapiError(error);
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
      if (this.accountAddress) {
        this.getBalance();
      }
    });
    this.ethereum.on('chainChanged', (chainId) => {
      const id = Number(chainId);
      if (this.metamaskNetworkId !== id) {
        this.metamaskNetworkId = id;
        this.store.dispatch({
          type: UPDATE_METAMASK_NETWORK_ID,
          data: id,
        });
        this.getBalance();
      }
    });
  }

  private getAggregatorSwapJson(
    chain: CHAINS,
    aggregator: string
  ): Promise<any> {
    if (this.aggregatorSwapJson[chain][aggregator]) {
      return of(this.aggregatorSwapJson[chain][aggregator]).toPromise();
    }
    return this.http
      .get(`assets/contracts-json/O3Swap${chain}${aggregator}Bridge.json`)
      .pipe(
        map((res) => {
          this.aggregatorSwapJson[chain][aggregator] = res;
          return res;
        })
      )
      .toPromise();
  }

  private getWEthJson(): Promise<any> {
    if (this.wEthJson) {
      return of(this.wEthJson).toPromise();
    }
    return this.http
      .get('assets/contracts-json/weth.json')
      .pipe(
        map((res) => {
          this.wEthJson = res;
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
