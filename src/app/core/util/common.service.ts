import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class CommonService {
  constructor(private nzMessage: NzMessageService) {}

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

  shellSortSwapPath(arr: any[]): any[] {
    const len = arr.length;
    let temp;
    let gap = 1;
    while (gap < len / 3) {
      // 动态定义间隔序列
      gap = gap * 3 + 1;
    }
    for (gap; gap > 0; gap = Math.floor(gap / 3)) {
      for (let i = gap; i < len; i++) {
        temp = arr[i];
        let j;
        for (
          j = i - gap;
          j >= 0 &&
          new BigNumber(arr[j].receiveAmount).comparedTo(
            new BigNumber(temp.receiveAmount)
          ) < 0;
          j -= gap
        ) {
          arr[j + gap] = arr[j];
        }
        arr[j + gap] = temp;
      }
    }
    return arr;
  }
}
