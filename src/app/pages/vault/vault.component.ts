import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '@core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { VaultStakeComponent } from '@shared';
import { Store } from '@ngrx/store';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}
@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss', './mobile.scss'],
})
export class VaultComponent implements OnInit, OnDestroy {
  langPageName = 'vault';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private modal: NzModalService,
    private nzMessage: NzMessageService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  showStake(): void {
    const modal = this.modal.create({
      nzContent: VaultStakeComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal custom-stake-modal',
    });
    modal.afterClose.subscribe((res) => {
      if (res) {
      }
    });
  }
}
