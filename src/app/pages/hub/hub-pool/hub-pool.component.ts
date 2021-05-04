import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-hub-pool',
  templateUrl: './hub-pool.component.html',
  styleUrls: ['./hub-pool.component.scss', './mobile.scss'],
})
export class HubPoolComponent implements OnInit, OnDestroy {
  langPageName = 'hub-pool';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(private store: Store<State>) {
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
}
