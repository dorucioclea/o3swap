import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CHAIN_USD_TOKENS, SwapStateType, CHAINS, USDT_TOKEN } from '@lib';
import { Token } from '@lib';
import { Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CommonService } from '@core';

interface State {
  swap: SwapStateType;
}

@Component({
  templateUrl: './bridge-token.component.html',
  styleUrls: ['./bridge-token.component.scss'],
})
export class BridgeTokenComponent implements OnInit, OnDestroy {
  myUSDT_TOKEN;
  myCHAIN_TOKENS;
  @Input() isFrom: boolean;
  @Input() fromToken: Token;
  @Input() toToken: Token;

  activeToken: Token;
  hideToken: Token;
  hideUsdtToken = false;
  showOnlyUsdt = false;

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
    this.myUSDT_TOKEN = JSON.parse(JSON.stringify(USDT_TOKEN));
    this.activeToken = this.isFrom ? this.fromToken : this.toToken;
    this.hideToken = this.isFrom ? this.toToken : this.fromToken;
    this.chain = this.isFrom === true ? 'ETH' : 'ETH';
    const tokens = this.showOnlyUsdt
      ? this.myUSDT_TOKEN
      : this.myCHAIN_TOKENS[this.chain];
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.symbol !== this.hideToken.symbol)
      : tokens;
    this.allTokens = this.hideUsdtToken
      ? this.allTokens.filter((item) => item.symbol !== 'USDT')
      : this.allTokens;
    this.displayTokens = this.allTokens;
    this.swapUnScribe = this.swap$.subscribe((state) => {
      if (
        JSON.stringify(state.balances) !== JSON.stringify(this.tokenBalance)
      ) {
        this.tokenBalance = JSON.parse(JSON.stringify(state.balances));
        this.handleTokenAmount();
      }
    });
  }

  cloneChainTokens(): void {
    this.myCHAIN_TOKENS = {};
    this.myCHAIN_TOKENS.ALL = JSON.parse(JSON.stringify(CHAIN_USD_TOKENS.USD));
    this.myCHAIN_TOKENS.ETH = JSON.parse(JSON.stringify(CHAIN_USD_TOKENS.ETH));
    this.myCHAIN_TOKENS.BSC = JSON.parse(JSON.stringify(CHAIN_USD_TOKENS.BSC));
    this.myCHAIN_TOKENS.HECO = JSON.parse(JSON.stringify(CHAIN_USD_TOKENS.HECO));
  }

  close(): void {
    this.modal.close();
  }

  changeChain(chain: CHAINS): void {
    if (this.chain === chain) {
      return;
    }
    this.chain = chain;
    const tokens = this.showOnlyUsdt
      ? this.myUSDT_TOKEN
      : this.myCHAIN_TOKENS[this.chain];
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.symbol !== this.hideToken.symbol)
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
    if (this.tokenBalance[this.myUSDT_TOKEN[0].assetID]) {
      this.myUSDT_TOKEN[0].amount = this.tokenBalance[
        this.myUSDT_TOKEN[0].assetID
      ].amount;
    }
    this.myCHAIN_TOKENS.ALL.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.myCHAIN_TOKENS.ALL[index].amount = this.tokenBalance[
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
