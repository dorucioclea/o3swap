import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { CHAINS } from '@lib';
import { CommonService } from '@core';
import { Store } from '@ngrx/store';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-header-connect-item',
  templateUrl: './header-connect-item.component.html',
  styleUrls: ['./header-connect-item.component.scss'],
})
export class HeaderConnectItemComponent implements OnInit, OnDestroy {
  @Input() chain: CHAINS;
  @Input() walletName: string;
  @Input() accountAddress: string;
  @Output() changeWallet = new EventEmitter();
  @Output() disConnect = new EventEmitter();

  isShowModal = false;
  showModalTimeOut;

  langPageName = 'header';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private commonService: CommonService,
    private store: Store<State>
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

  showModal(): void {
    clearTimeout(this.showModalTimeOut);
    this.isShowModal = true;
  }

  hideModal(): void {
    this.showModalTimeOut = setTimeout(() => {
      this.isShowModal = false;
    }, 200);
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  toDisConnect(): void {
    this.isShowModal = false;
    this.disConnect.emit();
  }

  toChangeWallet(): void {
    this.isShowModal = false;
    this.changeWallet.emit();
  }
}
