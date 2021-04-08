import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { SwapStateType } from '@lib';
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
  @Input() inputAmount: number = 0;

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

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  close(): void {
    this.modal.close();
  }
}
