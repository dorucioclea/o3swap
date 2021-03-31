import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { ALL_TOKENS, NEO_TOKENS, SwapStateType } from '@lib';
import { Token } from '@lib';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';

interface State {
  swap: SwapStateType;
}

@Component({
  templateUrl: './swap-token.component.html',
  styleUrls: ['./swap-token.component.scss'],
})
export class SwapTokenComponent implements OnInit {
  @Input() activeToken: Token;
  @Input() hideToken: Token;

  swap$: Observable<any>;
  tokenBalance; // 账户的 tokens

  allTokens: Token[] = []; // 所有的 tokens, 排除了 fromToken 或 toToken
  displayTokens: any[] = []; // 最终展示的 tokens, search 结果
  isfocusSearchInput = false;

  constructor(
    private store: Store<State>,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalRef
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    const tokens = NEO_TOKENS;
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.assetID !== this.hideToken.assetID)
      : tokens;
    this.displayTokens = this.allTokens;
    this.swap$.subscribe((state) => {
      this.tokenBalance = state.balances;
      this.handleTokenAmount();
      // this.changeDetectorRef.detectChanges();
    });
  }

  close(): void {
    this.modal.close();
  }

  selectThisToken(token: Token): void {
    this.modal.close(token);
  }

  search($event): void {
    let value: string = $event.target.value;
    value = value.trim().toLowerCase();
    if (value === '') {
      this.displayTokens = this.allTokens;
      return;
    }
    const tempTokens = this.allTokens.filter((item) =>
      item.symbol.toLowerCase().startsWith(value)
    );
    this.allTokens.forEach((item) => {
      if (
        item.symbol.toLowerCase().includes(value) &&
        !item.symbol.toLowerCase().startsWith(value)
      ) {
        tempTokens.push(item);
      }
    });
    this.displayTokens = tempTokens;
  }

  //#region
  handleTokenAmount(): void {
    this.allTokens.forEach((tokenItem, index) => {
      this.allTokens[index].amount = null;
      if (this.tokenBalance[tokenItem.assetID]) {
        this.allTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.displayTokens.forEach((tokenItem, index) => {
      this.displayTokens[index].amount = null;
      if (this.tokenBalance[tokenItem.assetID]) {
        this.displayTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.allTokens = this.sortTokens(this.allTokens);
    this.displayTokens = this.sortTokens(this.displayTokens);
  }
  sortTokens(tokens: Token[]): Token[] {
    const targetTokens = [];
    const noMoneyTokens = [];
    tokens.forEach((item) => {
      if (item.amount !== null) {
        targetTokens.push(item);
      } else {
        noMoneyTokens.push(item);
      }
    });
    return targetTokens.concat(...noMoneyTokens);
  }
  //#endregion
}
