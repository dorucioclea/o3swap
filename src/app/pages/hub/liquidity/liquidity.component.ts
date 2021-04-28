import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
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
  BRIDGE_SLIPVALUE,
  Token,
  USD_TOKENS,
  LP_TOKENS,
  ETH_PUSDT_ASSET,
  ConnectChainType,
  EthWalletName,
  METAMASK_CHAIN,
  SOURCE_TOKEN_SYMBOL,
} from '@lib';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApproveComponent } from '@shared';

type LiquidityType = 'add' | 'remove';
interface State {
  swap: SwapStateType;
  rates: any;
}
@Component({
  selector: 'app-liquidity',
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss'],
})
export class LiquidityComponent implements OnInit, OnDestroy {
  SOURCE_TOKEN_SYMBOL = SOURCE_TOKEN_SYMBOL;
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
  liquidityType: LiquidityType = 'add';

  LPToken: Token = LP_TOKENS.find((item) => item.chain === 'ETH');
  addLiquidityInputAmount = [];
  removeLiquidityInputAmount = [];
  receiveAmount: string[] = [];
  payAmount: string[] = [];
  showConnectWallet = false;
  connectChainType: ConnectChainType;
  addPolyFee: string[] = [];
  removePolyFee: string[] = [];
  showAddPolyFee: boolean[] = [false, false, false];
  showRemovePolyFee: boolean[] = [false, false, false];

  swapUnScribe: Unsubscribable;
  swap$: Observable<any>;
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
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private modal: NzModalService
  ) {
    this.swap$ = store.select('swap');
    this.rates$ = store.select('rates');
    this.addLiquidityTokens.forEach((item) => {
      this.addLiquidityInputAmount.push('');
      this.removeLiquidityInputAmount.push('');
      this.receiveAmount.push('--');
      this.payAmount.push('--');
      item.amount = '--';
    });
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.liquidityType = res.url.indexOf('/remove') > 0 ? 'remove' : 'add';
      }
    });
  }

  ngOnInit(): void {
    this.ratesUnScribe = this.rates$.subscribe((state) => {
      this.rates = state.rates;
    });
    this.getPusdtBalance();
    this.swapUnScribe = this.swap$.subscribe((state: SwapStateType) => {
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.metamaskNetworkId = state.metamaskNetworkId;
      this.handleAccountBalance(state);
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

  changeLiquidityType(params: LiquidityType): void {
    this.liquidityType = params;
  }

  async changeInAmount(token: Token, index: number): Promise<void> {
    const inputAmount = new BigNumber(this.addLiquidityInputAmount[index]);
    if (!inputAmount.isNaN() && inputAmount.comparedTo(0) > 0) {
      if (inputAmount.comparedTo(50) === 1) {
        this.nzMessage.error(`You've exceeded the maximum limit`);
        return;
      }
      this.receiveAmount[index] = await this.apiService.getPoolOutGivenSingleIn(
        token,
        this.addLiquidityInputAmount[index]
      );
      this.addPolyFee[index] = await this.apiService.getFromEthPolyFee(
        token,
        this.LPToken
      );
    } else {
      this.receiveAmount[index] = '--';
    }
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
      this.removePolyFee[index] = await this.apiService.getFromEthPolyFee(
        this.LPToken,
        token
      );
    } else {
      this.payAmount[index] = '--';
    }
  }

  async maxAddLiquidityInput(index: number): Promise<void> {
    if (!new BigNumber(this.addLiquidityTokens[index].amount).isNaN()) {
      this.addLiquidityInputAmount[index] = this.addLiquidityTokens[
        index
      ].amount;
      this.receiveAmount[index] = await this.apiService.getPoolOutGivenSingleIn(
        this.addLiquidityTokens[index],
        this.addLiquidityInputAmount[index]
      );
      this.addPolyFee[index] = await this.apiService.getFromEthPolyFee(
        this.addLiquidityTokens[index],
        this.LPToken
      );
    }
    this.changeInAmount(this.addLiquidityTokens[index], index);
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
      this.removePolyFee[index] = await this.apiService.getFromEthPolyFee(
        this.LPToken,
        this.addLiquidityTokens[index]
      );
    }
    this.changeInAmount(this.addLiquidityTokens[index], index);
  }

  async depost(token: Token, index: number): Promise<void> {
    if (this.checkWalletConnect(token) === false) {
      return;
    }
    const swapApi = this.getEthDapiService(token);
    if (swapApi.checkNetwork(token) === false) {
      return;
    }
    const tokenBalance = new BigNumber(token.amount);
    const tokenAmount = new BigNumber(this.addLiquidityInputAmount[index]);
    if (tokenAmount.isNaN() || tokenAmount.comparedTo(0) <= 0) {
      this.nzMessage.error('Wrong input');
      return;
    }
    if (tokenBalance.comparedTo(tokenAmount) < 0) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const allowance = await swapApi.getAllowance(
      token,
      this.getFromTokenAddress(token)
    );
    if (new BigNumber(allowance).comparedTo(tokenAmount) < 0) {
      this.showApproveModal(token);
      return;
    }
    const amountOut = new BigNumber(this.receiveAmount[index])
      .shiftedBy(this.LPToken.decimals)
      .dp(0)
      .toFixed();
    swapApi
      .addLiquidity(
        token,
        this.LPToken,
        this.addLiquidityInputAmount[index],
        this.getFromTokenAddress(token),
        SWAP_CONTRACT_CHAIN_ID[this.LPToken.chain],
        amountOut,
        this.addPolyFee[index]
      )
      .then((res) => {
        this.commonService.log(res);
      })
      .catch((error) => {
        this.nzMessage.error(error);
      });
  }

  async withdrawal(token: Token, index: number): Promise<void> {
    if (this.checkWalletConnect(token) === false) {
      return;
    }
    const swapApi = this.getEthDapiService(this.LPToken);
    if (swapApi.checkNetwork(this.LPToken) === false) {
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
      this.getFromTokenAddress(token)
    );
    if (new BigNumber(allowance).comparedTo(lpPayAmount) < 0) {
      this.showApproveModal(this.LPToken);
      return;
    }
    const amountOut = new BigNumber(this.removeLiquidityInputAmount[index])
      .shiftedBy(token.decimals)
      .dp(0)
      .toFixed();
    swapApi
      .removeLiquidity(
        this.LPToken,
        token,
        lpPayAmount.toFixed(),
        this.getFromTokenAddress(this.LPToken),
        SWAP_CONTRACT_CHAIN_ID[token.chain],
        amountOut,
        this.removePolyFee[index]
      )
      .then((res) => {
        this.commonService.log(res);
      })
      .catch((error) => {
        this.nzMessage.error(error);
      });
  }

  //#region
  getFromTokenAddress(token: Token): string {
    switch (token.chain) {
      case 'ETH':
        return this.ethAccountAddress;
      case 'BSC':
        return this.bscAccountAddress;
      case 'HECO':
        return this.hecoAccountAddress;
    }
  }
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
        fromAddress: this.getFromTokenAddress(token),
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
    if (!this.ethAccountAddress) {
      this.nzMessage.error('Please connect the ETH wallet first');
      this.showConnectWallet = true;
      this.connectChainType = 'ETH';
      return false;
    }
    return true;
  }
  private getLPBalance(): void {
    if (!this.LPToken) {
      return;
    }
    if (!this.ethWalletName) {
      this.LPToken.amount = '--';
      return;
    }
    if (
      this.ethWalletName === 'MetaMask' &&
      METAMASK_CHAIN[this.metamaskNetworkId] !== 'ETH'
    ) {
      this.LPToken.amount = '--';
      return;
    }
    const swapApi = this.getEthDapiService(this.LPToken);
    swapApi.getBalancByHash(this.LPToken).then((res) => {
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
        if (
          (item.chain === 'ETH' && this.ethAccountAddress) ||
          (item.chain === 'BSC' && this.bscAccountAddress) ||
          (item.chain === 'HECO' && this.hecoAccountAddress)
        ) {
          this.addLiquidityTokens[index].amount = '0';
        } else {
          this.addLiquidityTokens[index].amount = '--';
        }
      }
      if (
        item.chain === 'ETH' &&
        this.ethWalletName === 'MetaMask' &&
        METAMASK_CHAIN[this.metamaskNetworkId] !== 'ETH'
      ) {
        this.addLiquidityTokens[index].amount = '--';
      }
      if (
        item.chain === 'BSC' &&
        this.bscWalletName === 'MetaMask' &&
        METAMASK_CHAIN[this.metamaskNetworkId] !== 'BSC'
      ) {
        this.addLiquidityTokens[index].amount = '--';
      }
      if (
        item.chain === 'HECO' &&
        this.hecoWalletName === 'MetaMask' &&
        METAMASK_CHAIN[this.metamaskNetworkId] !== 'HECO'
      ) {
        this.addLiquidityTokens[index].amount = '--';
      }
    });
  }
  getEthDapiService(token: Token): any {
    let walletName;
    switch (this.getFromTokenAddress(token)) {
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
