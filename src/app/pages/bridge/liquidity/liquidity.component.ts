import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  ApiService,
  CommonService,
  MetaMaskWalletApiService,
  SwapService,
} from '@core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { SwapStateType } from 'src/app/_lib/swap';
import {
  SWAP_CONTRACT_CHAIN_ID,
  METAMASK_CHAIN,
  METAMASK_CHAIN_ID,
  BRIDGE_SLIPVALUE,
  CHAIN_TOKENS,
  Token,
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
  addLiquidityTokens: Token[] = JSON.parse(JSON.stringify(CHAIN_TOKENS.USD));
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

  swap$: Observable<any>;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  metamaskNetworkId: number;

  constructor(
    private apiService: ApiService,
    private commonService: CommonService,
    public store: Store<State>,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private nzMessage: NzMessageService,
    private router: Router,
    private swapService: SwapService
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
    this.LPTokens = JSON.parse(JSON.stringify(CHAIN_TOKENS.LP));
    this.addLiquidityTokens.forEach((item) => {
      if (this.metaMaskWalletApiService !== METAMASK_CHAIN_ID[item.chain]) {
        item.amount = '--';
      }
    });
    this.swap$.subscribe((state: SwapStateType) => {
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.currentChain = METAMASK_CHAIN[state.metamaskNetworkId];
      this.handleAccountBalance(
        state.ethBalances,
        state.bscBalances,
        state.hecoBalances
      );
      this.handleCurrentAddress();
      if (state.metamaskNetworkId !== this.metamaskNetworkId) {
        this.metamaskNetworkId = state.metamaskNetworkId;
        this.getLPBalance();
      }
    });
  }

  ngOnDestroy(): void {}

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
    if (token.amount === '--') {
      this.nzMessage.error(`Please connect the ${token.chain} wallet first`);
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
      .shiftedBy(18)
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
    if (this.LPToken.amount === '--') {
      this.nzMessage.error(`Please connect the ${token.chain} wallet first`);
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
      return false;
    }
    if (token.chain === 'BSC' && !this.bscAccountAddress) {
      this.nzMessage.error('Please connect the BSC wallet first');
      return false;
    }
    if (token.chain === 'HECO' && !this.hecoAccountAddress) {
      this.nzMessage.error('Please connect the HECO wallet first');
      return false;
    }
    return true;
  }
  private getLPBalance(): void {
    if (!this.currentChain) {
      return;
    }
    const token = this.LPTokens.find(
      (item) => item.chain === this.currentChain
    );
    this.LPToken = JSON.parse(JSON.stringify(token));
    this.metaMaskWalletApiService.getBalancByHash(this.LPToken).then((res) => {
      this.LPToken.amount = res;
    });
  }
  private handleAccountBalance(ethBalances, bscBalances, hecoBalances): void {
    this.addLiquidityTokens = JSON.parse(JSON.stringify(CHAIN_TOKENS.USD));
    if (ethBalances) {
      this.addLiquidityTokens
        .filter((item) => item.chain === 'ETH')
        .forEach((item) => {
          if (ethBalances[item.assetID]) {
            item.amount = ethBalances[item.assetID].amount;
          } else {
            item.amount = '--';
          }
        });
    }
    if (bscBalances) {
      this.addLiquidityTokens
        .filter((item) => item.chain === 'BSC')
        .forEach((item) => {
          if (bscBalances[item.assetID]) {
            item.amount = bscBalances[item.assetID].amount;
          } else {
            item.amount = '--';
          }
        });
    }
    if (hecoBalances) {
      this.addLiquidityTokens
        .filter((item) => item.chain === 'HECO')
        .forEach((item) => {
          if (hecoBalances[item.assetID]) {
            item.amount = hecoBalances[item.assetID].amount;
          } else {
            item.amount = '--';
          }
        });
    }
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
