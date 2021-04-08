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
  inputAmount = [];
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
    private nzMessage: NzMessageService

  ) {
    this.swap$ = store.select('swap');
    this.liquidityType = 'add';
    this.addLiquidityTokens.forEach((item, index) => {
      this.inputAmount.push('');
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
            item.amount = '0';
          }
        });
      }
      if (state.bscBalances) {
        this.addLiquidityTokens.filter(item => item.chain === 'BSC').forEach(item => {
          if (state.bscBalances[item.assetID]) {
            item.amount = state.bscBalances[item.assetID].amount;
            this.currentChain = 'BSC';
          } else {
            item.amount = '0';
          }
        });
      }
      if (state.hecoBalances) {
        this.addLiquidityTokens.filter(item => item.chain === 'HECO').forEach(item => {
          if (state.hecoBalances[item.assetID]) {
            item.amount = state.hecoBalances[item.assetID].amount;
            this.currentChain = 'HECO';
          } else {
            item.amount = '0';
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

  depost(token: Token, index: number): void {
    if (token.amount === '--') {
      this.nzMessage.error(`Please connect the ${token.chain} wallet first`);
      return;
    }
    const tokenBalance = new BigNumber(token.amount);
    const inputAmount = new BigNumber(this.inputAmount[index]);
    if (tokenBalance.comparedTo(inputAmount) < 0) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    this.metaMaskWalletApiService.addLiquidity(
      token,
      this.inputAmount[index],
      this.metaMaskWalletApiService.accountAddress,
      this.metaMaskWalletApiService.accountAddress,
      SWAP_CONTRACT_CHAIN_ID[token.chain]).then(res => {
        this.commonService.log(res);
      }).catch(error => {
        this.nzMessage.error(error);
      });
  }

  withdrawal(token: Token, index: number): void {
    if (token.amount === '--') {
      this.nzMessage.error(`Please connect the ${token.chain} wallet first`);
      return;
    }
    const tokenBalance = new BigNumber(token.amount);
    const inputAmount = new BigNumber(this.inputAmount[index]);
    if (tokenBalance.comparedTo(inputAmount) < 0) {
      this.nzMessage.error('Insufficient balance');
      return;
    }
    this.metaMaskWalletApiService.removeLiquidity(
      token,
      this.inputAmount[index],
      this.metaMaskWalletApiService.accountAddress,
      this.metaMaskWalletApiService.accountAddress,
      SWAP_CONTRACT_CHAIN_ID[token.chain]).then(res => {
        this.commonService.log(res);
      }).catch(error => {
        this.nzMessage.error(error);
      });
  }

  private getLPBalance(): void {
    this.metaMaskWalletApiService.getBalancByHash(this.LPToken).then(res => {
      this.LPToken.amount = res;
    });
  }
}
