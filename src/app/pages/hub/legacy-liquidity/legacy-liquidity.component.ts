import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  ApiService,
  CommonService,
  MetaMaskWalletApiService,
  O3EthWalletApiService,
} from '@core';
import { Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';
import { SwapStateType } from 'src/app/_lib/swap';
import {
  SWAP_CONTRACT_CHAIN_ID,
  METAMASK_CHAIN,
  METAMASK_CHAIN_ID,
  BRIDGE_SLIPVALUE,
  Token,
  USD_TOKENS,
  LP_TOKENS,
  ETH_PUSDT_ASSET,
  ConnectChainType,
  EthWalletName,
} from '@lib';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApproveComponent } from '@shared';

interface State {
  swap: SwapStateType;
  rates: any;
}
@Component({
  selector: 'app-legacy-liquidity',
  templateUrl: './legacy-liquidity.component.html',
  styleUrls: ['../liquidity/liquidity.component.scss', './legacy-liquidity.component.scss'],
})
export class LegacyLiquidityComponent implements OnInit, OnDestroy {
  BRIDGE_SLIPVALUE = BRIDGE_SLIPVALUE;
  swapProgress = 20;
  addLiquidityTokens: Token[] = JSON.parse(JSON.stringify(USD_TOKENS));
  USDTToken: Token = this.addLiquidityTokens.find(
    (item) => item.symbol.indexOf('USDT') >= 0
  );
  BUSDToken: Token = this.addLiquidityTokens.find(
    (item) => item.symbol.indexOf('BUSD') >= 0
  );
  HUSDToken: Token = this.addLiquidityTokens.find(
    (item) => item.symbol.indexOf('HUSD') >= 0
  );

  LPToken: Token;
  LPTokens: Token[];
  removeLiquidityInputAmount = [];
  payAmount: string[] = [];
  currentAddress: string;
  currentChain: string;
  showConnectWallet = false;
  connectChainType: ConnectChainType;

  swap$: Observable<any>;
  swapUnScribe: Unsubscribable;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;
  metamaskNetworkId: number;
  tokenBalance = { ETH: {}, NEO: {}, BSC: {}, HECO: {} }; // 账户的 tokens

  ratesUnScribe: Unsubscribable;
  rates$: Observable<any>;
  rates = {};

  pusdtBalance = {
    ALL: '',
    ETH: { value: '', percentage: '0' },
    BSC: { value: '', percentage: '0' },
    HECO: { value: '', percentage: '0' },
  };

  constructor(
    private apiService: ApiService,
    private commonService: CommonService,
    public store: Store<State>,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private o3EthWalletApiService: O3EthWalletApiService,
    private nzMessage: NzMessageService,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalService
  ) {
    this.swap$ = store.select('swap');
    this.rates$ = store.select('rates');
    this.addLiquidityTokens.forEach(() => {
      this.removeLiquidityInputAmount.push('');
      this.payAmount.push('--');
    });
  }

  ngOnInit(): void {
    this.ratesUnScribe = this.rates$.subscribe((state) => {
      this.rates = state.rates;
    });
    this.getPusdtBalance();
    this.LPTokens = JSON.parse(JSON.stringify(LP_TOKENS));
    this.addLiquidityTokens.forEach((item) => {
      if (this.metaMaskWalletApiService !== METAMASK_CHAIN_ID[item.chain]) {
        item.amount = '--';
      }
    });
    this.swapUnScribe = this.swap$.subscribe((state: SwapStateType) => {
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.getCurrentChain(state.metamaskNetworkId);
      this.handleAccountBalance(state);
      this.handleCurrentAddress();
      this.getLPBalance();
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.swapUnScribe) {
      this.swapUnScribe.unsubscribe();
    }
    if (this.ratesUnScribe) {
      this.ratesUnScribe.unsubscribe();
    }
  }

  async getPusdtBalance(): Promise<void> {
    this.pusdtBalance.ETH.value = await this.apiService.getPUsdtBalance(
      ETH_PUSDT_ASSET.ETH.assetID,
      ETH_PUSDT_ASSET.ETH.decimals
    );
    this.pusdtBalance.BSC.value = await this.apiService.getPUsdtBalance(
      ETH_PUSDT_ASSET.BSC.assetID,
      ETH_PUSDT_ASSET.BSC.decimals
    );
    this.pusdtBalance.HECO.value = await this.apiService.getPUsdtBalance(
      ETH_PUSDT_ASSET.HECO.assetID,
      ETH_PUSDT_ASSET.HECO.decimals
    );
    this.pusdtBalance.ALL = new BigNumber(this.pusdtBalance.ETH.value)
      .plus(new BigNumber(this.pusdtBalance.BSC.value))
      .plus(new BigNumber(this.pusdtBalance.HECO.value))
      .toFixed();
    this.pusdtBalance.ETH.percentage = new BigNumber(
      this.pusdtBalance.ETH.value
    )
      .dividedBy(new BigNumber(this.pusdtBalance.ALL))
      .times(100)
      .dp(3)
      .toFixed();
    this.pusdtBalance.BSC.percentage = new BigNumber(
      this.pusdtBalance.BSC.value
    )
      .dividedBy(new BigNumber(this.pusdtBalance.ALL))
      .times(100)
      .dp(3)
      .toFixed();
    this.pusdtBalance.HECO.percentage = new BigNumber(
      this.pusdtBalance.HECO.value
    )
      .dividedBy(new BigNumber(this.pusdtBalance.ALL))
      .times(100)
      .dp(3)
      .toFixed();
  }

  async changeOutAmount(token: Token, index: number): Promise<void> {
    const inputAmount = new BigNumber(this.removeLiquidityInputAmount[index]);
    if (!inputAmount.isNaN() && inputAmount.comparedTo(0) > 0) {
      if (inputAmount.comparedTo(50) === 1) {
        this.nzMessage.error(`You've exceeded the maximum limit`);
        return;
      }
      this.payAmount[index] = await this.apiService.getPoolInGivenSingleOut(
        token,
        this.removeLiquidityInputAmount[index]
      );
    } else {
      this.payAmount[index] = '--';
    }
  }

  async maxRemoveLiquidityInput(index: number): Promise<void> {
    if (
      !new BigNumber(this.LPToken.amount).isNaN() &&
      !new BigNumber(this.LPToken.amount).isZero()
    ) {
      this.payAmount[index] = this.LPToken.amount;
      this.removeLiquidityInputAmount[
        index
      ] = await this.apiService.getSingleOutGivenPoolIn(
        this.addLiquidityTokens[index],
        this.payAmount[index]
      );
    }
  }

  async withdrawal(token: Token, index: number): Promise<void> {
    if (this.checkWalletConnect(token) === false) {
      return;
    }
    const swapApi = this.getEthDapiService();
    if (swapApi.checkNetwork(token) === false) {
      return;
    }
    const lpBalance = new BigNumber(this.LPToken.amount);
    const lpPayAmount = new BigNumber(this.payAmount[index]);
    if (lpPayAmount.isNaN() || lpPayAmount.comparedTo(0) <= 0) {
      this.nzMessage.error('Wrong input');
      return;
    }
    if (lpBalance.comparedTo(lpPayAmount) < 0) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const allowance = await swapApi.getAllowance(
      this.LPToken,
      this.currentAddress
    );
    if (new BigNumber(allowance).comparedTo(lpPayAmount) < 0) {
      // await swapApi.approve(this.LPToken, this.currentAddress);
      this.showApproveModal(this.LPToken);
      return;
    }
    const amountOut = new BigNumber(this.removeLiquidityInputAmount[index])
      .shiftedBy(token.decimals)
      .dp(0)
      .toFixed();
    const fee = await this.apiService.getFromEthPolyFee(token, token);
    swapApi
      .removeLiquidity(
        this.LPToken,
        lpPayAmount.toFixed(),
        this.currentAddress,
        SWAP_CONTRACT_CHAIN_ID[token.chain],
        amountOut,
        fee
      )
      .then((res) => {
        this.commonService.log(res);
      })
      .catch((error) => {
        this.nzMessage.error(error);
      });
  }

  //#region
  showApproveModal(token: Token): void {
    let walletName: string;
    switch (token.chain) {
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
        fromToken: token,
        fromAddress: this.currentAddress,
        walletName,
      },
    });
  }
  checkWalletConnect(token: Token): boolean {
    if (token.chain === 'ETH' && !this.ethAccountAddress) {
      this.nzMessage.error('Please connect the ETH wallet first');
      this.showConnectWallet = true;
      this.connectChainType = 'ETH';
      return false;
    }
    if (token.chain === 'BSC' && !this.bscAccountAddress) {
      this.nzMessage.error('Please connect the BSC wallet first');
      this.showConnectWallet = true;
      this.connectChainType = 'BSC';
      return false;
    }
    if (token.chain === 'HECO' && !this.hecoAccountAddress) {
      this.nzMessage.error('Please connect the HECO wallet first');
      this.showConnectWallet = true;
      this.connectChainType = 'HECO';
      return false;
    }
    return true;
  }
  getCurrentChain(metamaskNetworkId): void {
    if (this.currentChain !== METAMASK_CHAIN[metamaskNetworkId]) {
      this.currentChain = METAMASK_CHAIN[metamaskNetworkId];
      const token = this.LPTokens.find(
        (item) => item.chain === this.currentChain
      );
      this.LPToken = JSON.parse(JSON.stringify(token));
    }
  }
  private getLPBalance(): void {
    if (!this.LPToken) {
      return;
    }
    const swapApi = this.getEthDapiService();
    swapApi.getBalancByHash(this.LPToken).then((res) => {
      // this.LPToken['amount'] = res || '0';
      if (this.LPToken.amount !== res) {
        this.getPusdtBalance();
      }
      this.LPToken.amount = res || '0';
    });
  }
  private handleAccountBalance(state): void {
    this.tokenBalance.ETH = state.ethBalances;
    this.tokenBalance.BSC = state.bscBalances;
    this.tokenBalance.HECO = state.hecoBalances;
    this.addLiquidityTokens.forEach((item, index) => {
      if (this.tokenBalance[item.chain][item.assetID]) {
        this.addLiquidityTokens[index].amount = this.tokenBalance[item.chain][
          item.assetID
        ].amount;
      } else {
        this.addLiquidityTokens[index].amount = '--';
      }
      if (item.chain === this.currentChain && item.amount === '--') {
        this.addLiquidityTokens[index].amount = '0';
      }
      if (item.chain !== this.currentChain) {
        this.addLiquidityTokens[index].amount = '--';
      }
    });
  }
  private handleCurrentAddress(): void {
    switch (this.currentChain) {
      case 'ETH': {
        this.currentAddress = this.ethAccountAddress;
        break;
      }
      case 'BSC': {
        this.currentAddress = this.bscAccountAddress;
        break;
      }
      case 'HECO': {
        this.currentAddress = this.hecoAccountAddress;
        break;
      }
      default:
        return;
    }
  }
  getEthDapiService(): any {
    let walletName;
    switch (this.currentChain) {
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
    return walletName === 'MetaMask' || !walletName
      ? this.metaMaskWalletApiService
      : this.o3EthWalletApiService;
  }
  //#endregion
}
