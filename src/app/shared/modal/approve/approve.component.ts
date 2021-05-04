import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Token } from '@lib';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { O3EthWalletApiService, MetaMaskWalletApiService } from '@core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Store } from '@ngrx/store';

interface State {
  language: any;
}

@Component({
  templateUrl: './approve.component.html',
  styleUrls: ['./approve.component.scss'],
})
export class ApproveComponent implements OnInit, OnDestroy {
  @Input() aggregator?: string;
  @Input() fromToken: Token;
  @Input() fromAddress: string;
  @Input() walletName: string;

  isApproveLoading = false;
  approveInterval: Unsubscribable;

  langPageName = 'app';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private o3EthWalletApiService: O3EthWalletApiService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private modal: NzModalRef
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }
  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {}

  approve(): void {
    if (this.approveInterval) {
      this.approveInterval.unsubscribe();
    }
    this.isApproveLoading = true;
    const swapApi = this.getEthDapiService();
    swapApi
      .approve(this.fromToken, this.fromAddress, this.aggregator)
      .then((hash) => {
        if (hash) {
          this.approveInterval = interval(5000).subscribe(async () => {
            const receipt = await swapApi.getReceipt(
              hash,
              this.fromToken.chain
            );
            if (receipt !== null) {
              this.approveInterval.unsubscribe();
              this.isApproveLoading = false;
              this.close();
            }
          });
        } else {
          this.isApproveLoading = false;
        }
      });
  }

  getEthDapiService(): any {
    return this.walletName === 'MetaMask' || !this.walletName
      ? this.metaMaskWalletApiService
      : this.o3EthWalletApiService;
  }

  close(): void {
    this.modal.close();
  }
}
