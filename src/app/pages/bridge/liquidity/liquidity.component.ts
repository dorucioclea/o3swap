import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ApiService, CommonService, MetaMaskWalletApiService } from '@core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { SwapStateType } from 'src/app/_lib/swap';
import { METAMASK_CHAIN_ID } from 'src/app/_lib/wallet';
import { CHAIN_TOKENS, Token } from 'src/app/_lib/token';
import BigNumber from 'bignumber.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SWAP_CONTRACT_CHAIN_ID } from '@lib';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';

type LiquidityType = 'add' | 'remove';
interface State {
  swap: SwapStateType;
  setting: any;
}
@Component({
  selector: 'app-liquidity',
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss']
})
export class LiquidityComponent implements OnInit, OnDestroy {
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
  currentChain: string;
  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  currentAddress: string;

  constructor(
    private apiService: ApiService,
    private commonService: CommonService,
    public store: Store<State>,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private nzMessage: NzMessageService,
    private router: Router,

  ) {
    this.swap$ = store.select('swap');
    this.liquidityType = 'add';
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
    this.swap$.subscribe((state: SwapStateType) => {
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      if (state.ethBalances) {
        this.addLiquidityTokens.filter(item => item.chain === 'ETH').forEach(item => {
          if (state.ethBalances[item.assetID]) {
            item.amount = state.ethBalances[item.assetID].amount;
            this.currentChain = 'ETH';
          } else {
            item.amount = '--';
          }
        });
      }
      if (state.bscBalances) {
        this.addLiquidityTokens.filter(item => item.chain === 'BSC').forEach(item => {
          if (state.bscBalances[item.assetID]) {
            item.amount = state.bscBalances[item.assetID].amount;
            this.currentChain = 'BSC';
          } else {
            item.amount = '--';
          }
        });
      }
      if (state.hecoBalances) {
        this.addLiquidityTokens.filter(item => item.chain === 'HECO').forEach(item => {
          if (state.hecoBalances[item.assetID]) {
            item.amount = state.hecoBalances[item.assetID].amount;
            this.currentChain = 'HECO';
          } else {
            item.amount = '--';
          }
        });
      }
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
        default: return;
      }
      this.LPToken = this.LPTokens.find(item => item.chain === this.currentChain);
      this.getLPBalance();
    });
    this.addLiquidityTokens.forEach(item => {
      if (this.metaMaskWalletApiService !== METAMASK_CHAIN_ID[item.chain]) {
        item.amount = '--';
      }
    });
  }

  ngOnDestroy(): void {

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
      this.receiveAmount = await this.apiService.getPoolOutGivenSingleIn(token, this.addLiquidityInputAmount[index]);
    } else {
      this.receiveAmount = '';
    }
  }

  async changeOutAmount(token: Token, index: number): Promise<void> {
    if (!new BigNumber(this.removeLiquidityInputAmount[index]).isNaN()) {
      this.payAmount = await this.apiService.getPoolOutGivenSingleOut(token, this.removeLiquidityInputAmount[index]);
    } else {
      this.payAmount = '';
    }
  }

  maxAddLiquidityInput(index: number): void {
    if (!new BigNumber(this.addLiquidityTokens[index].amount).isNaN()) {
      this.addLiquidityInputAmount[index] = this.addLiquidityTokens[index].amount;
    }
  }

  async maxRemoveLiquidityInput(index: number): Promise<void> {
    if (!new BigNumber(this.LPToken.amount).isNaN()) {
      this.removeLiquidityInputAmount[index] =
        await this.apiService.getSingleInGivenPoolIn(this.addLiquidityTokens[index], this.LPToken.amount);
      this.payAmount = this.LPToken.amount;
    }
  }

  async depost(token: Token, index: number): Promise<void> {
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
    const allowance = await this.metaMaskWalletApiService.getAllowance(token, this.currentAddress);
    if (new BigNumber(allowance).comparedTo(tokenAmount) < 0) {
      await this.metaMaskWalletApiService.approve(token, this.currentAddress);
    }
    this.metaMaskWalletApiService.addLiquidity(
      token,
      this.addLiquidityInputAmount[index],
      this.metaMaskWalletApiService.accountAddress,
      this.metaMaskWalletApiService.accountAddress,
      SWAP_CONTRACT_CHAIN_ID[token.chain]).then(res => {
        this.commonService.log(res);
      }).catch(error => {
        this.nzMessage.error(error);
      });
  }

  async withdrawal(token: Token, index: number): Promise<void> {
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
    const allowance = await this.metaMaskWalletApiService.getAllowance(this.LPToken, this.currentAddress);
    if (new BigNumber(allowance).comparedTo(lpPayAmount) < 0) {
      this.metaMaskWalletApiService.approve(this.LPToken, this.currentAddress);
    }
    this.metaMaskWalletApiService.removeLiquidity(
      this.LPToken,
      lpPayAmount.toFixed(),
      this.metaMaskWalletApiService.accountAddress,
      this.metaMaskWalletApiService.accountAddress,
      SWAP_CONTRACT_CHAIN_ID[token.chain]).then(res => {
        this.commonService.log(res);
      }).catch(error => {
        this.nzMessage.error(error);
      });
  }
  wordlimit(value: string | number): string {
    return this.commonService.wordlimit(value);
  }

  private getLPBalance(): void {
    this.metaMaskWalletApiService.getBalancByHash(this.LPToken).then(res => {
      this.LPToken.amount = res;
    });
  }
}
