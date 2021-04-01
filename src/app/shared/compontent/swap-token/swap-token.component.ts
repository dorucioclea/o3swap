import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CHAIN_TOKENS, SwapStateType, CHAINS, NNEO_TOKEN } from '@lib';
import { Token } from '@lib';
import { Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CommonService } from '@core';

interface State {
  swap: SwapStateType;
}

@Component({
  templateUrl: './swap-token.component.html',
  styleUrls: ['./swap-token.component.scss'],
})
export class SwapTokenComponent implements OnInit, OnDestroy {
  myNNEO_TOKEN;
  myCHAIN_TOKENS;
  @Input() isFrom: boolean;
  @Input() fromToken: Token;
  @Input() toToken: Token;

  activeToken: Token;
  hideToken: Token;
  showOnlyNNeo = false;

  swap$: Observable<any>;
  tokenBalance; // 账户的 tokens
  swapUnScribe: Unsubscribable;

  chain: CHAINS;
  allTokens: Token[] = []; // 所有的 tokens, 排除了 fromToken 或 toToken
  displayTokens: any[] = []; // 最终展示的 tokens, search 结果
  isfocusSearchInput = false;

  constructor(
    private store: Store<State>,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalRef,
    private commonService: CommonService
  ) {
    this.swap$ = store.select('swap');
  }
  ngOnDestroy(): void {
    if (this.swapUnScribe !== null && this.swapUnScribe !== undefined) {
      this.swapUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.cloneChainTokens();
    this.myNNEO_TOKEN = JSON.parse(JSON.stringify(NNEO_TOKEN));
    this.checkShowOnlyNNeo();
    this.activeToken = this.isFrom ? this.fromToken : this.toToken;
    this.hideToken = this.isFrom ? this.toToken : this.fromToken;
    this.chain = this.isFrom === true ? 'NEO' : 'NEO';
    const tokens = this.showOnlyNNeo
      ? this.myNNEO_TOKEN
      : this.myCHAIN_TOKENS[this.chain];
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.assetID !== this.hideToken.assetID)
      : tokens;
    this.displayTokens = this.allTokens;
    this.swapUnScribe = this.swap$.subscribe((state) => {
      if (
        JSON.stringify(state.balances) !== JSON.stringify(this.tokenBalance)
      ) {
        this.tokenBalance = JSON.parse(JSON.stringify(state.balances));
        this.handleTokenAmount();
      }
      // this.changeDetectorRef.detectChanges();
    });
  }

  cloneChainTokens(): void {
    this.myCHAIN_TOKENS = {};
    this.myCHAIN_TOKENS.ALL = JSON.parse(JSON.stringify(CHAIN_TOKENS.ALL));
    this.myCHAIN_TOKENS.NEO = JSON.parse(JSON.stringify(CHAIN_TOKENS.NEO));
    this.myCHAIN_TOKENS.ETH = JSON.parse(JSON.stringify(CHAIN_TOKENS.ETH));
    this.myCHAIN_TOKENS.BSC = JSON.parse(JSON.stringify(CHAIN_TOKENS.BSC));
    this.myCHAIN_TOKENS.HECO = JSON.parse(JSON.stringify(CHAIN_TOKENS.HECO));
  }

  close(): void {
    this.modal.close();
  }

  checkShowOnlyNNeo(): void {
    const showOnlyNNeoTo =
      this.isFrom === false &&
      this.fromToken &&
      this.fromToken.symbol === 'NEO';
    const showOnlyNNeoFrom =
      this.isFrom && this.toToken && this.toToken.symbol === 'NEO';
    if (showOnlyNNeoFrom || showOnlyNNeoTo) {
      this.showOnlyNNeo = true;
    } else {
      this.showOnlyNNeo = false;
    }
  }

  changeChain(chain: CHAINS): void {
    if (this.isFrom || this.chain === chain) {
      return;
    }
    this.chain = chain;
    const tokens = this.showOnlyNNeo
      ? this.myNNEO_TOKEN
      : this.myCHAIN_TOKENS[this.chain];
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
    if (this.tokenBalance[this.myNNEO_TOKEN[0].assetID]) {
      this.myNNEO_TOKEN[0].amount = this.tokenBalance[
        this.myNNEO_TOKEN[0].assetID
      ].amount;
    }
    this.myCHAIN_TOKENS.ALL.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.myCHAIN_TOKENS.ALL[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.myCHAIN_TOKENS.NEO.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.myCHAIN_TOKENS.NEO[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.allTokens.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.allTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.displayTokens.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.displayTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.myCHAIN_TOKENS.ALL = this.sortTokens(this.myCHAIN_TOKENS.ALL);
    this.myCHAIN_TOKENS.NEO = this.sortTokens(this.myCHAIN_TOKENS.NEO);
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
