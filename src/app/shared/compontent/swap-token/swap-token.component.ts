import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { SwapStateType, CHAINS, NNEO_TOKEN } from '@lib';
import { Token } from '@lib';
import { Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { ApiService } from '@core';
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
  hideNeoToken = false; // from 或 to 不是 NNEO 时不显示 NEO
  showOnlyNNeo = false; // from 或 to 是 NEO 时只显示 NNEO

  swap$: Observable<any>;
  tokenBalance = { NEO: {}, ETH: {}, BSC: {}, HECO: {} }; // 账户的 tokens
  swapUnScribe: Unsubscribable;

  chain: CHAINS = 'ETH';
  allTokens: Token[] = []; // 所有的 tokens, 排除了 fromToken 或 toToken
  displayTokens: any[] = []; // 最终展示的 tokens, search 结果
  isfocusSearchInput = false;

  constructor(
    private store: Store<State>,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalRef,
    private apiService: ApiService
  ) {
    this.swap$ = store.select('swap');
  }
  ngOnDestroy(): void {
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.getChainType();
    this.cloneTokens();
    this.checkShowOnlyNNeo();
    this.checkHideNeo();
    this.activeToken = this.isFrom ? this.fromToken : this.toToken;
    this.hideToken = this.isFrom ? this.toToken : this.fromToken;
    this.getTokens();
    this.swapUnScribe = this.swap$.subscribe((state) => {
      this.receiveTokenBalance(state);
      this.changeDetectorRef.detectChanges();
    });
  }

  cloneTokens(): void {
    this.myCHAIN_TOKENS = {};
    this.myCHAIN_TOKENS.ALL = JSON.parse(
      JSON.stringify(this.apiService.CHAIN_TOKENS.ALL)
    );
    this.myCHAIN_TOKENS.NEO = JSON.parse(
      JSON.stringify(this.apiService.CHAIN_TOKENS.NEO)
    );
    this.myCHAIN_TOKENS.ETH = JSON.parse(
      JSON.stringify(this.apiService.CHAIN_TOKENS.ETH)
    );
    this.myCHAIN_TOKENS.BSC = JSON.parse(
      JSON.stringify(this.apiService.CHAIN_TOKENS.BSC)
    );
    this.myCHAIN_TOKENS.HECO = JSON.parse(
      JSON.stringify(this.apiService.CHAIN_TOKENS.HECO)
    );
    this.myNNEO_TOKEN = [JSON.parse(JSON.stringify(NNEO_TOKEN))];
  }

  close(): void {
    this.modal.close();
  }

  changeChain(chain: CHAINS): void {
    if (this.chain === chain) {
      return;
    }
    this.chain = chain;
    const tokens = this.showOnlyNNeo
      ? this.myNNEO_TOKEN
      : this.myCHAIN_TOKENS[this.chain];
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.symbol !== this.hideToken.symbol)
      : tokens;
    this.allTokens = this.hideNeoToken
      ? this.allTokens.filter((item) => item.symbol !== 'NEO')
      : this.allTokens;
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
  getChainType(): void {
    if (this.isFrom) {
      if (this.toToken) {
        this.chain = this.toToken.chain;
      }
    } else {
      if (this.fromToken) {
        this.chain = this.fromToken.chain;
      }
    }
  }
  getTokens(): void {
    const tokens = this.showOnlyNNeo
      ? this.myNNEO_TOKEN
      : this.myCHAIN_TOKENS[this.chain];
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.symbol !== this.hideToken.symbol)
      : tokens;
    this.allTokens = this.hideNeoToken
      ? this.allTokens.filter((item) => item.symbol !== 'NEO')
      : this.allTokens;
    this.displayTokens = this.allTokens;
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
  checkHideNeo(): void {
    if (this.isFrom && this.toToken && this.toToken.symbol !== 'nNEO') {
      this.hideNeoToken = true;
    }
    if (!this.isFrom && this.fromToken && this.fromToken.symbol !== 'nNEO') {
      this.hideNeoToken = true;
    }
  }
  receiveTokenBalance(state): void {
    this.tokenBalance.NEO = state.balances;
    this.tokenBalance.ETH = state.ethBalances;
    this.tokenBalance.BSC = state.bscBalances;
    this.tokenBalance.HECO = state.hecoBalances;
    this.handleTokenAmount();
  }
  handleTokenAmount(): void {
    if (this.tokenBalance.NEO[this.myNNEO_TOKEN[0].assetID]) {
      this.myNNEO_TOKEN[0].amount = this.tokenBalance.NEO[
        this.myNNEO_TOKEN[0].assetID
      ].amount;
    }
    // chainType tokens
    Object.keys(this.myCHAIN_TOKENS).forEach((key) => {
      this.myCHAIN_TOKENS[key].forEach((tokenItem, index) => {
        const chainBalance = this.tokenBalance[tokenItem.chain];
        if (
          chainBalance[tokenItem.assetID] &&
          chainBalance[tokenItem.assetID].symbol === // 资产id相同且symbol相同
            tokenItem.symbol
        ) {
          this.myCHAIN_TOKENS[key][index].amount =
            chainBalance[tokenItem.assetID].amount;
        }
      });
      this.myCHAIN_TOKENS[key] = this.sortTokens(this.myCHAIN_TOKENS[key]);
    });
    // alltokens
    this.allTokens.forEach((tokenItem, index) => {
      const chainBalance = this.tokenBalance[tokenItem.chain];
      if (
        chainBalance[tokenItem.assetID] &&
        chainBalance[tokenItem.assetID].symbol === // 资产id相同且symbol相同
          tokenItem.symbol
      ) {
        this.allTokens[index].amount = chainBalance[tokenItem.assetID].amount;
      }
    });
    this.allTokens = this.sortTokens(this.allTokens);
    // display tokens
    this.displayTokens.forEach((tokenItem, index) => {
      const chainBalance = this.tokenBalance[tokenItem.chain];
      if (
        chainBalance[tokenItem.assetID] &&
        chainBalance[tokenItem.assetID].symbol === // 资产id相同且symbol相同
          tokenItem.symbol
      ) {
        this.displayTokens[index].amount =
          chainBalance[tokenItem.assetID].amount;
      }
    });
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
