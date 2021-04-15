import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  ApiService,
  MetaMaskWalletApiService,
  O3EthWalletApiService,
  CommonService,
} from '@core';
import {
  BRIDGE_SLIPVALUE,
  EthWalletName,
  SwapStateType,
  Token,
  USD_TOKENS,
} from '@lib';
import { Store } from '@ngrx/store';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BridgeTokenComponent } from '@shared';
import BigNumber from 'bignumber.js';
import { interval, Observable, Unsubscribable } from 'rxjs';

interface State {
  swap: SwapStateType;
}
@Component({
  selector: 'app-bridge',
  templateUrl: './bridge.component.html',
  styleUrls: ['./bridge.component.scss'],
})
export class BridgeComponent implements OnInit {
  BRIDGE_SLIPVALUE = BRIDGE_SLIPVALUE;
  fromToken: Token;
  toToken: Token;

  inputAmount: string;
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;

  receiveAmount: string;
  receiveAmountFiat: string; // 支付的 token 美元价值
  rates = {};

  swap$: Observable<any>;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  fromAddress: string;
  toAddress: string;
  showApprove = false;
  hasApprove = false;
  isApproveLoading = false;
  approveInterval: Unsubscribable;
  bridgeRate: string;

  constructor(
    public store: Store<State>,
    private apiService: ApiService,
    private modal: NzModalService,
    private nzMessage: NzMessageService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private o3EthWalletApiService: O3EthWalletApiService,
    private commonService: CommonService
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.fromToken = JSON.parse(JSON.stringify(USD_TOKENS[0]));
    this.getRates();
    this.swap$.subscribe((state) => {
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.getFromAndToAddress();
      this.handleAccountBalance(
        state.ethBalances,
        state.bscBalances,
        state.hecoBalances
      );
    });
  }

  showTokens(type: 'from' | 'to'): void {
    const modal = this.modal.create({
      nzContent: BridgeTokenComponent,
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
          this.checkInputAmountDecimal();
          this.calcutionInputAmountFiat();
        } else {
          this.toToken = res;
        }
        this.checkShowApprove();
        this.calcutionReceiveAmount();
      }
    });
  }

  exchangeToken(): void {
    if (this.toToken || this.fromToken) {
      const temp = this.fromToken;
      this.fromToken = this.toToken;
      this.toToken = temp;
      this.checkInputAmountDecimal();
      this.calcutionInputAmountFiat();
      this.calcutionReceiveAmount();
      this.checkShowApprove();
    }
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

  async swap(): Promise<void> {
    this.getFromAndToAddress();
    if (this.checkWalletConnect() === false) {
      return;
    }
    const polyFee = await this.apiService.getFromEthPolyFee(
      this.fromToken,
      this.toToken
    );
    const bigNumberReceive = new BigNumber(this.receiveAmount)
      .shiftedBy(this.toToken.decimals)
      .dp(0)
      .toFixed();
    this.metaMaskWalletApiService
      .swapCrossChain(
        this.fromToken,
        this.toToken,
        this.inputAmount,
        this.fromAddress,
        this.toAddress,
        bigNumberReceive,
        BRIDGE_SLIPVALUE,
        polyFee,
        'bridge'
      )
      .then((res) => {
        if (res) {
          this.resetSwapData();
        }
      });
  }

  approve(): void {
    if (this.approveInterval) {
      this.approveInterval.unsubscribe();
    }
    this.isApproveLoading = true;
    const swapApi = this.getEthDapiService();
    swapApi.approve(this.fromToken, this.fromAddress).then((hash) => {
      if (hash) {
        this.approveInterval = interval(5000).subscribe(async () => {
          const receipt = await this.metaMaskWalletApiService.getReceipt(hash);
          console.log(receipt);
          if (receipt !== null) {
            this.approveInterval.unsubscribe();
            this.isApproveLoading = false;
            if (receipt === true) {
              this.hasApprove = true;
            }
          }
        });
      } else {
        this.isApproveLoading = false;
      }
    });
  }

  //#region
  resetSwapData(): void {
    this.fromToken = JSON.parse(JSON.stringify(USD_TOKENS[0]));
    this.toToken = null;
    this.inputAmount = null;
    this.inputAmountFiat = null;
    this.receiveAmount = null;
    this.receiveAmountFiat = null;
    this.fromAddress = null;
    this.toAddress = null;
    this.showApprove = false;
    this.hasApprove = false;
    this.bridgeRate = null;
  }
  handleAccountBalance(ethBalances, bscBalances, hecoBalances): void {
    if (!this.fromToken) {
      return;
    }
    this.fromToken.amount = '0';
    let balances;
    switch (this.fromToken.chain) {
      case 'ETH':
        balances = JSON.parse(JSON.stringify(ethBalances)) || {};
        break;
      case 'BSC':
        balances = JSON.parse(JSON.stringify(bscBalances)) || {};
        break;
      case 'HECO':
        balances = JSON.parse(JSON.stringify(hecoBalances)) || {};
        break;
    }
    if (balances[this.fromToken.assetID]) {
      this.fromToken.amount = balances[this.fromToken.assetID].amount;
    }
    this.changeDetectorRef.detectChanges();
  }
  checkWalletConnect(): boolean {
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
    let tempToAddress;
    switch (this.toToken?.chain) {
      case 'ETH':
        tempToAddress = this.ethAccountAddress;
        break;
      case 'BSC':
        tempToAddress = this.bscAccountAddress;
        break;
      case 'HECO':
        tempToAddress = this.hecoAccountAddress;
        break;
    }
    if (
      tempFromAddress !== this.fromAddress ||
      tempToAddress !== this.toAddress
    ) {
      this.fromAddress = tempFromAddress;
      this.toAddress = tempToAddress;
    } else {
      this.fromAddress = tempFromAddress;
      this.toAddress = tempToAddress;
    }
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
  checkShowApprove(): void {
    this.getFromAndToAddress();
    if (!this.fromAddress || !this.toAddress) {
      this.showApprove = false;
      return;
    }
    const swapApi = this.getEthDapiService();
    swapApi.getAllowance(this.fromToken, this.fromAddress).then((balance) => {
      if (
        new BigNumber(balance).comparedTo(new BigNumber(this.inputAmount)) >= 0
      ) {
        this.showApprove = false;
      } else {
        this.showApprove = true;
      }
    });
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
      this.inputAmountFiat = '';
      return;
    }
    const price = this.commonService.getAssetRate(this.rates, this.fromToken);
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
      this.receiveAmountFiat = '';
      return;
    }
    const price = this.commonService.getAssetRate(this.rates, this.fromToken);
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
    this.getBridgeRate();
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
    this.getBridgeRate();
  }
  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      this.rates = res;
    });
  }
  getBridgeRate(): void {
    if (this.inputAmount && this.receiveAmount) {
      this.bridgeRate = new BigNumber(this.receiveAmount)
        .dividedBy(new BigNumber(this.inputAmount))
        .dp(8)
        .toFixed();
    } else {
      this.bridgeRate = '';
    }
  }
  //#endregion
}
