import { Injectable } from '@angular/core';
import {
  EthWalletName,
  ETH_SWAP_CONTRACT_HASH,
  SwapStateType,
  SWAP_CONTRACT_CHAIN_ID,
  SWAP_CONTRACT_HASH,
  Token,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  UPDATE_METAMASK_NETWORK_ID,
} from '@lib';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable, of } from 'rxjs';
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

  swap$: Observable<any>;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  ethereum;
  isConnected: boolean;
  web3;
  SwapperJson;

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
        console.log(chain);
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

  async swapCrossChain(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    fromAddress: string,
    toAddress: string
  ): Promise<void> {
    const json = await this.getSwapperJson();
    const swapContract = new this.web3.eth.Contract(
      json,
      ETH_SWAP_CONTRACT_HASH
    );
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
      .on('transactionHash', (hash) => {
        console.log(hash);
      });
  }

  addListener(): void {
    this.ethereum
      .request({ method: 'net_version' })
      .then((chainId) => {
        this.commonService.log('chainId: ' + chainId);
        this.store.dispatch({
          type: UPDATE_METAMASK_NETWORK_ID,
          data: chainId,
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
        data: chainId,
      });
    });
  }

  //#region
  private getSwapperJson(): Promise<any> {
    if (this.SwapperJson) {
      return of(this.SwapperJson).toPromise();
    }
    return this.http
      .get('assets/contracts-json/eth-swapper.json')
      .pipe(
        map((res) => {
          console.log(res);
          this.SwapperJson = res;
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
