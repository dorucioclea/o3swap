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
  styleUrls: ['./swap.component.less'],
})
export class SwapComponent implements OnInit {
  pageStatus: PageStatus = 'home';
  myNeoDapi;
  account;
  walletType;
  tokenBalance = {}; // 账户的 tokens

  rates = {};
  fromToken: Token;
  toToken: Token;

  activeToken: Token;
  hideToken: Token;
  selectTokenType: 'from' | 'to';
  inputAmount: string; // 支付的 token 数量

  chooseSwapPath;
  showInquiry = true;

  // setting slip
  settings: Setting;

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
    this.chooseSwapPath = null;
    this.pageStatus = 'token';
  }
  toSettingPage(): void {
    this.pageStatus = 'setting';
  }
  toInquiryPage(amount): void {
    this.inputAmount = amount;
    this.pageStatus = 'result';
  }
  toResultPage(): void {
    this.showInquiry = false;
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

  closeResultPage(chooseSwapPath): void {
    if (chooseSwapPath) {
      this.chooseSwapPath = chooseSwapPath;
      this.pageStatus = 'home';
    }
  }
}
