import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
import { SwapSettingComponent, SwapTokenComponent } from '@shared';

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
  @Input() inputAmount: number = 0;
  rates = {};


  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
    this.getRates()
  }

  ngOnDestroy(): void {

  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      console.log(res)
      this.rates = res;
    });
  }
}
