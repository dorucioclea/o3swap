import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  O3SWAP_FEE_PERCENTAGE,
  Token,
  NeoWalletName,
  AssetQueryResponse,
  AssetQueryResponseItem,
  SwapStateType,
  UPDATE_PENDING_TX,
} from '@lib';
import {
  ApiService,
  CommonService,
  SwapService,
  NeolineWalletApiService,
  O3NeoWalletApiService,
} from '@core';
import { NzMessageService } from 'ng-zorro-antd/message';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

interface State {
  swap: SwapStateType;
  cache: any;
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
  neoAccountAddress: string;
  ethAccountAddress: string;
  isMainNet: boolean;
  neoWalletName: NeoWalletName;
  pendingTx: string;

  cache$;
  txStatus;

  TOKENS: Token[] = []; // 所有的 tokens
  o3SwapFee = O3SWAP_FEE_PERCENTAGE;
  showRoutingModal = false; // swap 路径弹窗
  showTxHashModal = false;
  showInquiry: boolean;
  isTxPending = true;
  TX_PAGES_PREFIX = 'https://testnet.neotube.io/transaction/';
  // txhash = '0xff2eaa131b5b65caa64c048224a9860742194cfb5dbff5c44790ec4e406a45cf';
  // txPage = this.TX_PAGES_PREFIX + this.txhash;
  txPage: string;
  inquiryInterval; // 询价定时器

  chooseSwapPath: AssetQueryResponseItem;
  chooseSwapPathIndex: number;
  receiveSwapPathArray: AssetQueryResponse;
  price: string; // swap 比
  lnversePrice: string; // swap 反比

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private neolineWalletApiService: NeolineWalletApiService,
    private o3NeoWalletApiService: O3NeoWalletApiService
  ) {
    this.swap$ = store.select('swap');
    this.cache$ = store.select('cache');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.isMainNet = state.isMainNet;
      if (state.pendingTx !== null) {
        this.pendingTx = state.pendingTx;
        this.showTxHashModal = true;
        this.isTxPending = true;
        this.txPage = this.TX_PAGES_PREFIX + this.pendingTx;
      }
    });
    this.cache$.subscribe((state) => {
      this.txStatus = state.txStatus;
      if (this.txStatus[this.pendingTx] === true) {
        this.isTxPending = false;
        this.store.dispatch({ type: UPDATE_PENDING_TX, data: null });
      }
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

  swapCrossChain(): void {
    if (!this.neoAccountAddress) {
      this.nzMessage.error('Please connect the NEO wallet first');
      return;
    }
    if (!this.ethAccountAddress) {
      this.nzMessage.error('Please connect the ETH wallet first');
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
    const swapApi =
      this.neoWalletName === 'NeoLine'
        ? this.neolineWalletApiService
        : this.o3NeoWalletApiService;
    swapApi.swapCrossChain(
      this.fromToken,
      this.chooseSwapPath,
      this.inputAmount,
      this.slipValue,
      this.deadline,
      this.ethAccountAddress
    );
  }

  swap(): void {
    if (!this.neoAccountAddress) {
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
    const swapApi =
      this.neoWalletName === 'NeoLine'
        ? this.neolineWalletApiService
        : this.o3NeoWalletApiService;
    swapApi.swap(
      this.fromToken,
      this.chooseSwapPath,
      this.inputAmount,
      this.slipValue,
      this.deadline
    );
  }

  minTxHashModal(): void {}
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
