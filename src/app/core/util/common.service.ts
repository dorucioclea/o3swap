import { Injectable } from '@angular/core';
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


  isNeoAddress(address: string): boolean {
    const isAddressPattern = new RegExp(/^A([0-9a-zA-Z]{33})$/);
    return isAddressPattern.test(address);
  }
}
