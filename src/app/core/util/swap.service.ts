import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AssetQueryResponse,
  ALL_PERCENTAGE,
  AssetQueryResponseItem,
  ALL_NEO_TOKENS,
  Token,
  WalletName,
  NeoWalletName,
} from '@lib';
import { ApiService } from '../api/api.service';
import { CommonService } from './common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as crypto from 'crypto-js';
import { ethers } from 'ethers';

@Injectable()
export class SwapService {
  constructor(
    private apiService: ApiService,
    private commonService: CommonService,
    private nzMessage: NzMessageService
  ) {}

  getToNeoSwapPath(fromToken: Token, inputAmount: string): Promise<string[]> {
    if (fromToken.symbol === 'nNEO') {
      return of(['nNEO']).toPromise();
    }
    return this.apiService
      .getSwapPath(
        fromToken.symbol,
        'nNEO',
        this.getAmountIn(fromToken, inputAmount)
      )
      .pipe(
        map((res: AssetQueryResponse) => {
          if (res.length > 0) {
            return res[0].swapPath;
          } else {
            return [];
          }
        })
      )
      .toPromise();
  }
  getAmountIn(fromToken: Token, inputAmount: string): string {
    const factAmount = new BigNumber(inputAmount)
      .dividedBy(ALL_PERCENTAGE)
      .toFixed();
    return this.commonService.decimalToInteger(factAmount, fromToken.decimals);
  }
  getAmountOutMin(
    chooseSwapPath: AssetQueryResponseItem,
    slipValue: number
  ): string {
    const amount = chooseSwapPath.amount[chooseSwapPath.amount.length - 1];
    const factPercentage = new BigNumber(1).minus(
      new BigNumber(slipValue).shiftedBy(-2)
    );
    const factAmount = new BigNumber(amount)
      .times(factPercentage)
      .dp(0)
      .toFixed();
    return factAmount;
  }
  getAssetHashPath(swapPath: string[]): any[] {
    const target = [];
    swapPath.forEach((name) => {
      const assetHash = this.getNeoAssetHashByName(name);
      if (assetHash) {
        target.push({ type: 'Hash160', value: assetHash });
      }
    });
    return target;
  }
  getNeoAssetHashByName(name: string): string {
    const token = ALL_NEO_TOKENS.find((item) => item.symbol === name);
    return (token && token.assetID) || '';
  }
  getNeoAssetLogoByName(name: string): string {
    const token = ALL_NEO_TOKENS.find((item) => item.symbol === name);
    return (token && token.logo) || '';
  }
  getHash160FromAddress(text: string): any {
    if (text.startsWith('0x')) {
      text = text.slice(2);
    }
    return this.reverseHex(text);
  }
  private reverseHex(hex): string {
    let out = '';
    for (let i = hex.length - 2; i >= 0; i -= 2) {
      out += hex.substr(i, 2);
    }
    return out;
  }
  handleNeoDapiError(error, walletName: NeoWalletName): void {
    switch (error.type) {
      case 'NO_PROVIDER':
        this.toDownloadWallet(walletName);
        break;
      case 'CONNECTION_DENIED':
        this.nzMessage.error(
          'The user rejected the request to connect with your dApp'
        );
        break;
      default:
        this.nzMessage.error(error.type);
        break;
    }
  }
  toDownloadWallet(type: WalletName): void {
    switch (type) {
      case 'O3':
        window.open('https://o3.network/#download');
        break;
      case 'NeoLine':
        window.open(
          'https://chrome.google.com/webstore/detail/neoline/cphhlgmgameodnhkjdmkpanlelnlohao'
        );
        break;
      case 'MetaMask':
        window.open(
          'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
        );
        break;
    }
  }
}
