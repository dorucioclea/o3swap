import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import {
  ApiService,
  CommonService,
  MetaMaskWalletApiService,
  SwapService,
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
} from '@lib';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';

type LiquidityType = 'add' | 'remove';
interface State {
  swap: SwapStateType;
}
@Component({
  selector: 'app-liquidity',
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss'],
})
export class LiquidityComponent implements OnInit, OnDestroy {
  BRIDGE_SLIPVALUE = BRIDGE_SLIPVALUE;
  swapProgress = 20;
  addLiquidityTokens: Token[] = JSON.parse(JSON.stringify(USD_TOKENS));
  liquidityType: LiquidityType = 'add';
  rates = {};

  LPToken: Token;
  LPTokens: Token[];
  addLiquidityInputAmount = [];
  removeLiquidityInputAmount = [];
  receiveAmount: string;
  payAmount: string;
  currentAddress: string;
  currentChain: string;
  showConnectWallet = false;
  connectChainType: ConnectChainType;

  swap$: Observable<any>;
  swapUnScribe: Unsubscribable;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  metamaskNetworkId: number;
  tokenBalance = { ETH: {}, NEO: {}, BSC: {}, HECO: {} }; // 账户的 tokens

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
    private nzMessage: NzMessageService,
    private router: Router,
    private swapService: SwapService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.swap$ = store.select('swap');
    this.addLiquidityTokens.forEach((item, index) => {
      this.addLiquidityInputAmount.push('');
      this.removeLiquidityInputAmount.push('');
    });
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.liquidityType = res.url.indexOf('/remove') > 0 ? 'remove' : 'add';
      }
    });
  }

  ngOnInit(): void {
    this.getRates();
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
      this.getCurrentChain(state.metamaskNetworkId);
      this.getLPBalance();
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

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      this.rates = res;
    });
  }

  changeLiquidityType(params: LiquidityType): void {
    this.liquidityType = params;
  }

  async changeInAmount(token: Token, index: number): Promise<void> {
    if (!new BigNumber(this.addLiquidityInputAmount[index]).isNaN()) {
      this.receiveAmount = await this.apiService.getPoolOutGivenSingleIn(
        token,
        this.addLiquidityInputAmount[index]
      );
    } else {
      this.receiveAmount = '';
    }
  }

  async changeOutAmount(token: Token, index: number): Promise<void> {
    if (!new BigNumber(this.removeLiquidityInputAmount[index]).isNaN()) {
      this.payAmount = await this.apiService.getPoolInGivenSingleOut(
        token,
        this.removeLiquidityInputAmount[index]
      );
    } else {
      this.payAmount = '';
    }
  }

  async maxAddLiquidityInput(index: number): Promise<void> {
    if (!new BigNumber(this.addLiquidityTokens[index].amount).isNaN()) {
      this.addLiquidityInputAmount[index] = this.addLiquidityTokens[
        index
      ].amount;
      this.receiveAmount = await this.apiService.getPoolOutGivenSingleIn(
        this.addLiquidityTokens[index],
        this.addLiquidityInputAmount[index]
      );
    }
  }

  async maxRemoveLiquidityInput(index: number): Promise<void> {
    if (!new BigNumber(this.LPToken.amount).isNaN()) {
      this.payAmount = this.LPToken.amount;
      this.removeLiquidityInputAmount[
        index
      ] = await this.apiService.getSingleOutGivenPoolIn(
        this.addLiquidityTokens[index],
        this.payAmount
      );
    }
  }

  async depost(token: Token, index: number): Promise<void> {
    if (this.checkWalletConnect(token) === false) {
      return;
    }
    if (this.metaMaskWalletApiService.checkNetwork(token) === false) {
      return;
    }
    const tokenBalance = new BigNumber(token.amount);
    const tokenAmount = new BigNumber(this.addLiquidityInputAmount[index]);
    if (tokenBalance.comparedTo(tokenAmount) < 0) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const allowance = await this.metaMaskWalletApiService.getAllowance(
      token,
      this.currentAddress
    );
    if (new BigNumber(allowance).comparedTo(tokenAmount) < 0) {
      await this.metaMaskWalletApiService.approve(token, this.currentAddress);
    }
    const amountOut = new BigNumber(this.receiveAmount)
      .shiftedBy(this.LPToken.decimals)
      .dp(0)
      .toFixed();
    const fee = await this.apiService.getFromEthPolyFee(token, token);
    this.metaMaskWalletApiService
      .addLiquidity(
        token,
        this.LPToken,
        this.addLiquidityInputAmount[index],
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

  async withdrawal(token: Token, index: number): Promise<void> {
    if (this.checkWalletConnect(token) === false) {
      return;
    }
    if (this.metaMaskWalletApiService.checkNetwork(token) === false) {
      return;
    }
    const lpBalance = new BigNumber(this.LPToken.amount);
    const lpPayAmount = new BigNumber(this.payAmount);
    if (lpBalance.comparedTo(lpPayAmount) < 0) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    const allowance = await this.metaMaskWalletApiService.getAllowance(
      this.LPToken,
      this.currentAddress
    );
    if (new BigNumber(allowance).comparedTo(lpPayAmount) < 0) {
      await this.metaMaskWalletApiService.approve(
        this.LPToken,
        this.currentAddress
      );
    }
    const amountOut = new BigNumber(this.removeLiquidityInputAmount[index])
      .shiftedBy(token.decimals)
      .dp(0)
      .toFixed();
    const fee = await this.apiService.getFromEthPolyFee(token, token);
    this.metaMaskWalletApiService
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
    this.metaMaskWalletApiService.getBalancByHash(this.LPToken).then((res) => {
      this.LPToken.amount = res || '0';
    });
  }
  private handleAccountBalance(state): void {
    this.tokenBalance.ETH = state.ethBalances;
    this.tokenBalance.BSC = state.bscBalances;
    this.tokenBalance.HECO = state.hecoBalances;
    this.addLiquidityTokens.forEach((item) => {
      if (this.tokenBalance[item.chain][item.assetID]) {
        item.amount = this.tokenBalance[item.chain][item.assetID].amount;
      } else {
        item.amount = '--';
      }
      if (item.chain === this.currentChain && item.amount === '--') {
        item.amount = '0';
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
  //#endregion
}
