import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Token } from '@lib';
import { ApiService, CommonService } from '@core';
import { NzMessageService } from 'ng-zorro-antd/message';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-swap-home',
  templateUrl: './swap-home.component.html',
  styleUrls: ['../common.less', './swap-home.component.less'],
})
export class SwapHomeComponent implements OnInit {
  @Input() rates = {};
  @Input() fromToken: Token;
  @Input() toToken: Token;
  @Input() chooseSwapPath;
  @Input() inputAmount: string; // 支付的 token 数量
  @Output() toTokenPage = new EventEmitter<'from' | 'to'>();
  @Output() toSettingPage = new EventEmitter();
  @Output() toInquiryPage = new EventEmitter<string>();
  @Output() toResultPage = new EventEmitter();

  changeData = false;
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;

  constructor() {}

  ngOnInit(): void {}

  showTokens(type: 'from' | 'to'): void {
    this.toTokenPage.emit(type);
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
    this.checkInputAmount();
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  allInputAmount(): void {
    this.inputAmount = this.fromToken.amount;
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  inquiry(): void {
    if (this.checkInputAmount() === false) {
      return;
    }
    this.toInquiryPage.emit(this.inputAmount);
  }

  backToResultPage(): void {
    this.toResultPage.emit();
  }

  backToSettingPage(): void {
    this.toSettingPage.emit();
  }
  //#region
  checkInputAmount(): boolean {
    const decimalPart = this.inputAmount && this.inputAmount.split('.')[1];
    if (
      this.fromToken &&
      decimalPart &&
      decimalPart.length > this.fromToken.decimals
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
    const price = this.rates[this.fromToken.symbol];
    if (this.inputAmount && price) {
      this.inputAmountFiat = new BigNumber(this.inputAmount)
        .multipliedBy(new BigNumber(price))
        .dp(2)
        .toFixed();
    } else {
      this.inputAmountFiat = '';
    }
  }
  //#endregion
}
