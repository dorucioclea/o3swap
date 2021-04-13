import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import {
  ALL_PERCENTAGE,
  AssetQueryResponseItem,
  ALL_NEO_TOKENS,
  Token,
  WalletName,
  NeoWalletName,
  CHAINS,
  CHAIN_TOKENS,
} from '@lib';
import { CommonService } from './common.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class SwapService {
  constructor(
    private commonService: CommonService,
    private nzMessage: NzMessageService
  ) {}

  getAmountIn(fromToken: Token, inputAmount: string): string {
    const factAmount = new BigNumber(inputAmount)
      .dividedBy(ALL_PERCENTAGE)
      .toFixed();
    return this.commonService.decimalToInteger(factAmount, fromToken.decimals);
  }
  getMinAmountOut(amountOut: string, slipValue: number): string {
    const factPercentage = new BigNumber(1).minus(
      new BigNumber(slipValue).shiftedBy(-2)
    );
    const factAmount = new BigNumber(amountOut)
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
  getAssetNamePath(swapPath: string[], chain: CHAINS): any[] {
    const target = [];
    swapPath.forEach((hash) => {
      const token = CHAIN_TOKENS[chain].find(
        (item) =>
          this.commonService.remove0xHash(item.assetID).toLowerCase() ===
          this.commonService.remove0xHash(hash).toLowerCase()
      );
      target.push(token.symbol);
    });
    return target;
  }
  getNeoAssetHashByName(name: string): string {
    const token = ALL_NEO_TOKENS.find((item) => item.symbol === name);
    return (token && token.assetID) || '';
  }
  getHash160FromAddress(text: string): any {
    text = this.commonService.remove0xHash(text);
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
    let message: string;
    switch (error.type) {
      case 'NO_PROVIDER':
        this.toDownloadWallet(walletName);
        break;
      case 'CONNECTION_DENIED':
        message = 'The user rejected the request to connect with your dApp';
        break;
      case 'RPC_ERROR':
        message = 'RPC connection to a network node fails';
        break;
      case 'MALFORMED_INPUT':
        message = 'The address is not a valid NEO address';
        break;
      case 'CANCELED':
        message = 'User cancels, or refuses the dapps request';
        break;
      case 'FAIL':
        message = 'The request failed';
        break;
      case 'INSUFFICIENT_FUNDS':
        message = 'Insufficient balance';
        break;
      default:
        if (typeof error === 'string') {
          message = error;
        } else {
          message = error.type || 'Unknown error';
        }
        break;
    }
    if (message) {
      this.nzMessage.error(message);
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
