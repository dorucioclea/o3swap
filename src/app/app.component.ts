import { Component, OnInit } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import {
  Account,
  ETH_WALLETS,
  NEO_WALLETS,
  NeoWalletName,
  EthWalletName,
  NeoWallet,
  UPDATE_NEO_ACCOUNT,
  SwapStateType,
  UPDATE_NEO_BALANCES,
  RESET_NEO_BALANCES,
} from '@lib';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  CommonService,
  ApiService,
  SwapService,
  NeolineWalletApiService,
  O3WalletApiService,
} from '@core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

type MenuType = 'home' | 'swap';
type ConnectWalletType = 'ETH' | 'NEO';
interface State {
  swap: SwapStateType;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  NEO_WALLETS = NEO_WALLETS;
  ETH_WALLETS = ETH_WALLETS;
  menuType: MenuType = 'home';
  currentPage = this.router.url;
  isHome = true;
  connectWalletType: ConnectWalletType = 'NEO';
  // 弹窗
  showConnectModal = false;
  showAccountModal = false;

  swap$: Observable<any>;
  neoAccount: Account;
  ethAccount: Account;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;

  constructor(
    private store: Store<State>,
    private router: Router,
    private commonService: CommonService,
    public apiService: ApiService,
    private o3WalletApiService: O3WalletApiService,
    private neolineWalletApiService: NeolineWalletApiService
  ) {
    this.swap$ = store.select('swap');
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
      }
    });
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.neoAccount = state.neoAccount;
      this.neoWalletName = state.neoWalletName;
      this.ethWalletName = state.ethWalletName;
    });
  }

  showConnect(): void {
    if (!this.neoAccount) {
      this.showConnectModal = true;
    } else {
      this.showAccountModal = true;
    }
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  connectNeoWallet(wallet: NeoWallet): void {
    switch (wallet.name) {
      case 'NeoLine':
        this.neolineWalletApiService.connect();
        break;
      case 'O3':
        this.o3WalletApiService.connect();
        break;
    }
  }

  connectEthWallet(type: EthWalletName): void {
    this.showConnectModal = false;
  }

  disConnect(): void {
    this.showAccountModal = false;
    this.neoAccount = null;
    this.store.dispatch({ type: UPDATE_NEO_ACCOUNT, data: null });
    this.store.dispatch({ type: RESET_NEO_BALANCES });
  }

  changeWallet(): void {
    this.showAccountModal = false;
    this.showConnectModal = true;
  }

  isHomePage(): boolean {
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return true;
    }
    return false;
  }
}
