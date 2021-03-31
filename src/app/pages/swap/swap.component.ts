import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, CommonService } from '@core';
import { SwapStateType, SwapTransaction, Token, UPDATE_PENDING_TX } from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationOptions } from 'ngx-lottie';
import { interval, Observable, Unsubscribable } from 'rxjs';

type PageStatus = 'home' | 'result';
interface State {
  swap: SwapStateType;
}
@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss'],
})
export class SwapComponent implements OnInit, OnDestroy {
  successOptions: AnimationOptions = {
    path: '/assets/json/success.json',
    loop: false,
  };
  pendingOptions = {
    path: '/assets/json/pending.json',
  };
  pendingMinOptions = {
    path: '/assets/json/pending-min.json',
  };
  txCompleteOptions = {
    path: '/assets/json/tx-complete.json',
    loop: false,
  };
  txPendingOptions = {
    path: '/assets/json/tx-waiting.json',
  };
  NEO_TX_PAGES_PREFIX = 'https://testnet.neotube.io/transaction';
  POLY_TX_PAGES_PREFIX = 'https://explorer.poly.network/testnet/tx';
  ETH_TX_PAGES_PREFIX = 'https://ropsten.etherscan.io/tx';
  showTxModal = false;
  showTxDetail = false;

  swap$: Observable<any>;
  transaction: SwapTransaction;

  pageStatus: PageStatus = 'home';
  rates = {};

  fromToken: Token;
  toToken: Token;
  inputAmount: string; // 支付的 token 数量

  initResultData;

  crossRequestResult = {
    step1: { hash: '', status: 1 }, // 0 = 未开始, 1 = 进行中, 2 = 已完成
    step2: { hash: '', status: 0 },
    step3: { hash: '', status: 0 },
  };
  requestCrossInterval: Unsubscribable;
  swapProgress = 20;

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
      if (
        state.transaction &&
        state.transaction.txid !== this.transaction.txid &&
        state.transaction.toToken &&
        state.transaction.toToken.chain !== 'NEO' &&
        state.transaction.isPending
      ) {
        this.transaction = Object.assign({}, state.transaction);
        this.setRequestCrossInterval();
      }
      this.transaction = Object.assign({}, state.transaction);
      this.showTxModal = this.transaction.min === false ? true : false;
      if (this.transaction.isPending === false) {
        this.swapProgress = 100;
      } else {
        if (this.transaction.progress) {
          if (this.transaction.progress.step3.status === 2) {
            this.swapProgress = 100;
          } else if (this.transaction.progress.step2.status === 2) {
            this.swapProgress = 66;
          } else if (this.transaction.progress.step1.status === 2) {
            this.swapProgress = 33;
          } else {
            this.swapProgress = 20;
          }
        } else {
          this.swapProgress = 20;
        }
      }
    });
    this.getRates();
  }

  ngOnDestroy(): void {
    this.requestCrossInterval.unsubscribe();
  }

  setRequestCrossInterval(): void {
    this.requestCrossInterval = interval(5000).subscribe(() => {
      this.apiService
        .getCrossChainSwapDetail(this.transaction.txid)
        .subscribe((res) => {
          this.crossRequestResult = res;
          console.log(res);
          this.transaction.progress = res;
          this.store.dispatch({
            type: UPDATE_PENDING_TX,
            data: this.transaction,
          });
          if (
            this.crossRequestResult.step1.status === 2 &&
            this.crossRequestResult.step2.status === 2 &&
            this.crossRequestResult.step3.status === 2
          ) {
            this.transaction.isPending = false;
            this.requestCrossInterval.unsubscribe();
          }
        });
    });
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
