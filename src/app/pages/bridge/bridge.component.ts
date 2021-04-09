import { Component, Input, Output, OnDestroy, OnInit, EventEmitter } from '@angular/core';
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
import { NzModalService } from 'ng-zorro-antd/modal';
import { AnimationOptions } from 'ngx-lottie';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { SwapSettingComponent, SwapTokenComponent } from '@shared';
import BigNumber from 'bignumber.js';

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
  @Input() inputAmount: string;
  @Input() fromToken: Token;
  @Input() toToken: Token;

  @Output() toInquiryPage = new EventEmitter<{
    inputAmount: string;
    fromToken: Token;
    toToken: Token;
  }>();
  @Output() toResultPage = new EventEmitter();

  changeData = false;
  chooseSwapPath = {};
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;
  rates = {};


  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private modal: NzModalService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
    this.getRates()
  }

  ngOnDestroy(): void {

  }

  showTokens(type: 'from' | 'to'): void {
    const modal = this.modal.create({
      nzContent: SwapTokenComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        isFrom: type === 'from' ? true : false,
        fromToken: this.fromToken,
        toToken: this.toToken,
      },
    });
    modal.afterClose.subscribe((res) => {
      if (res) {
        this.resetSwapData();
        if (type === 'from') {
          this.fromToken = res;
          console.log(res)
          this.checkInputAmountDecimal();
          this.calcutionInputAmountFiat();
        } else {
          this.toToken = res;
        }
      }
    });
  }

  checkInputAmountDecimal(): boolean {
    const decimalPart = this.inputAmount && this.inputAmount.split('.')[1];
    if (
      this.fromToken &&
      decimalPart &&
      decimalPart.length > this.fromToken.decimals
    ) {
      this.inputAmountError = `You've exceeded the decimal limit.`;
      return false;
    }
    // neo nneo 互换只能整单位
    if (
      this.fromToken &&
      this.fromToken.symbol === 'nNEO' &&
      this.toToken &&
      this.toToken.symbol === 'NEO' &&
      decimalPart &&
      decimalPart.length > 0
    ) {
      this.inputAmountError = `You've exceeded the decimal limit.`;
      return false;
    }
    this.inputAmountError = '';
    return true;
  }

  resetSwapData(): void {
    this.changeData = true;
    this.chooseSwapPath = {};
  }

  calcutionInputAmountFiat(): void {
    if (!this.fromToken) {
      return;
    }
    const price = this.rates[this.fromToken.rateName];
    if (this.inputAmount && price) {
      this.inputAmountFiat = new BigNumber(this.inputAmount)
        .multipliedBy(new BigNumber(price))
        .dp(2)
        .toFixed();
    } else {
      this.inputAmountFiat = '';
    }
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
