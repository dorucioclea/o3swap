import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CHAIN_BRIDGE_TOKENS, SwapStateType, CHAINS } from '@lib';
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
  myCHAIN_TOKENS;
  @Input() isFrom: boolean;
  @Input() fromToken: Token;
  @Input() toToken: Token;

  activeToken: Token;
  hideToken: Token;

  swap$: Observable<any>;
  tokenBalance = { ETH: {}, BSC: {}, HECO: {} }; // 账户的 tokens
  swapUnScribe: Unsubscribable;

  chain: CHAINS = 'ALL';
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
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.cloneTokens();
    this.activeToken = this.isFrom ? this.fromToken : this.toToken;
    this.hideToken = this.isFrom ? this.toToken : this.fromToken;
    this.getTokens();
    this.swapUnScribe = this.swap$.subscribe((state) => {
      this.receiveTokenBalance(state);
      this.changeDetectorRef.detectChanges();
    });
  }

  cloneTokens(): void {
    this.myCHAIN_TOKENS = JSON.parse(JSON.stringify(CHAIN_BRIDGE_TOKENS));
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
  getTokens(): void {
    const tokens = this.myCHAIN_TOKENS;
    this.allTokens = this.hideToken
      ? tokens.filter((item) => item.symbol !== this.hideToken.symbol)
      : tokens;
    this.displayTokens = this.allTokens;
  }
  receiveTokenBalance(state): void {
    if (
      JSON.stringify(state.ethBalances) !==
      JSON.stringify(this.tokenBalance.ETH)
    ) {
      this.tokenBalance.ETH = JSON.parse(JSON.stringify(state.ethBalances));
      this.handleTokenAmount('ETH');
    }
    if (
      JSON.stringify(state.bscBalances) !==
      JSON.stringify(this.tokenBalance.BSC)
    ) {
      this.tokenBalance.BSC = JSON.parse(JSON.stringify(state.bscBalances));
      this.handleTokenAmount('BSC');
    }
    if (
      JSON.stringify(state.hecoBalances) !==
      JSON.stringify(this.tokenBalance.HECO)
    ) {
      this.tokenBalance.HECO = JSON.parse(JSON.stringify(state.hecoBalances));
      this.handleTokenAmount('HECO');
    }
  }
  handleTokenAmount(chainType: CHAINS): void {
    const chainBalance = this.tokenBalance[chainType];
    // my chain tokens
    this.myCHAIN_TOKENS.forEach((tokenItem, index) => {
      if (
        chainBalance[tokenItem.assetID] &&
        chainBalance[tokenItem.assetID].symbol === // 资产id相同且symbol相同
          tokenItem.symbol
      ) {
        this.myCHAIN_TOKENS[index].amount =
          chainBalance[tokenItem.assetID].amount;
      }
    });
    this.myCHAIN_TOKENS = this.sortTokens(this.myCHAIN_TOKENS);
    // alltokens
    this.allTokens.forEach((tokenItem, index) => {
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
