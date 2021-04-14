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
  UPDATE_ETH_BALANCES,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  UPDATE_METAMASK_NETWORK_ID,
  UPDATE_PENDING_TX,
  CHAIN_TOKENS,
  UPDATE_BSC_BALANCES,
  UPDATE_HECO_BALANCES,
  ETH_SOURCE_ASSET_HASH,
  METAMASK_CHAIN,
  USD_TOKENS,
  ETH_SWAP_CONTRACT_HASH,
  AssetQueryResponseItem,
  O3_AGGREGATOR_SLIPVALUE,
  ApproveContract,
  TxAtPage,
  UPDATE_BRIDGE_PENDING_TX,
  UPDATE_LIQUIDITY_PENDING_TX,
  BRIDGE_SLIPVALUE,
  RESET_ETH_BALANCES,
  RESET_BSC_BALANCES,
  RESET_HECO_BALANCES,
  WETH_ASSET_HASH,
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
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  metamaskNetworkId: number;
  transaction: SwapTransaction;

  ethereum;
  isConnected: boolean;
  web3;
  swapperJson;
  ethErc20Json;
  o3UniSwapJson;

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
      this.transaction = Object.assign({}, state.transaction);
    });
  }

  init(): void {
    if ((window as any).ethereum) {
      const localEthWalletName = localStorage.getItem(
        'ethWalletName'
      ) as EthWalletName;
      const localBscWalletName = localStorage.getItem(
        'bscWalletName'
      ) as EthWalletName;
      const localHecoWalletName = localStorage.getItem(
        'hecoWalletName'
      ) as EthWalletName;
      if (localEthWalletName === 'MetaMask') {
        this.connect('ETH');
      }
      if (localBscWalletName === 'MetaMask') {
        this.connect('BSC');
      }
      if (localHecoWalletName === 'MetaMask') {
        this.connect('HECO');
      }
    }
  }

  connect(chain: string): void {
    if (!(window as any).ethereum) {
      this.swapService.toDownloadWallet(this.myWalletName);
      return;
    }
    this.web3 = new Web3((window as any).ethereum);
    this.ethereum = (window as any).ethereum;
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
        this.handleDapiError(error);
      });
  }

  async getBalance(): Promise<boolean> {
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
          return new BigNumber(balance).shiftedBy(-token.decimals).toFixed();
        })
        .catch((error) => {
          this.handleDapiError(error);
        });
    } else {
      return this.ethereum
        .request({
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

  async uniSwapExactTokensForETH(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    deadline: number
  ): Promise<any> {
    console.log('swapExactTokensForETHSupportingFeeOnTransferTokens');
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getO3UniSwapJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_SWAP_CONTRACT_HASH
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      amountIn: new BigNumber(inputAmount).shiftedBy(fromToken.decimals),
      uniAmountOutMin: this.swapService.getMinAmountOut(
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
        params.uniAmountOutMin,
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
            ETH_SWAP_CONTRACT_HASH,
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

  async uniSwapExactETHForTokens(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    deadline: number
  ): Promise<any> {
    console.log('swapExactETHForTokensSupportingFeeOnTransferTokens');
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getO3UniSwapJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_SWAP_CONTRACT_HASH
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      uniAmountOutMin: this.swapService.getMinAmountOut(
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
        params.uniAmountOutMin,
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
            ETH_SWAP_CONTRACT_HASH,
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

  async uniSwapExactTokensForTokens(
    fromToken: Token,
    toToken: Token,
    chooseSwapPath: AssetQueryResponseItem,
    inputAmount: string,
    fromAddress: string,
    toAddress: string,
    deadline: number
  ): Promise<any> {
    console.log('swapExactTokensForTokensSupportingFeeOnTransferTokens');
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getO3UniSwapJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_SWAP_CONTRACT_HASH
    );
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      amountIn: new BigNumber(inputAmount)
        .shiftedBy(fromToken.decimals)
        .dp(0)
        .toFixed(),
      uniAmountOutMin: this.swapService.getMinAmountOut(
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
        params.uniAmountOutMin,
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
            ETH_SWAP_CONTRACT_HASH,
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
        this.handleDapiError(error);
      });
  }

  async uniswapExactETHForTokensCrossChain(
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
    console.log('swapExactETHForTokensSupportingFeeOnTransferTokensCrossChain');
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getO3UniSwapJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_SWAP_CONTRACT_HASH
    );
    const amountOutA = chooseSwapPath.amount[chooseSwapPath.amount.length - 2];
    const bigNumberPolyFee = new BigNumber(polyFee)
      .shiftedBy(18)
      .dp(0)
      .toFixed();
    const receiveAmount =
      chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const params = {
      uniAmountOutMin: this.swapService.getMinAmountOut(
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
        params.uniAmountOutMin,
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
            ETH_SWAP_CONTRACT_HASH,
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

  async uniswapExactTokensForTokensCrossChain(
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
    console.log(
      'swapExactTokensForTokensSupportingFeeOnTransferTokensCrossChain'
    );
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    const json = await this.getO3UniSwapJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_SWAP_CONTRACT_HASH
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
      uniAmountOutMin: this.swapService.getMinAmountOut(
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
        params.uniAmountOutMin,
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
            ETH_SWAP_CONTRACT_HASH,
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

  async addLiquidity(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    address: string,
    toChainId: number,
    receiveAmount: string,
    fee: string
  ): Promise<string> {
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
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
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
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

  async getAllowance(
    fromToken: Token,
    fromAddress: string,
    approveContract?: ApproveContract
  ): Promise<string> {
    console.log('\u001b[32m  ✓ start get allowance \u001b[0m');
    let tokenhash = fromToken.assetID;
    if (fromToken.symbol === 'ETH') {
      tokenhash = WETH_ASSET_HASH;
    }
    const json = await this.getEthErc20Json();
    const ethErc20Contract = new this.web3.eth.Contract(json, tokenhash);
    let contract;
    switch (approveContract) {
      case 'poly':
        contract = ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain];
        break;
      case 'uniAggregator':
        contract = ETH_SWAP_CONTRACT_HASH;
        break;
      default:
        contract = ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain];
        break;
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
        console.log(fromToken);
        console.log(fromAddress);
        console.log(approveContract);
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
    approveContract?: ApproveContract
  ): Promise<any> {
    let tokenhash = fromToken.assetID;
    if (fromToken.symbol === 'ETH') {
      tokenhash = WETH_ASSET_HASH;
    }
    if (this.checkNetwork(fromToken) === false) {
      return;
    }
    let contract: string;
    switch (approveContract) {
      case 'poly':
        contract = ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain];
        break;
      case 'uniAggregator':
        contract = ETH_SWAP_CONTRACT_HASH;
        break;
      default:
        contract = ETH_CROSS_SWAP_CONTRACT_HASH[fromToken.chain];
        break;
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

  //#region
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
        break;
      case 'bridge':
        dispatchType = UPDATE_BRIDGE_PENDING_TX;
        break;
      case 'liquidity':
        dispatchType = UPDATE_LIQUIDITY_PENDING_TX;
        break;
    }
    this.store.dispatch({ type: dispatchType, data: pendingTx });
    this.listerTxReceipt(txHash, dispatchType, hasCrossChain);
  }

  listerTxReceipt(
    txHash: string,
    dispatchType: string,
    hasCrossChain = true
  ): void {
    if (this.requestTxStatusInterval) {
      this.requestTxStatusInterval.unsubscribe();
    }
    this.requestTxStatusInterval = interval(5000).subscribe(() => {
      this.ethereum
        .request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        })
        .then((receipt) => {
          console.log(receipt);
          if (receipt) {
            this.requestTxStatusInterval.unsubscribe();
            if (new BigNumber(receipt.status, 16).isZero()) {
              this.nzMessage.error('Transaction failed');
              this.store.dispatch({ type: dispatchType, data: null });
            } else {
              if (hasCrossChain === false) {
                this.getBalance();
                this.transaction.isPending = false;
                this.store.dispatch({
                  type: dispatchType,
                  data: this.transaction,
                });
              }
            }
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
          this.getBalance();
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

  private checkNetwork(fromToken: Token): boolean {
    if (this.metamaskNetworkId !== METAMASK_CHAIN_ID[fromToken.chain]) {
      this.nzMessage.error(
        `Please switch network to ${fromToken.chain} ${NETWORK} on MetaMask wallet.`
      );
      return false;
    }
    return true;
  }

  private getO3UniSwapJson(): Promise<any> {
    if (this.o3UniSwapJson) {
      return of(this.o3UniSwapJson).toPromise();
    }
    return this.http
      .get('assets/contracts-json/O3SwapUniBridge.json')
      .pipe(
        map((res) => {
          this.o3UniSwapJson = res;
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
