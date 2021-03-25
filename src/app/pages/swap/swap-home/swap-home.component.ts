import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Token } from '@lib';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-swap-home',
  templateUrl: './swap-home.component.html',
  styleUrls: ['../common.scss', './swap-home.component.scss'],
})
export class SwapHomeComponent implements OnInit {
  @Input() rates = {};
  @Input() fromToken: Token;
  @Input() toToken: Token;
  @Input() chooseSwapPath;
  @Input() inputAmount: string; // 支付的 token 数量
  @Output() toTokenPage = new EventEmitter<{
    tokenType: string;
    inputAmount: string;
  }>();
  @Output() toSettingPage = new EventEmitter<string>();
  @Output() toInquiryPage = new EventEmitter<string>();
  @Output() toResultPage = new EventEmitter();

  changeData = false;
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;

  constructor() {}

  ngOnInit(): void {
    this.checkInputAmountDecimal();
    this.calcutionInputAmountFiat();
  }

  showTokens(type: 'from' | 'to'): void {
    const tempData = { tokenType: type, inputAmount: this.inputAmount };
    this.toTokenPage.emit(tempData);
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
    this.checkInputAmountDecimal();
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  allInputAmount(): void {
    this.inputAmountError = '';
    this.inputAmount = (this.fromToken && this.fromToken.amount) || '0';
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  inquiry(): void {
    if (this.checkCanInquiry() === false) {
      return;
    }
    this.toInquiryPage.emit(this.inputAmount);
  }

  backToResultPage(): void {
    this.toResultPage.emit();
  }

  backToSettingPage(): void {
    this.toSettingPage.emit(this.inputAmount);
  }
  //#region
  checkCanInquiry(): boolean {
    if (!this.fromToken || !this.toToken || !this.inputAmount) {
      return false;
    }
    if (new BigNumber(this.inputAmount).comparedTo(0) <= 0) {
      return false;
    }
    if (this.checkInputAmountDecimal() === false) {
      return false;
    }
    return true;
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
