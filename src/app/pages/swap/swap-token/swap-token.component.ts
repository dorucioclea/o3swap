import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ALL_TOKENS, NEO_TOKENS, SwapStateType } from '@lib';
import { Token } from '@lib';
import { ApiService } from '@core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

interface State {
  swap: SwapStateType;
}

@Component({
  selector: 'app-swap-token',
  templateUrl: './swap-token.component.html',
  styleUrls: ['../common.scss', './swap-token.component.scss'],
})
export class SwapTokenComponent implements OnInit {
  @Input() activeToken: Token;
  @Input() hideToken: Token;
  @Output() closePage = new EventEmitter<Token | void>();

  swap$: Observable<any>;
  tokenBalance; // 账户的 tokens

  allTokens: Token[] = []; // 所有的 tokens, 排除了 fromToken 或 toToken
  displayTokens: any[] = []; // 最终展示的 tokens, search 结果
  isfocusSearchInput = false;

  constructor(private apiService: ApiService, private store: Store<State>) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.tokenBalance = state.balances;
      this.handleTokenAmount();
    });
    const tokens = NEO_TOKENS;
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.assetID !== this.hideToken.assetID)
      : tokens;
    this.displayTokens = this.allTokens;
  }

  backToHomePage(): void {
    this.closePage.emit();
  }

  selectThisToken(token: Token): void {
    this.closePage.emit(token);
  }

  search($event): void {
    let value: string = $event.target.value;
    value = value.trim().toUpperCase();
    if (value === '') {
      this.displayTokens = this.allTokens;
      return;
    }
    const tempTokens = this.allTokens.filter((item) =>
      item.symbol.startsWith(value)
    );
    this.allTokens.forEach((item) => {
      if (item.symbol.includes(value) && !item.symbol.startsWith(value)) {
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
  }
  //#endregion
}
