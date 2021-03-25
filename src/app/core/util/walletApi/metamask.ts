import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class MetaMaskWalletApiService {
  constructor(private nzMessage: NzMessageService) {}

}
