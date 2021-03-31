import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Token, UPDATE_SETTING } from '@lib';
import BigNumber from 'bignumber.js';
import { SwapSettingComponent, SwapTokenComponent } from '@shared';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

interface State {
  setting: any;
}

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
  @Output() toInquiryPage = new EventEmitter<{
    inputAmount: string;
    fromToken: Token;
    toToken: Token;
  }>();
  @Output() toResultPage = new EventEmitter();

  // setting modal
  setting$: Observable<any>;
  slipValue: number;
  isCustomSlip: boolean; // 自定义滑点
  deadline: number;

  changeData = false;
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;

  constructor(private modal: NzModalService, public store: Store<State>) {
    this.setting$ = store.select('setting');
  }

  ngOnInit(): void {
    this.setting$.subscribe((state) => {
      this.slipValue = state.slipValue;
      this.isCustomSlip = state.isCustomSlip;
      this.deadline = state.deadline;
    });
    this.checkInputAmountDecimal();
    this.calcutionInputAmountFiat();
  }

  showTokens(type: 'from' | 'to'): void {
    const modal = this.modal.create({
      nzContent: SwapTokenComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        activeToken: type === 'from' ? this.fromToken : this.toToken,
        hideToken: type === 'from' ? this.toToken : this.fromToken,
      },
    });
    modal.afterClose.subscribe((res) => {
      if (res) {
        this.changeData = true;
        if (type === 'from') {
          this.fromToken = res;
          this.checkInputAmountDecimal();
          this.calcutionInputAmountFiat();
        } else {
          this.toToken = res;
        }
      }
    });
  }

  exchangeToken(): void {
    if (this.toToken || this.fromToken) {
      const temp = this.fromToken;
      this.fromToken = this.toToken;
      this.toToken = temp;
      this.checkInputAmountDecimal();
      this.calcutionInputAmountFiat();
    }
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
    this.changeData = true;
    this.checkInputAmountDecimal();
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  allInputAmount(): void {
    this.inputAmountError = '';
    this.inputAmount = (this.fromToken && this.fromToken.amount) || '0';
    this.changeData = true;
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  inquiry(): void {
    if (this.checkCanInquiry() === false) {
      return;
    }
    this.toInquiryPage.emit({
      inputAmount: this.inputAmount,
      fromToken: this.fromToken,
      toToken: this.toToken,
    });
  }

  backToResultPage(): void {
    this.toResultPage.emit();
  }

  showSetting(): void {
    const moadl = this.modal.create({
      nzContent: SwapSettingComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal',
      nzMaskClosable: false,
      nzComponentParams: {
        slipValue: this.slipValue,
        isCustomSlip: this.isCustomSlip,
        deadline: this.deadline,
      },
    });
    moadl.afterClose.subscribe((res) => {
      this.store.dispatch({ type: UPDATE_SETTING, data: res });
    });
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
