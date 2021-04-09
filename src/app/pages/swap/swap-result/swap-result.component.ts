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
  EthWalletName,
} from '@lib';
import {
  ApiService,
  CommonService,
  SwapService,
  NeolineWalletApiService,
  O3NeoWalletApiService,
  MetaMaskWalletApiService,
} from '@core';
import { NzMessageService } from 'ng-zorro-antd/message';
import BigNumber from 'bignumber.js';
import {
  interval,
  Observable,
  Subscription,
  timer,
  Unsubscribable,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SwapExchangeComponent } from '@shared';
import { take } from 'rxjs/operators';

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

  // setting modal
  setting$: Observable<any>;
  slipValue: number;
  deadline: number;

  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  TOKENS: Token[] = []; // 所有的 tokens
  o3SwapFee = O3SWAP_FEE_PERCENTAGE;
  showInquiry: boolean;
  inquiryInterval: Unsubscribable; // 询价定时器
  seconds = 30;
  inquiryTime = this.seconds;

  chooseSwapPath: AssetQueryResponseItem;
  chooseSwapPathIndex: number;
  receiveSwapPathArray: AssetQueryResponse;
  price: string; // swap 比
  lnversePrice: string; // swap 反比
  netWorkFee;

  fromAddress: string;
  toAddress: string;
  showApprove = false;
  hasApprove = false;
  isApproveLoading = false;

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private neolineWalletApiService: NeolineWalletApiService,
    private o3NeoWalletApiService: O3NeoWalletApiService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private modal: NzModalService
  ) {
    this.swap$ = store.select('swap');
    this.setting$ = store.select('setting');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.getFromAndToAddress();
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
      this.netWorkFee = this.initData.netWorkFee;
      this.showInquiry = false;
    } else {
      this.showInquiry = true;
    }
    this.getSwapPathFun();
    this.getNetworkFee();
    this.setInquiryInterval();
  }

  ngOnDestroy(): void {
    if (this.inquiryInterval !== null && this.inquiryInterval !== undefined) {
      this.inquiryInterval.unsubscribe();
    }
  }

  setInquiryInterval(): void {
    this.inquiryTime = this.seconds;
    this.inquiryInterval = interval(1000)
      .pipe(take(this.seconds))
      .subscribe((time) => {
        time++;
        this.inquiryTime = this.seconds - time;
        if (time === this.seconds) {
          this.getSwapPathFun();
          this.getNetworkFee();
          timer(1000).subscribe(() => {
            this.setInquiryInterval();
          });
        }
      });
  }

  backToHomePage(): void {
    const initData = {
      chooseSwapPath: this.chooseSwapPath,
      chooseSwapPathIndex: this.chooseSwapPathIndex,
      receiveSwapPathArray: this.receiveSwapPathArray,
      price: this.price,
      lnversePrice: this.lnversePrice,
      netWorkFee: this.netWorkFee,
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

  approve(): void {
    this.inquiryInterval.unsubscribe();
    this.isApproveLoading = true;
    this.metaMaskWalletApiService
      .approve(this.fromToken, this.fromAddress)
      .then((res) => {
        this.isApproveLoading = false;
        if (res !== undefined) {
          this.hasApprove = true;
        }
      });
  }

  swap(): void {
    if (this.checkWalletConnect() === false) {
      return;
    }
    this.inquiryInterval.unsubscribe();
    if (this.fromToken.symbol === 'NEO' && this.toToken.symbol === 'nNEO') {
      this.mintNNeo();
      return;
    }
    if (this.fromToken.symbol === 'nNEO' && this.toToken.symbol === 'NEO') {
      this.releaseNeo();
      return;
    }
    if (this.fromToken.chain === 'NEO' && this.toToken.chain === 'NEO') {
      this.swapNeo();
      return;
    }
    if (this.fromToken.chain === 'NEO' && this.toToken.chain === 'ETH') {
      this.swapNeoCrossChainEth();
      return;
    }
    if (this.fromToken.chain !== 'NEO' && this.toToken.chain !== 'NEO') {
      this.swapCrossChainEth();
      return;
    }
  }

  //#region 合约调用
  reGetSwapPath(): void {
    this.inquiryInterval.unsubscribe();
    this.getSwapPathFun();
    this.getNetworkFee();
    this.setInquiryInterval();
  }

  swapNeoCrossChainEth(): void {
    const swapApi =
      this.neoWalletName === 'NeoLine'
        ? this.neolineWalletApiService
        : this.o3NeoWalletApiService;
    swapApi
      .swapCrossChain(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.slipValue,
        this.deadline,
        this.ethAccountAddress
      )
      .then((res) => {
        this.commonService.log(res);
        if (res) {
          this.closePage.emit();
        }
      });
  }

  swapNeo(): void {
    const swapApi =
      this.neoWalletName === 'NeoLine'
        ? this.neolineWalletApiService
        : this.o3NeoWalletApiService;
    swapApi
      .swap(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.slipValue,
        this.deadline
      )
      .then((res) => {
        this.commonService.log(res);
        if (res) {
          this.closePage.emit();
        }
      });
  }

  mintNNeo(): void {
    const swapApi =
      this.neoWalletName === 'NeoLine'
        ? this.neolineWalletApiService
        : this.o3NeoWalletApiService;
    swapApi
      .mintNNeo(this.fromToken, this.toToken, this.inputAmount)
      .then((res) => {
        this.commonService.log(res);
        if (res) {
          this.closePage.emit();
        }
      });
  }

  releaseNeo(): void {
    const swapApi =
      this.neoWalletName === 'NeoLine'
        ? this.neolineWalletApiService
        : this.o3NeoWalletApiService;
    swapApi
      .releaseNeo(
        this.fromToken,
        this.toToken,
        this.inputAmount,
        this.neoAccountAddress
      )
      .then((res) => {
        this.commonService.log(res);
        if (res) {
          this.closePage.emit();
        }
      });
  }

  swapCrossChainEth(): void {
    this.metaMaskWalletApiService
      .swapCrossChain(
        this.fromToken,
        this.toToken,
        this.inputAmount,
        this.fromAddress,
        this.toAddress
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }
  //#endregion

  //#region
  checkShowApprove(): void {
    console.log(this.fromAddress)
    console.log(this.toAddress)
    if (!this.fromAddress || !this.toAddress) {
      this.showApprove = false;
      console.log('000000')
      return;
    }
    if (
      this.fromToken.chain !== 'NEO' &&
      this.toToken.chain !== 'NEO' &&
      this.fromToken.chain !== this.toToken.chain
    ) {
      console.log('-----------')
      this.metaMaskWalletApiService
        .getAllowance(this.fromToken, this.fromAddress)
        .then((balance) => {
          if (
            new BigNumber(balance).comparedTo(
              new BigNumber(this.inputAmount)
            ) >= 0
          ) {
            this.showApprove = false;
          } else {
            this.showApprove = true;
          }
        });
    } else {
      this.showApprove = false;
    }
  }
  getSwapPathFun(): void {
    this.chooseSwapPath = null;
    this.apiService
      .getSwapPath(this.fromToken, this.toToken, this.inputAmount)
      .subscribe((res) => {
        this.showInquiry = false;
        if (res.length === 0) {
          this.swapFail.emit();
        }
        if (res.length > 0) {
          this.commonService.log(res);
          this.receiveSwapPathArray = res;
          this.handleReceiveSwapPathFiat();
        }
      });
  }
  handleReceiveSwapPathFiat(): void {
    this.receiveSwapPathArray.forEach((item) => {
      item.receiveAmount = new BigNumber(item.receiveAmount)
        .shiftedBy(-this.toToken.decimals)
        .toFixed();
      // 计算法币价格
      const price = this.rates[this.toToken.rateName];
      if (price) {
        item.fiat = new BigNumber(item.receiveAmount)
          .multipliedBy(new BigNumber(price))
          .dp(2)
          .toFixed();
      }
    });
    this.chooseSwapPathIndex = 0;
    this.chooseSwapPath = this.receiveSwapPathArray[0];
    this.calculationPrice();
  }
  async getNetworkFee(): Promise<void> {
    this.netWorkFee = '';
    if (this.fromToken.chain === 'NEO') {
      this.netWorkFee = new BigNumber(this.inputAmount)
        .times(this.o3SwapFee)
        .dp(this.fromToken.decimals)
        .toFixed();
    } else {
      const polyFee = await this.apiService.getFromEthPolyFee(
        this.fromToken,
        this.toToken
      );
      const poolFeeRate = await this.apiService.getFromEthPoolFee();
      this.netWorkFee = new BigNumber(this.inputAmount)
        .times(new BigNumber(poolFeeRate))
        .plus(new BigNumber(polyFee))
        .dp(this.fromToken.decimals)
        .toFixed();
    }
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
  getFromAndToAddress(): void {
    let tempFromAddress;
    switch (this.fromToken.chain) {
      case 'NEO':
        tempFromAddress = this.neoAccountAddress;
        break;
      case 'ETH':
        tempFromAddress = this.ethAccountAddress;
        break;
      case 'BSC':
        tempFromAddress = this.bscAccountAddress;
        break;
      case 'HECO':
        tempFromAddress = this.hecoAccountAddress;
        break;
    }
    switch (this.toToken.chain) {
      case 'NEO':
        this.toAddress = this.neoAccountAddress;
        break;
      case 'ETH':
        this.toAddress = this.ethAccountAddress;
        break;
      case 'BSC':
        this.toAddress = this.bscAccountAddress;
        break;
      case 'HECO':
        this.toAddress = this.hecoAccountAddress;
        break;
    }
    if (tempFromAddress !== this.fromAddress) {
      this.fromAddress = tempFromAddress;
      this.checkShowApprove();
    }
    this.fromAddress = tempFromAddress;
  }
  checkWalletConnect(): boolean {
    if (
      (this.fromToken.chain === 'NEO' || this.toToken.chain === 'NEO') &&
      !this.neoAccountAddress
    ) {
      this.nzMessage.error('Please connect the NEO wallet first');
      return false;
    }
    if (
      (this.fromToken.chain === 'ETH' || this.toToken.chain === 'ETH') &&
      !this.ethAccountAddress
    ) {
      this.nzMessage.error('Please connect the ETH wallet first');
      return false;
    }
    if (
      (this.fromToken.chain === 'BSC' || this.toToken.chain === 'BSC') &&
      !this.bscAccountAddress
    ) {
      this.nzMessage.error('Please connect the BSC wallet first');
      return false;
    }
    if (
      (this.fromToken.chain === 'HECO' || this.toToken.chain === 'HECO') &&
      !this.hecoAccountAddress
    ) {
      this.nzMessage.error('Please connect the HECO wallet first');
      return false;
    }
    return true;
  }
  //#endregion
}
