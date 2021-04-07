import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, CommonService } from '@core';
import {
  SwapStateType,
  SwapTransaction,
  Token,
  UPDATE_PENDING_TX,
  ETH_TX_PAGES_PREFIX,
  POLY_TX_PAGES_PREFIX,
  NEO_TX_PAGES_PREFIX,
  TxProgress,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationOptions } from 'ngx-lottie';
import { interval, Observable, Unsubscribable } from 'rxjs';

type PageStatus = 'home' | 'result';
interface State {
  swap: SwapStateType;
}
@Component({
  selector: 'app-bridge',
  templateUrl: './bridge.component.html',
  styleUrls: ['./bridge.component.scss'],
})
export class BridgeComponent implements OnInit, OnDestroy {

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

}
