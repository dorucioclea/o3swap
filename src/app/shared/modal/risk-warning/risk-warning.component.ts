import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  templateUrl: './risk-warning.component.html',
  styleUrls: ['./risk-warning.component.scss'],
})
export class RiskWarningComponent implements OnInit, OnDestroy {
  langPageName = 'risk-warning';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(private modal: NzModalRef, private store: Store<State>) {
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

  close(): void {
    this.modal.close();
  }
}
