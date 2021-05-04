import { Injectable } from '@angular/core';
import {
  ConnectChainType,
  EthWalletName,
  O3_TOKEN,
  RESET_VAULT_WALLET,
  StakeTransaction,
  Token,
  UPDATE_VAULT_STAKE_PENDING_TX,
  UPDATE_VAULT_WALLET,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { interval, Observable, of, Unsubscribable } from 'rxjs';
import { CommonService } from '../common.service';
import { SwapService } from '../swap.service';
import Web3 from 'web3';
import { VaultWallet } from 'src/app/_lib/vault';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { RpcApiService } from '@core/api/rpc.service';
interface State {
  vault: any;
}
@Injectable()
export class VaultdMetaMaskWalletApiService {
  myWalletName: EthWalletName = 'MetaMask';
  requestTxStatusInterval: Unsubscribable;

  vault$: Observable<any>;
  vaultWallet: VaultWallet;
  transaction: StakeTransaction;

  ethereum;
  web3: Web3;
  o3Json;

  constructor(
    private http: HttpClient,
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private swapService: SwapService,
    private commonService: CommonService,
    private rpcApiService: RpcApiService
  ) {
    this.vault$ = store.select('vault');
    this.vault$.subscribe((state) => {
      this.vaultWallet = state.vaultWallet;
    });
  }

  //#region connect
  init(): void {
    setTimeout(() => {
      if ((window as any).ethereum && (window as any).ethereum.isConnected()) {
        (window as any).ethereum
          .request({ method: 'eth_accounts' })
          .then((result) => {
            if (result.length === 0) {
              return;
            }
            const localVaultWallet = JSON.parse(
              sessionStorage.getItem('valueWallet')
            );
            if (
              localVaultWallet &&
              localVaultWallet.walletName === 'MetaMask'
            ) {
              this.vaultConnect(localVaultWallet.chain, false);
            }
          });
      }
    }, 1000);
  }
  vaultConnect(chain: string, showMessage = true): Promise<VaultWallet> {
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
        if (showMessage) {
          this.nzMessage.success('Connection succeeded!');
        }
        this.vaultWallet = {
          walletName: this.myWalletName,
          address: result[0],
          chain: chain as ConnectChainType,
        };
        this.store.dispatch({
          type: UPDATE_VAULT_WALLET,
          data: this.vaultWallet,
        });
        this.addListener();
        return this.vaultWallet;
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  //#region vault o3
  async stakeO3(
    token: Token,
    inputAmount: string,
  ): Promise<any> {
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(
      json,
      O3_TOKEN.assetID
    );
    const data = o3Contract.methods.stake(
        token.assetID,
        new BigNumber(inputAmount)
        .shiftedBy(token.decimals)
        .dp(0)
        .toFixed(),
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            this.vaultWallet.address,
            O3_TOKEN.assetID,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(
          token,
          inputAmount,
          hash,
          true
        );
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async unstakeO3(
    token: Token,
    inputAmount: string,
  ): Promise<any> {
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(
      json,
      O3_TOKEN.assetID
    );
    const data = o3Contract.methods.unstake(
        token.assetID,
        new BigNumber(inputAmount)
        .shiftedBy(token.decimals)
        .dp(0)
        .toFixed(),
      )
      .encodeABI();
    return this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          this.getSendTransactionParams(
            this.vaultWallet.address,
            O3_TOKEN.assetID,
            data
          ),
        ],
      })
      .then((hash) => {
        this.commonService.log(hash);
        this.handleTx(
          token,
          inputAmount,
          hash,
          false
        );
        return hash;
      })
      .catch((error) => {
        this.commonService.log(error);
        this.handleDapiError(error);
      });
  }
  async getUnlockedOf(): Promise<string> {
    const token = O3_TOKEN;
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, token.assetID);
    const data = await o3Contract.methods
      .unlockedOf(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
        token.assetID,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getLockedOf(): Promise<string> {
    const token = O3_TOKEN;
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, token.assetID);
    const data = await o3Contract.methods
      .lockedOf(this.vaultWallet.address)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
        token.assetID,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  async getStaked(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3_TOKEN.assetID);
    const data = await o3Contract.methods
      .getStaked(token.assetID)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
        O3_TOKEN.assetID,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    }).catch(error => {
    });
  }
  async getUnlockSpeed(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3_TOKEN.assetID);
    const data = await o3Contract.methods
      .getUnlockSpeed(this.vaultWallet.address, token.assetID)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
        O3_TOKEN.assetID,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return new BigNumber(res).div(new BigNumber('100000000')).toFixed();
      }
    });
  }
  async claimableUnlocked(token: Token): Promise<string> {
    if (!this.vaultWallet) {
      return;
    }
    let params;
    const json = await this.getO3Json();
    const o3Contract = new this.web3.eth.Contract(json, O3_TOKEN.assetID);
    const data = await o3Contract.methods
      .claimableUnlocked(token.assetID)
      .encodeABI();
    params = [
      this.getSendTransactionParams(
        this.vaultWallet.address,
        O3_TOKEN.assetID,
        data
      ),
      'latest',
    ];
    return this.rpcApiService.getEthCall(params, token).then((res) => {
      if (res) {
        return res;
      }
    });
  }
  //#endregion

  //#region private function
  private handleDapiError(error): void {
    this.commonService.log(error);
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
    this.ethereum.on('accountsChanged', (accounts) => {
      if (
        this.vaultWallet &&
        this.vaultWallet.walletName === this.myWalletName
      ) {
        const accountAddress = accounts.length > 0 ? accounts[0] : null;
        if (accountAddress !== null) {
          this.vaultWallet.address = accountAddress;
          this.store.dispatch({
            type: UPDATE_VAULT_WALLET,
            data: this.vaultWallet,
          });
        } else {
          this.store.dispatch({ type: RESET_VAULT_WALLET });
        }
      }
    });
  }

  private handleTx(
    fromToken: Token,
    inputAmount: string,
    txHash: string,
    isStake: boolean
  ): void {
    const pendingTx: StakeTransaction = {
      txid: this.commonService.remove0xHash(txHash),
      isPending: true,
      isFailed: false,
      fromToken,
      amount: inputAmount,
      isStake,
      walletName: 'MetaMask',
    };

    let dispatchType: string;
    dispatchType = UPDATE_VAULT_STAKE_PENDING_TX;
    this.transaction = pendingTx;
    this.store.dispatch({ type: dispatchType, data: pendingTx });
    this.listerTxReceipt(txHash, dispatchType);
  }

  private listerTxReceipt(
    txHash: string,
    dispatchType: string,
  ): void {
    if (!this.ethereum) {
      return;
    }
    let myInterval = this.requestTxStatusInterval;
    if (myInterval) {
      myInterval.unsubscribe();
    }
    myInterval = interval(5000).subscribe(() => {
      let currentTx: StakeTransaction;
      currentTx = this.transaction;
      this.rpcApiService
        .getEthTxReceipt(txHash, currentTx.fromToken.chain)
        .subscribe(
          (receipt) => {
            if (receipt) {
              myInterval.unsubscribe();
              if (new BigNumber(receipt.status, 16).isZero()) {
                currentTx.isPending = false;
                currentTx.isFailed = true;
                this.store.dispatch({ type: dispatchType, data: currentTx });
              } else {
                currentTx.isPending = false;
                this.store.dispatch({ type: dispatchType, data: currentTx });
              }
            }
          },
          (error) => {
            myInterval.unsubscribe();
            this.commonService.log(error);
          }
        );
    });
  }


  private getO3Json(): Promise<any> {
    if (this.o3Json) {
      return of(this.o3Json).toPromise();
    }
    return this.http
      .get('assets/contracts-json/O3.json')
      .pipe(
        map((res) => {
          this.o3Json = res;
          return res;
        })
      )
      .toPromise();
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
  //#endregion
}
