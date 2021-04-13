import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService, CommonService, MetaMaskWalletApiService } from '@core';
import {
  SwapStateType,
  SwapTransaction,
  UPDATE_PENDING_TX,
  UPDATE_BRIDGE_PENDING_TX,
  UPDATE_LIQUIDITY_PENDING_TX,
  TX_PAGES_PREFIX,
  POLY_TX_PAGES_PREFIX,
  TxProgress,
  TxAtPage,
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
  @Input() txAtPage: TxAtPage;
  dispatchType: string;

  TX_PAGES_PREFIX = TX_PAGES_PREFIX;
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
  hasTransaction = false;

  swap$: Observable<any>;
  transaction: SwapTransaction;

  requestCrossInterval: Unsubscribable;
  swapProgress = 20;

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private metaMaskWalletApiService: MetaMaskWalletApiService
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    switch (this.txAtPage) {
      case 'swap':
        this.dispatchType = UPDATE_PENDING_TX;
        break;
      case 'bridge':
        this.dispatchType = UPDATE_BRIDGE_PENDING_TX;
        break;
      case 'liquidity':
        this.dispatchType = UPDATE_LIQUIDITY_PENDING_TX;
        break;
    }
    this.swap$.subscribe((state) => {
      switch (this.txAtPage) {
        case 'swap':
          this.hasTransaction = state.transaction ? true : false;
          if (this.hasTransaction) {
            this.handleTransacction(state.transaction);
          }
          break;
        case 'bridge':
          this.hasTransaction = state.bridgeeTransaction ? true : false;
          if (this.hasTransaction) {
            this.handleTransacction(state.bridgeeTransaction);
          }
          break;
        case 'liquidity':
          this.hasTransaction = state.liquidityTransaction ? true : false;
          if (this.hasTransaction) {
            this.handleTransacction(state.liquidityTransaction);
          }
          break;
      }
      if (!this.hasTransaction && this.requestCrossInterval) {
        this.requestCrossInterval.unsubscribe();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.requestCrossInterval) {
      this.requestCrossInterval.unsubscribe();
    }
  }

  setRequestCrossInterval(): void {
    if (this.requestCrossInterval) {
      this.requestCrossInterval.unsubscribe();
    }
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
            this.metaMaskWalletApiService.getBalance();
          }
          this.store.dispatch({
            type: this.dispatchType,
            data: this.transaction,
          });
        });
    });
  }

  minTxHashModal(): void {
    this.transaction.min = true;
    this.store.dispatch({ type: this.dispatchType, data: this.transaction });
  }

  maxTxHashModal(): void {
    this.transaction.min = false;
    this.store.dispatch({ type: this.dispatchType, data: this.transaction });
  }

  copy(hash: string): void {
    this.commonService.copy(hash);
  }
  handleTransacction(stateTx): void {
    // 跨链交易定时查询交易状态
    if (
      stateTx &&
      stateTx.txid !== this.transaction?.txid &&
      stateTx.progress &&
      stateTx.isPending
    ) {
      this.transaction = Object.assign({}, stateTx);
      this.setRequestCrossInterval();
    }
    if (this.requestCrossInterval && !stateTx.progress) {
      this.requestCrossInterval.unsubscribe();
    }
    this.transaction = Object.assign({}, stateTx);
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
  }
}
