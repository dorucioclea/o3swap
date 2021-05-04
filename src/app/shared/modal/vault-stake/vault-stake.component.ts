import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { SwapStateType, Token } from '@lib';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CommonService } from '@core';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
  language: any;
}

@Component({
  templateUrl: './vault-stake.component.html',
  styleUrls: ['./vault-stake.component.scss'],
})
export class VaultStakeComponent implements OnInit, OnDestroy {
  langPageName = 'vault';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;
  @Input() balance = '0';
  @Input() isStake = true;
  @Input() token: Token;
  inputAmount = '';
  constructor(
    private store: Store<State>,
    private modal: NzModalRef,
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

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  close(): void {
    this.modal.close();
  }
  confirm(): void {
    this.modal.close(this.inputAmount);
  }
}
