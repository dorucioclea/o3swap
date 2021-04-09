import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService, CommonService } from '@core';
import {
  SwapStateType,
  SwapTransaction,
  UPDATE_PENDING_TX,
  ETH_TX_PAGES_PREFIX,
  POLY_TX_PAGES_PREFIX,
  NEO_TX_PAGES_PREFIX,
  TxProgress,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationOptions } from 'ngx-lottie';
import { interval, Observable, Unsubscribable } from 'rxjs';

interface State {
  swap: SwapStateType;
}
@Component({
  selector: 'app-tx-progress',
  templateUrl: './tx-progress.component.html',
  styleUrls: ['./tx-progress.component.scss'],
})
export class TxProgressComponent implements OnInit, OnDestroy {
  ETH_TX_PAGES_PREFIX = ETH_TX_PAGES_PREFIX;
  NEO_TX_PAGES_PREFIX = NEO_TX_PAGES_PREFIX;
  POLY_TX_PAGES_PREFIX = POLY_TX_PAGES_PREFIX;
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
  showTxModal = false;
  showTxDetail = false;

  swap$: Observable<any>;
  transaction: SwapTransaction;

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
        state.transaction.txid !== this.transaction?.txid &&
        state.transaction.fromToken.chain !== state.transaction.toToken.chain &&
        state.transaction.isPending
      ) {
        this.transaction = Object.assign({}, state.transaction);
        this.setRequestCrossInterval();
      }
      // if (交易失败) {
      //   if (this.requestCrossInterval) {
      //     this.requestCrossInterval.unsubscribe();
      //   }
      // }
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
  }

  ngOnDestroy(): void {
    if (
      this.requestCrossInterval !== null &&
      this.requestCrossInterval !== undefined
    ) {
      this.requestCrossInterval.unsubscribe();
    }
  }

  setRequestCrossInterval(): void {
    this.requestCrossInterval = interval(5000).subscribe(() => {
      this.apiService
        .getCrossChainSwapDetail(this.transaction.txid)
        .subscribe((res: TxProgress) => {
          this.commonService.log(res);
          this.transaction.progress = res;
          if (
            res.step1.status === 2 &&
            res.step2.status === 2 &&
            res.step3.status === 2
          ) {
            this.transaction.isPending = false;
            this.requestCrossInterval.unsubscribe();
          }
          this.store.dispatch({
            type: UPDATE_PENDING_TX,
            data: this.transaction,
          });
        });
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
}
