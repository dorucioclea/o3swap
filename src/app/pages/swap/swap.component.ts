import { Component, OnInit } from '@angular/core';
import { ApiService, CommonService } from '@core';
import { SwapStateType, SwapTransaction, Token, UPDATE_PENDING_TX } from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationOptions } from 'ngx-lottie';
import { Observable } from 'rxjs';

type PageStatus = 'home' | 'token' | 'setting' | 'result';
export const defaultSlipValue = 2; // 默认滑点 2%
export const defaultDeadline = 10; // 分钟
interface Setting {
  slipValue: number | string;
  isCustomSlip: boolean;
  deadline: number;
}

interface State {
  swap: SwapStateType;
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss'],
})
export class SwapComponent implements OnInit {
  successOptions: AnimationOptions = {
    path: '/assets/json/success.json',
    loop: false,
  };
  pendingOptions = {
    path: '/assets/json/pending.json',
  };
  TX_PAGES_PREFIX = 'https://testnet.neotube.io/transaction/';
  txPage: string;

  swap$: Observable<any>;
  transaction: SwapTransaction;

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
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.transaction = Object.assign({}, state.transaction);
      this.txPage = this.TX_PAGES_PREFIX + this.transaction.txid;
    });
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

  minTxHashModal(): void {
    this.transaction.min = true;
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: this.transaction });
  }

  maxTxHashModal(): void {
    this.transaction.min = false;
    this.store.dispatch({ type: UPDATE_PENDING_TX, data: this.transaction });
  }

  copy(hash: string): void {
    this.commonService.copy(hash);
  }

  //#region home
  toTokenPage({ tokenType, inputAmount }): void {
    this.selectTokenType = tokenType;
    this.inputAmount = inputAmount;
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
  toSettingPage(amount): void {
    this.inputAmount = amount;
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
