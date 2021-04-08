import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class CommonService {
  isProduction = environment.production;

  constructor(private nzMessage: NzMessageService) { }

  log(value: any): void {
    if (this.isProduction === false) {
      console.log(value);
    }
  }

  copy(value: string): void {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.setAttribute('value', value);
    input.select();
    if (document.execCommand('copy')) {
      document.execCommand('copy');
      this.nzMessage.success('Copied Successfully');
    }
    document.body.removeChild(input);
  }

  decimalToInteger(value, decimals: number): string {
    if (new BigNumber(value).isNaN()) {
      return '';
    }
    return new BigNumber(value).shiftedBy(decimals).dp(0).toFixed();
  }

  isNeoAddress(address: string): boolean {
    const isAddressPattern = new RegExp(/^A([0-9a-zA-Z]{33})$/);
    return isAddressPattern.test(address);
  }

  wordlimit(value: number | string): string {
    let data = value.toString();
    if (value && data.length > 13) {
      data = data.substring(0, 10) + '...';
    }
    return data;
  }
}
