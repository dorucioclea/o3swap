import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CHAIN_TOKENS, SwapStateType, CHAINS } from '@lib';
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
  @Input() isFrom: boolean;

  swap$: Observable<any>;
  tokenBalance; // 账户的 tokens

  chain: CHAINS;
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
    this.chain = this.isFrom === true ? 'NEO' : 'ALL';
    const tokens = CHAIN_TOKENS[this.chain];
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

  changeChain(chain: CHAINS): void {
    if (this.isFrom || this.chain === chain) {
      return;
    }
    this.chain = chain;
    const tokens = CHAIN_TOKENS[this.chain];
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.assetID !== this.hideToken.assetID)
      : tokens;
    this.displayTokens = this.allTokens;
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
    // CHAIN_TOKENS.ALL.forEach((tokenItem, index) => {
    //   CHAIN_TOKENS.ALL[index].amount = '0';
    //   if (this.tokenBalance[tokenItem.assetID]) {
    //     CHAIN_TOKENS.ALL[index].amount = this.tokenBalance[
    //       tokenItem.assetID
    //     ].amount;
    //   }
    // });
    // CHAIN_TOKENS.NEO.forEach((tokenItem, index) => {
    //   CHAIN_TOKENS.NEO[index].amount = '0';
    //   if (this.tokenBalance[tokenItem.assetID]) {
    //     CHAIN_TOKENS.NEO[index].amount = this.tokenBalance[
    //       tokenItem.assetID
    //     ].amount;
    //   }
    // });
    this.allTokens.forEach((tokenItem, index) => {
      this.allTokens[index].amount = '0';
      if (this.tokenBalance[tokenItem.assetID]) {
        this.allTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.displayTokens.forEach((tokenItem, index) => {
      this.displayTokens[index].amount = '0';
      if (this.tokenBalance[tokenItem.assetID]) {
        this.displayTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    // CHAIN_TOKENS.ALL = this.sortTokens(CHAIN_TOKENS.ALL);
    // CHAIN_TOKENS.NEO = this.sortTokens(CHAIN_TOKENS.NEO);
    this.allTokens = this.sortTokens(this.allTokens);
    this.displayTokens = this.sortTokens(this.displayTokens);
  }
  sortTokens(tokens: Token[]): Token[] {
    const targetTokens = [];
    const noMoneyTokens = [];
    tokens.forEach((item) => {
      if (item.amount !== '0') {
        targetTokens.push(item);
      } else {
        noMoneyTokens.push(item);
      }
    });
    return targetTokens.concat(...noMoneyTokens);
  }
  //#endregion
}
