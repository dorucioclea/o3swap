import { Component, OnInit } from '@angular/core';
import { ApiService, MetaMaskWalletApiService } from '@core';
import { EthWalletName, NeoWalletName, SwapStateType, Token } from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SwapTokenComponent } from '@shared';
import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
}
@Component({
  selector: 'app-bridge',
  templateUrl: './bridge.component.html',
  styleUrls: ['./bridge.component.scss'],
})
export class BridgeComponent implements OnInit {
  fromToken: Token;
  toToken: Token;

  inputAmount: string;
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;

  receiveAmount: string;
  receiveAmountFiat: string; // 支付的 token 美元价值
  rates = {};

  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  fromAddress: string;
  toAddress: string;
  showApprove = false;
  hasApprove = false;
  isApproveLoading = false;

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private modal: NzModalService,
    private nzMessage: NzMessageService,
    private metaMaskWalletApiService: MetaMaskWalletApiService
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.getRates();
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
  }

  showTokens(type: 'from' | 'to'): void {
    const modal = this.modal.create({
      nzContent: SwapTokenComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        isFrom: type === 'from' ? true : false,
        fromToken: this.fromToken,
        toToken: this.toToken,
      },
    });
    modal.afterClose.subscribe((res) => {
      if (res) {
        if (type === 'from') {
          this.fromToken = res;
          console.log(res);
          this.checkInputAmountDecimal();
          this.calcutionInputAmountFiat();
        } else {
          this.toToken = res;
        }
        this.calcutionReceiveAmount();
      }
    });
  }

  allInputAmount(): void {
    this.inputAmountError = '';
    this.inputAmount = (this.fromToken && this.fromToken.amount) || '0';
    this.calcutionInputAmountFiat();
    this.calcutionReceiveAmount();
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
    this.checkInputAmountDecimal();
    this.calcutionInputAmountFiat();
    this.calcutionReceiveAmount();
  }

  checkCanInquiry(): boolean {
    if (!this.fromToken || !this.toToken || !this.inputAmount) {
      return false;
    }
    if (new BigNumber(this.inputAmount).comparedTo(0) <= 0) {
      return false;
    }
    if (this.checkInputAmountDecimal() === false) {
      return false;
    }
    return true;
  }

  swap(): void {
    console.log('++++++++')
    if (this.checkWalletConnect() === false) {
      return;
    }
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
        }
      });
  }

  //#region
  checkWalletConnect(): boolean {
    console.log(this.fromToken)
    console.log(this.toToken);
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
  getFromAndToAddress(): void {
    let tempFromAddress;
    switch (this.fromToken?.chain) {
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
    switch (this.toToken?.chain) {
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
  checkShowApprove(): void {
    if (!this.fromAddress || !this.toAddress) {
      this.showApprove = false;
      return;
    }
    if (
      this.fromToken.chain !== 'NEO' &&
      this.toToken.chain !== 'NEO' &&
      this.fromToken.chain !== this.toToken.chain
    ) {
      console.log('-----------');
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
  checkInputAmountDecimal(): boolean {
    const decimalPart = this.inputAmount && this.inputAmount.split('.')[1];
    if (
      this.fromToken &&
      decimalPart &&
      decimalPart.length > this.fromToken.decimals
    ) {
      this.inputAmountError = `You've exceeded the decimal limit.`;
      return false;
    }
    this.inputAmountError = '';
    return true;
  }

  calcutionInputAmountFiat(): void {
    if (!this.fromToken) {
      return;
    }
    const price = this.rates[this.fromToken.rateName];
    if (this.inputAmount && price) {
      this.inputAmountFiat = new BigNumber(this.inputAmount)
        .multipliedBy(new BigNumber(price))
        .dp(2)
        .toFixed();
    } else {
      this.inputAmountFiat = '';
    }
  }

  calcutionReceiveAmountFiat(): void {
    if (!this.toToken) {
      return;
    }
    const price = this.rates[this.toToken.rateName];
    if (this.receiveAmount && price) {
      this.receiveAmountFiat = new BigNumber(this.receiveAmount)
        .multipliedBy(new BigNumber(price))
        .dp(2)
        .toFixed();
    } else {
      this.receiveAmountFiat = '';
    }
  }

  async calcutionReceiveAmount(): Promise<void> {
    if (!this.fromToken || !this.toToken || !this.inputAmount) {
      this.receiveAmount = '';
      return;
    }
    if (new BigNumber(this.inputAmount).comparedTo(0) <= 0) {
      this.receiveAmount = '';
      return;
    }
    this.receiveAmount = await this.apiService.getBridgeAmountOut(
      this.fromToken,
      this.toToken,
      this.inputAmount
    );
    this.calcutionReceiveAmountFiat();
  }

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      console.log(res);
      this.rates = res;
    });
  }
}
