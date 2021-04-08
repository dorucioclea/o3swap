import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '@core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DashboardStakeComponent } from '@shared';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private modal: NzModalService,
    private nzMessage: NzMessageService
  ) {}

  ngOnInit(): void {}

  showStake(type: 'from' | 'to'): void {
    const modal = this.modal.create({
      nzContent: DashboardStakeComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal custom-stake-modal',
      nzComponentParams: {
        isFrom: type === 'from' ? true : false,
      },
    });
    modal.afterClose.subscribe((res) => {
      if (res) {
        if (type === 'from') {
        } else {
        }
      }
    });
  }
}
