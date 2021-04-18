import { Component, OnInit } from '@angular/core';
import { ApiService, MetaMaskWalletApiService } from '@core';
import { CHAIN_TOKENS, NNEO_TOKEN, Token, USD_TOKENS } from '@lib';
import { NzMessageService } from 'ng-zorro-antd/message';

type PageStatus = 'home' | 'result';
@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss'],
})
export class SwapComponent implements OnInit {
  pageStatus: PageStatus = 'home';

  fromToken: Token = USD_TOKENS[0];
  toToken: Token;
  inputAmount: string; // 支付的 token 数量

  initResultData;

  constructor(
    private apiService: ApiService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private nzMessage: NzMessageService
  ) {}

  async ngOnInit(): Promise<void> {
    const chain = this.metaMaskWalletApiService.getChain();
    if (chain) {
      await this.apiService.getTokens();
      this.fromToken = this.apiService.CHAIN_TOKENS[chain][0];
    }
  }

  //#region home
  toInquiryPage({ inputAmount, fromToken, toToken }): void {
    this.initResultData = null;
    this.inputAmount = inputAmount;
    this.fromToken = fromToken;
    this.toToken = toToken;
    this.pageStatus = 'result';
  }
  toResultPage(): void {
    this.pageStatus = 'result';
  }
  //#endregion

  //#endregion result
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
  swapFail(): void {
    this.pageStatus = 'home';
    this.initResultData = null;
    this.nzMessage.error('Did not get the quotation, please get it again');
  }
  //#region
}
