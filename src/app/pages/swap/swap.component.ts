import { Component, OnInit } from '@angular/core';
import { ApiService, CommonService } from '@core';
import { Token } from '@lib';
import { NzMessageService } from 'ng-zorro-antd/message';

type PageStatus = 'home' | 'token' | 'setting' | 'result';
export const defaultSlipValue = 2; // 默认滑点 2%
export const defaultDeadline = 10; // 分钟
interface Setting {
  slipValue: number | string;
  isCustomSlip: boolean;
  deadline: number;
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss'],
})
export class SwapComponent implements OnInit {
  pageStatus: PageStatus = 'home';

  rates = {};
  fromToken: Token;
  toToken: Token;

  activeToken: Token;
  hideToken: Token;
  selectTokenType: 'from' | 'to';
  inputAmount: string; // 支付的 token 数量

  // setting slip
  settings: Setting;

  initResultData;

  constructor(
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {}
  ngOnInit(): void {
    this.settings = {
      deadline: defaultDeadline,
      slipValue: defaultSlipValue,
      isCustomSlip: false,
    };
    this.getRates();
  }

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      this.rates = res;
    });
  }

  //#region home
  toTokenPage(tokenType: 'from' | 'to'): void {
    this.selectTokenType = tokenType;
    if (tokenType === 'from') {
      this.hideToken = this.toToken;
      this.activeToken = this.fromToken;
    } else {
      this.hideToken = this.fromToken;
      this.activeToken = this.toToken;
    }
    this.initResultData = null;
    this.pageStatus = 'token';
  }
  toSettingPage(): void {
    this.pageStatus = 'setting';
  }
  toInquiryPage(amount): void {
    this.initResultData = null;
    this.inputAmount = amount;
    this.pageStatus = 'result';
  }
  toResultPage(): void {
    this.pageStatus = 'result';
  }
  //#endregion

  closeSettingPage(settings: Setting): void {
    this.settings = settings;
    this.pageStatus = 'home';
  }

  closeTokenPage(token: Token): void {
    if (token) {
      if (this.selectTokenType === 'from') {
        this.fromToken = token;
      } else {
        this.toToken = token;
      }
    }
    this.pageStatus = 'home';
  }

  closeResultPage(initData: any): void {
    if (initData) {
      this.initResultData = initData;
    } else {
      this.fromToken = null;
      this.toToken = null;
      this.inputAmount = '';
      this.initResultData = null;
    }
    this.pageStatus = 'home';
  }
}
