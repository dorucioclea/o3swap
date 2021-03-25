import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  Account,
  O3SWAP_FEE_PERCENTAGE,
  Token,
  NeoWalletName,
  AssetQueryResponse,
  AssetQueryResponseItem,
  SwapStateType,
} from '@lib';
import {
  ApiService,
  CommonService,
  SwapService,
  NeolineWalletApiService,
} from '@core';
import { NzMessageService } from 'ng-zorro-antd/message';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

interface State {
  swap: SwapStateType;
}

@Component({
  selector: 'app-swap-result',
  templateUrl: './swap-result.component.html',
  styleUrls: ['../common.scss', './swap-result.component.scss'],
})
export class SwapResultComponent implements OnInit, OnDestroy {
  @Input() rates;
  @Input() fromToken: Token;
  @Input() toToken: Token;
  @Input() inputAmount: string; // 支付的 token 数量
  @Input() deadline: number;
  @Input() slipValue: number;
  @Input() initData: any;
  @Output() closePage = new EventEmitter<any>();
  @Output() swapFail = new EventEmitter();

  swap$: Observable<any>;
  neoAccount: Account;
  isMainNet: boolean;
  neoWalletName: NeoWalletName;

  TOKENS: Token[] = []; // 所有的 tokens
  o3SwapFee = O3SWAP_FEE_PERCENTAGE;
  showRoutingModal = false; // swap 路径弹窗
  showTxHashModal = false;
  showInquiry: boolean;
  isTxPending = true;
  TX_PAGES_PREFIX = 'https://testnet.neotube.io/transaction/';
  // txhash = '0xff2eaa131b5b65caa64c048224a9860742194cfb5dbff5c44790ec4e406a45cf';
  // txPage = this.TX_PAGES_PREFIX + this.txhash;
  txhash: string;
  txPage: string;
  inquiryInterval; // 询价定时器

  chooseSwapPath: AssetQueryResponseItem;
  chooseSwapPathIndex: number;
  receiveSwapPathArray: AssetQueryResponse;
  price: string; // swap 比
  lnversePrice: string; // swap 反比

  constructor(
    store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private neolineWalletApiService: NeolineWalletApiService
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.neoAccount = state.neoAccount;
    });
    if (this.initData) {
      this.chooseSwapPath = this.initData.chooseSwapPath;
      this.chooseSwapPathIndex = this.initData.chooseSwapPathIndex;
      this.receiveSwapPathArray = this.initData.receiveSwapPathArray;
      this.price = this.initData.price;
      this.lnversePrice = this.initData.lnversePrice;
      this.showInquiry = false;
    } else {
      this.showInquiry = true;
    }
    this.getSwapPath();
    this.inquiryInterval = setInterval(() => {
      this.getSwapPath();
    }, 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.inquiryInterval);
  }

  backToHomePage(): void {
    const initData = {
      chooseSwapPath: this.chooseSwapPath,
      chooseSwapPathIndex: this.chooseSwapPathIndex,
      receiveSwapPathArray: this.receiveSwapPathArray,
      price: this.price,
      lnversePrice: this.lnversePrice,
    };
    this.closePage.emit(initData);
  }
  copy(hash: string): void {
    this.commonService.copy(hash);
  }
  closeTxHashModal(): void {
    this.closePage.emit();
  }

  changeSwapPath(index: number): void {
    this.showRoutingModal = false;
    this.chooseSwapPathIndex = index;
    this.chooseSwapPath = this.receiveSwapPathArray[index];
    this.calculationPrice();
  }

  reGetSwapPath(): void {
    clearInterval(this.inquiryInterval);
    this.getSwapPath();
    this.inquiryInterval = setInterval(() => {
      this.getSwapPath();
    }, 30000);
  }

  async swap(): Promise<void> {
    if (!this.neoAccount) {
      this.nzMessage.error('Please connect the wallet first');
      return;
    }
    // if (this.isMainNet === false) {
    //   this.nzMessage.error('Please connect wallet to the main net.');
    //   return;
    // }
    if (
      new BigNumber(this.inputAmount).comparedTo(
        new BigNumber(this.fromToken.amount || 0)
      ) > 0
    ) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    clearInterval(this.inquiryInterval);
    this.neolineWalletApiService
      .swap(
        this.fromToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.slipValue,
        this.deadline
      )
      .then((txid) => {
        this.showTxHashModal = true;
        this.isTxPending = true;
        this.txPage = this.TX_PAGES_PREFIX + txid;
      });
  }
  //#region
  getSwapPath(): void {
    this.chooseSwapPath = null;
    this.apiService
      .getSwapPath(
        this.fromToken.symbol,
        this.toToken.symbol,
        this.swapService.getAmountIn(this.fromToken, this.inputAmount)
      )
      .subscribe((res) => {
        this.showInquiry = false;
        if (res.length === 0) {
          this.swapFail.emit();
        }
        if (res.length > 0) {
          this.handleReceiveSwapPathFiat(res);
        }
      });
  }
  handleReceiveSwapPathFiat(swapPathArr: AssetQueryResponse): void {
    swapPathArr.forEach((item) => {
      const tempAmount = item.amount[item.amount.length - 1];
      item.receiveAmount = new BigNumber(tempAmount)
        .shiftedBy(-this.toToken.decimals)
        .toFixed();
      // 计算法币价格
      const price = this.rates[this.toToken.symbol];
      if (price) {
        item.fiat = new BigNumber(item.receiveAmount)
          .multipliedBy(new BigNumber(price))
          .dp(2)
          .toFixed();
      }
    });
    this.receiveSwapPathArray = this.commonService.shellSortSwapPath(
      swapPathArr
    );
    this.chooseSwapPathIndex = 0;
    this.chooseSwapPath = this.receiveSwapPathArray[0];
    this.calculationPrice();
  }
  calculationPrice(): void {
    this.price = new BigNumber(this.chooseSwapPath.receiveAmount)
      .dividedBy(new BigNumber(this.inputAmount))
      .dp(7)
      .toFixed();
    this.lnversePrice = new BigNumber(this.inputAmount)
      .dividedBy(new BigNumber(this.chooseSwapPath.receiveAmount))
      .dp(7)
      .toFixed();
  }
  //#endregion
}
