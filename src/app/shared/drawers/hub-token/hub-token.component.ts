import { Component, OnDestroy, OnInit } from '@angular/core';
import { CONST_BRIDGE_TOKENS, Token, USD_TOKENS } from '@lib';
import { Store } from '@ngrx/store';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-hub-token',
  templateUrl: './hub-token.component.html',
  styleUrls: ['./hub-token.component.scss'],
})
export class HubTokenComponent implements OnInit, OnDestroy {
  CONST_BRIDGE_TOKENS = CONST_BRIDGE_TOKENS;
  USD_TOKENS = USD_TOKENS;

  langPageName = 'hub-token';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(private drawerRef: NzDrawerRef, private store: Store<State>) {
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

  close(token?: Token): void {
    this.drawerRef.close(token);
  }
}
