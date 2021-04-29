import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '@core';
import { INIT_CHAIN_TOKENS, Token, USD_TOKENS } from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  tokens: any;
  swap: any;
}

type PageStatus = 'home' | 'result';
@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss'],
})
export class SwapComponent implements OnInit, OnDestroy {
  pageStatus: PageStatus = 'home';

  fromToken: Token;
  toToken: Token;
  inputAmount: string; // 支付的 token 数量

  initResultData;

  tokensUnScribe: Unsubscribable;
  tokens$: Observable<any>;
  chainTokens = INIT_CHAIN_TOKENS;

  swapUnScribe: Unsubscribable;
  swap$: Observable<any>;
  walletName = { ETH: '', BSC: '', HECO: '', NEO: '' };

  constructor(
    private store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService
  ) {
    this.tokens$ = store.select('tokens');
    this.swap$ = store.select('swap');
  }

  async ngOnInit(): Promise<void> {
    this.tokensUnScribe = this.tokens$.subscribe((state) => {
      this.chainTokens = state.chainTokens;
      if (this.chainTokens.ETH.length > 0) {
        this.handleFromToken();
      }
    });
    this.swapUnScribe = this.swap$.subscribe((state) => {
      this.walletName.ETH = state.ethWalletName;
      this.walletName.BSC = state.bscWalletName;
      this.walletName.HECO = state.hecoWalletName;
      this.walletName.NEO = state.neoWalletName;
    });
  }

  handleFromToken(): void {
    setTimeout(() => {
      if (this.fromToken) {
        return;
      }
      if (this.walletName.ETH) {
        this.fromToken = Object.assign({}, this.chainTokens.ETH[0]);
      } else if (this.walletName.BSC) {
        this.fromToken = Object.assign({}, this.chainTokens.BSC[0]);
      } else if (this.walletName.HECO) {
        this.fromToken = Object.assign({}, this.chainTokens.HECO[0]);
      } else if (this.walletName.NEO) {
        this.fromToken = Object.assign({}, this.chainTokens.NEO[0]);
      } else {
        this.fromToken = USD_TOKENS[0];
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.tokensUnScribe) {
      this.tokensUnScribe.unsubscribe();
    }
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
  }

  //#region home
  toInquiryPage({ inputAmount, fromToken, toToken }): void {
    this.initResultData = null;
    this.inputAmount = inputAmount;
    this.fromToken = fromToken;
    this.toToken = toToken;
    this.pageStatus = 'result';
  }
  toResultPage(): void {
    this.pageStatus = 'result';
  }
  //#endregion

  //#endregion result
  closeResultPage(initData: any): void {
    if (initData) {
      this.initResultData = initData;
    } else {
      this.fromToken = null;
      this.toToken = null;
      this.inputAmount = '';
      this.initResultData = null;
    }
    this.pageStatus = 'home';
  }
  swapFail(): void {
    this.pageStatus = 'home';
    this.initResultData = null;
    this.nzMessage.error('Did not get the quotation, please get it again');
  }
  //#region
}
