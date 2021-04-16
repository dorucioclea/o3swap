import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  O3_AGGREGATOR_FEE,
  Token,
  NeoWalletName,
  AssetQueryResponse,
  AssetQueryResponseItem,
  SwapStateType,
  EthWalletName,
  USD_TOKENS,
  SOURCE_TOKEN_SYMBOL,
} from '@lib';
import {
  ApiService,
  CommonService,
  SwapService,
  NeolineWalletApiService,
  O3NeoWalletApiService,
  MetaMaskWalletApiService,
  O3EthWalletApiService,
} from '@core';
import { NzMessageService } from 'ng-zorro-antd/message';
import BigNumber from 'bignumber.js';
import { interval, Observable, timer, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApproveComponent, SwapExchangeComponent } from '@shared';
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
  SOURCE_TOKEN_SYMBOL = SOURCE_TOKEN_SYMBOL;
  @Input() fromToken: Token;
  @Input() toToken: Token;
  @Input() inputAmount: string; // 支付的 token 数量
  @Input() initData: any;
  @Output() closePage = new EventEmitter<any>();
  @Output() swapFail = new EventEmitter();

  rates = {};

  inquiryOptions = {
    path: '/assets/json/Inquerying.json',
  };

  // setting modal
  setting$: Observable<any>;
  settingUnScribe: Unsubscribable;
  slipValue: number;
  deadline: number;

  swap$: Observable<any>;
  swapUnScribe: Unsubscribable;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  TOKENS: Token[] = []; // 所有的 tokens
  O3_AGGREGATOR_FEE = O3_AGGREGATOR_FEE;
  showInquiry: boolean;
  inquiryInterval: Unsubscribable; // 询价定时器
  seconds = 30;
  inquiryTime = this.seconds;

  chooseSwapPath: AssetQueryResponseItem;
  chooseSwapPathIndex: number;
  receiveSwapPathArray: AssetQueryResponse;
  price: string; // swap 比
  lnversePrice: string; // swap 反比
  polyFee: string;
  showO3SwapFee = false;

  fromAddress: string;
  toAddress: string;

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    private swapService: SwapService,
    private neolineWalletApiService: NeolineWalletApiService,
    private o3NeoWalletApiService: O3NeoWalletApiService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private o3EthWalletApiService: O3EthWalletApiService,
    private modal: NzModalService
  ) {
    this.swap$ = store.select('swap');
    this.setting$ = store.select('setting');
  }

  ngOnInit(): void {
    this.getRates();
    this.init();
    this.checkO3SwapFee();
    this.getSwapPathFun();
    this.getNetworkFee();
    this.setInquiryInterval();
    this.swapUnScribe = this.swap$.subscribe((state) => {
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
    this.settingUnScribe = this.setting$.subscribe((state) => {
      this.slipValue = state.slipValue;
      this.deadline = state.deadline;
    });
  }

  ngOnDestroy(): void {
    if (this.inquiryInterval) {
      this.inquiryInterval.unsubscribe();
    }
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
    if (this.settingUnScribe) {
      this.settingUnScribe.unsubscribe();
    }
  }

  init(): void {
    if (this.initData) {
      this.chooseSwapPath = this.initData.chooseSwapPath;
      this.chooseSwapPathIndex = this.initData.chooseSwapPathIndex;
      this.receiveSwapPathArray = this.initData.receiveSwapPathArray;
      this.price = this.initData.price;
      this.lnversePrice = this.initData.lnversePrice;
      this.polyFee = this.initData.polyFee;
      this.showO3SwapFee = this.initData.showO3SwapFee;
      this.showInquiry = false;
    } else {
      this.showInquiry = true;
    }
  }

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      this.rates = res;
    });
  }

  setInquiryInterval(): void {
    this.inquiryTime = this.seconds;
    if (this.inquiryInterval) {
      this.inquiryInterval.unsubscribe();
    }
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
      polyFee: this.polyFee,
      showO3SwapFee: this.showO3SwapFee,
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

  async swap(): Promise<void> {
    if (this.checkWalletConnect() === false) {
      return;
    }
    if (!this.fromAddress || !this.toAddress) {
      this.getFromAndToAddress();
    }
    if (
      new BigNumber(this.fromToken.amount).comparedTo(
        new BigNumber(this.inputAmount)
      ) < 0
    ) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const showApprove = await this.checkShowApprove();
    if (showApprove === true) {
      this.inquiryInterval.unsubscribe();
      this.showApproveModal();
      return;
    }
    if (this.inquiryInterval) {
      this.inquiryInterval.unsubscribe();
    }
    if (this.fromToken.chain === 'NEO' && this.toToken.chain === 'NEO') {
      if (this.fromToken.symbol === 'NEO' && this.toToken.symbol === 'nNEO') {
        this.mintNNeo();
        return;
      }
      if (this.fromToken.symbol === 'nNEO' && this.toToken.symbol === 'NEO') {
        this.releaseNeo();
        return;
      }
      this.swapNeo();
      return;
    }
    if (this.fromToken.chain === 'NEO' && this.toToken.chain !== 'NEO') {
      return;
    }
    const fromUsd = USD_TOKENS.find(
      (item) => item.symbol === this.fromToken.symbol
    );
    const toUsd = USD_TOKENS.find(
      (item) => item.symbol === this.toToken.symbol
    );
    if (fromUsd && toUsd) {
      this.swapCrossChainEth();
      return;
    }
    if (this.fromToken.chain === this.toToken.chain) {
      if (
        (this.fromToken.symbol === 'ETH' && this.toToken.symbol === 'WETH') ||
        (this.fromToken.symbol === 'BNB' && this.toToken.symbol === 'WBNB')
      ) {
        return this.depositWEth();
      }
      if (
        (this.fromToken.symbol === 'WETH' && this.toToken.symbol === 'ETH') ||
        (this.fromToken.symbol === 'WBNB' && this.toToken.symbol === 'BNB')
      ) {
        return this.withdrawalWeth();
      }
    }
    if (this.fromToken.chain === 'ETH') {
      if (this.toToken.chain === 'ETH') {
        if (this.fromToken.symbol !== 'ETH' && this.toToken.symbol === 'ETH') {
          this.swapExactTokensForETH();
          return;
        }
        if (this.fromToken.symbol === 'ETH' && this.toToken.symbol !== 'ETH') {
          this.swapExactETHForTokens();
          return;
        }
        if (this.fromToken.symbol !== 'ETH' && this.toToken.symbol !== 'ETH') {
          this.swapExactTokensForTokens();
          return;
        }
      } else {
        if (toUsd) {
          if (this.fromToken.symbol === 'ETH') {
            this.swapExactETHForTokensCrossChain();
            return;
          }
          if (this.fromToken.symbol !== 'ETH') {
            this.swapExactTokensForTokensCrossChain();
            return;
          }
        }
      }
    }
    if (this.fromToken.chain === 'BSC') {
      if (this.toToken.chain === 'BSC') {
        if (this.fromToken.symbol !== 'BNB' && this.toToken.symbol === 'BNB') {
          this.swapExactTokensForETH();
          return;
        }
        if (this.fromToken.symbol === 'BNB' && this.toToken.symbol !== 'BNB') {
          this.swapExactETHForTokens();
          return;
        }
        if (this.fromToken.symbol !== 'BNB' && this.toToken.symbol !== 'BNB') {
          this.swapExactTokensForTokens();
          return;
        }
      } else {
        if (toUsd) {
          if (this.fromToken.symbol === 'BNB') {
            this.swapExactETHForTokensCrossChain();
            return;
          }
          if (this.fromToken.symbol !== 'BNB') {
            this.swapExactTokensForTokensCrossChain();
            return;
          }
        }
      }
    }
  }
  reGetSwapPath(): void {
    if (this.inquiryInterval) {
      this.inquiryInterval.unsubscribe();
    }
    this.getSwapPathFun();
    this.getNetworkFee();
    this.setInquiryInterval();
  }
  //#region 合约调用
  depositWEth(): void {
    this.metaMaskWalletApiService
      .depositWEth(
        this.fromToken,
        this.toToken,
        this.inputAmount,
        this.fromAddress
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }

  withdrawalWeth(): void {
    this.metaMaskWalletApiService
      .withdrawalWeth(
        this.fromToken,
        this.toToken,
        this.inputAmount,
        this.fromAddress
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
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

  swapExactTokensForETH(): void {
    const swapApi = this.getEthDapiService();
    this.metaMaskWalletApiService
      .swapExactTokensForETH(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        this.deadline
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }

  swapExactETHForTokens(): void {
    const swapApi = this.getEthDapiService();
    this.metaMaskWalletApiService
      .swapExactETHForTokens(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        this.deadline
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }

  swapExactTokensForTokens(): void {
    const swapApi = this.getEthDapiService();
    this.metaMaskWalletApiService
      .swapExactTokensForTokens(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        this.deadline
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }

  swapExactETHForTokensCrossChain(): void {
    this.metaMaskWalletApiService
      .swapExactETHForTokensCrossChain(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        this.slipValue,
        this.polyFee,
        this.deadline
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }
  swapExactTokensForTokensCrossChain(): void {
    this.metaMaskWalletApiService
      .swapExactTokensForTokensCrossChain(
        this.fromToken,
        this.toToken,
        this.chooseSwapPath,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        this.slipValue,
        this.polyFee,
        this.deadline
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }

  swapCrossChainEth(): void {
    const swapApi = this.getEthDapiService();
    this.metaMaskWalletApiService
      .swapCrossChain(
        this.fromToken,
        this.toToken,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        this.chooseSwapPath.amount[this.chooseSwapPath.amount.length - 1],
        this.slipValue,
        this.polyFee,
        'swap'
      )
      .then((res) => {
        if (res) {
          this.closePage.emit();
        }
      });
  }
  //#endregion

  //#region
  showApproveModal(): void {
    let walletName: string;
    switch (this.fromToken.chain) {
      case 'ETH':
        walletName = this.ethWalletName;
        break;
      case 'BSC':
        walletName = this.bscWalletName;
        break;
      case 'HECO':
        walletName = this.hecoWalletName;
        break;
    }
    this.modal.create({
      nzContent: ApproveComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzMaskClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        fromToken: this.fromToken,
        fromAddress: this.fromAddress,
        aggregator: this.chooseSwapPath.aggregator,
        walletName,
      },
    });
  }
  getEthDapiService(): any {
    switch (this.fromToken.chain) {
      case 'ETH':
        return this.ethWalletName === 'MetaMask'
          ? this.metaMaskWalletApiService
          : this.o3EthWalletApiService;
      case 'BSC':
        return this.bscWalletName === 'MetaMask'
          ? this.metaMaskWalletApiService
          : this.o3EthWalletApiService;
      case 'HECO':
        return this.hecoWalletName === 'MetaMask'
          ? this.metaMaskWalletApiService
          : this.o3EthWalletApiService;
    }
  }
  async checkShowApprove(): Promise<boolean> {
    console.log('check show approve');
    if (!this.chooseSwapPath || !this.chooseSwapPath.aggregator) {
      console.log('check show approve return');
      return false;
    }
    if (this.fromToken.chain === 'NEO' || this.toToken.chain === 'NEO') {
      console.log('check show approve return');
      return false;
    }
    const swapApi = this.getEthDapiService();
    const balance = await this.metaMaskWalletApiService.getAllowance(
      this.fromToken,
      this.fromAddress,
      this.chooseSwapPath.aggregator
    );
    if (
      new BigNumber(balance).comparedTo(new BigNumber(this.inputAmount)) >= 0
    ) {
      return false;
    } else {
      return true;
    }
  }
  getSwapPathFun(): void {
    this.chooseSwapPath = null;
    this.apiService
      .getSwapPath(this.fromToken, this.toToken, this.inputAmount)
      .then((res) => {
        this.showInquiry = false;
        if (!res || res.length === 0) {
          this.swapFail.emit();
        }
        if (res && res.length > 0) {
          this.commonService.log(res);
          this.receiveSwapPathArray = res;
          this.handleReceiveSwapPathFiat();
          this.calculationPrice();
        }
      });
  }
  handleReceiveSwapPathFiat(): void {
    this.receiveSwapPathArray.forEach((item) => {
      item.receiveAmount = new BigNumber(item.receiveAmount)
        .shiftedBy(-this.toToken.decimals)
        .toFixed();
      // 计算法币价格
      const price = this.commonService.getAssetRate(this.rates, this.toToken);
      if (price) {
        item.fiat = new BigNumber(item.receiveAmount)
          .multipliedBy(new BigNumber(price))
          .dp(2)
          .toFixed();
      }
    });
    this.chooseSwapPathIndex = 0;
    this.chooseSwapPath = this.receiveSwapPathArray[0];
  }
  async getNetworkFee(): Promise<void> {
    this.polyFee = '';
    if (this.fromToken.chain !== this.toToken.chain) {
      this.polyFee = await this.apiService.getFromEthPolyFee(
        this.fromToken,
        this.toToken
      );
    }
  }
  checkO3SwapFee(): void {
    if (this.fromToken.chain === 'NEO') {
      this.showO3SwapFee = true;
    }
    const fromUsd = USD_TOKENS.find(
      (item) => item.symbol === this.fromToken.symbol
    );
    const toUsd = USD_TOKENS.find(
      (item) => item.symbol === this.toToken.symbol
    );
    if (fromUsd && toUsd) {
      this.showO3SwapFee = false;
    } else {
      this.showO3SwapFee = true;
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
    switch (this.fromToken.chain) {
      case 'NEO':
        this.fromAddress = this.neoAccountAddress;
        break;
      case 'ETH':
        this.fromAddress = this.ethAccountAddress;
        break;
      case 'BSC':
        this.fromAddress = this.bscAccountAddress;
        break;
      case 'HECO':
        this.fromAddress = this.hecoAccountAddress;
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
