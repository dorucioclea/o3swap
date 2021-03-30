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
import { NzModalService } from 'ng-zorro-antd/modal';
import { SwapExchangeComponent } from '@shared';

interface State {
  swap: SwapStateType;
  setting: any;
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
  @Input() initData: any;
  @Output() closePage = new EventEmitter<any>();
  @Output() swapFail = new EventEmitter();

  inquiryOptions = {
    path: '/assets/json/Inquerying.json',
  };

  addressFrom = '0xd34E3B073a484823058Ab76fc2304D5394beafE4';
  addressTo = '0xd34E3B073a484823058Ab76fc2304D5394beafE4';

  // setting modal
  setting$: Observable<any>;
  slipValue: number;
  deadline: number;

  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  isMainNet: boolean;
  neoWalletName: NeoWalletName;

  TOKENS: Token[] = []; // 所有的 tokens
  o3SwapFee = O3SWAP_FEE_PERCENTAGE;
  showInquiry: boolean;
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
    private o3NeoWalletApiService: O3NeoWalletApiService,
    private modal: NzModalService
  ) {
    this.swap$ = store.select('swap');
    this.setting$ = store.select('setting');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.isMainNet = state.isMainNet;
    });
    this.setting$.subscribe((state) => {
      this.slipValue = state.slipValue;
      this.deadline = state.deadline;
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

  showRoutingModal(): void {
    const modal = this.modal.create({
      nzContent: SwapExchangeComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        chooseSwapPathIndex: this.chooseSwapPathIndex,
        receiveSwapPathArray: this.receiveSwapPathArray,
      },
    });
    modal.afterClose.subscribe((index) => {
      if (index >= 0) {
        this.chooseSwapPathIndex = index;
        this.chooseSwapPath = this.receiveSwapPathArray[index];
        this.calculationPrice();
      }
    });
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
    // if (this.toToken.symbol === 'fWBTC') {
    // this.swapCrossChain();
    // return;
    // }
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
