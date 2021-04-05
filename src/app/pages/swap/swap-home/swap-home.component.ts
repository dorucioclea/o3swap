import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { SwapStateType, Token, UPDATE_SETTING } from '@lib';
import BigNumber from 'bignumber.js';
import { SwapSettingComponent, SwapTokenComponent } from '@shared';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Store } from '@ngrx/store';
import { Observable, Unsubscribable } from 'rxjs';

interface State {
  setting: any;
  swap: SwapStateType;
}

@Component({
  selector: 'app-swap-home',
  templateUrl: './swap-home.component.html',
  styleUrls: ['../common.scss', './swap-home.component.scss'],
})
export class SwapHomeComponent implements OnInit, OnDestroy {
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

  swap$: Observable<any>;
  tokenBalance; // 账户的 tokens
  swapUnScribe: Unsubscribable;

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
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.setting$.subscribe((state) => {
      this.slipValue = state.slipValue;
      this.isCustomSlip = state.isCustomSlip;
      this.deadline = state.deadline;
    });
    this.checkInputAmountDecimal();
    this.calcutionInputAmountFiat();
    this.swapUnScribe = this.swap$.subscribe((state) => {
      if (
        this.fromToken &&
        JSON.stringify(state.balances) !== JSON.stringify(this.tokenBalance)
      ) {
        this.tokenBalance = JSON.parse(JSON.stringify(state.balances));
        if (this.tokenBalance[this.fromToken.assetID]) {
          this.fromToken.amount = this.tokenBalance[
            this.fromToken.assetID
          ].amount;
        }
      }
      // this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.swapUnScribe !== null && this.swapUnScribe !== undefined) {
      this.swapUnScribe.unsubscribe();
    }
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
      this.resetSwapData();
      this.checkInputAmountDecimal();
      this.calcutionInputAmountFiat();
    }
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
    this.resetSwapData();
    this.checkInputAmountDecimal();
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  allInputAmount(): void {
    this.inputAmountError = '';
    this.inputAmount = (this.fromToken && this.fromToken.amount) || '0';
    this.resetSwapData();
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
  //#endregion
}
