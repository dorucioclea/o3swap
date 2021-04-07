import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CHAIN_TOKENS, SwapStateType, CHAINS, NNEO_TOKEN } from '@lib';
import { Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CommonService } from '@core';

interface State {
  swap: SwapStateType;
}

@Component({
  templateUrl: './dashboard-stake.component.html',
  styleUrls: ['./dashboard-stake.component.scss'],
})
export class DashboardStakeComponent implements OnInit, OnDestroy {
  @Input() isFrom: boolean;
  @Input() amount = 0;

  hideNeoToken = false;
  showOnlyNNeo = false;

  constructor(
    private store: Store<State>,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalRef,
    private commonService: CommonService
  ) {
  }
  ngOnDestroy(): void {
  }

  ngOnInit(): void {

  }

  cloneChainTokens(): void {

  }

  close(): void {
    this.modal.close();
  }
}
