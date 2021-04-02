import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import {
  ETH_WALLETS,
  NEO_WALLETS,
  NeoWalletName,
  EthWalletName,
  UPDATE_NEO_ACCOUNT,
  SwapStateType,
  RESET_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  NeoWallet,
  EthWallet,
} from '@lib';
import {
  CommonService,
  ApiService,
  MetaMaskWalletApiService,
  NeolineWalletApiService,
  O3EthWalletApiService,
  O3NeoWalletApiService,
} from '@core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

export type ConnectWalletType = 'ETH' | 'NEO';
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
  currentPage = this.router.url;
  isHome = true;
  connectWalletType: ConnectWalletType = 'NEO';
  showConnectModal = false; // connect wallet modal
  // account modal
  showNeoAccountModal = false;
  showEthAccountModal = false;
  showNeoAccountModalTimeOut;
  showEthAccountModalTimeOut;

  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;

  constructor(
    private store: Store<State>,
    private router: Router,
    private commonService: CommonService,
    public apiService: ApiService,
    private o3NeoWalletApiService: O3NeoWalletApiService,
    private o3EthWalletApiService: O3EthWalletApiService,
    private neolineWalletApiService: NeolineWalletApiService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private changeDetectorRef: ChangeDetectorRef
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
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.ethWalletName = state.ethWalletName;
      this.changeDetectorRef.detectChanges();
    });
  }

  isHomePage(): boolean {
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return true;
    }
    return false;
  }

  showConnect(): void {
    this.showConnectModal = true;
  }

  showAccountModal(type: ConnectWalletType): void {
    switch (type) {
      case 'ETH':
        clearTimeout(this.showEthAccountModalTimeOut);
        this.showEthAccountModal = true;
        break;
      case 'NEO':
        clearTimeout(this.showNeoAccountModalTimeOut);
        this.showNeoAccountModal = true;
        break;
    }
  }

  hideAccountModal(type: ConnectWalletType): void {
    switch (type) {
      case 'ETH':
        this.showEthAccountModalTimeOut = setTimeout(() => {
          this.showEthAccountModal = false;
        }, 200);
        break;
      case 'NEO':
        this.showNeoAccountModalTimeOut = setTimeout(() => {
          this.showNeoAccountModal = false;
        }, 200);
        break;
    }
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  //#region account modal
  disConnect(type: ConnectWalletType): void {
    switch (type) {
      case 'ETH':
        this.showEthAccountModal = false;
        this.ethWalletName = null;
        this.ethAccountAddress = null;
        this.store.dispatch({ type: UPDATE_ETH_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_ETH_WALLET_NAME, data: null });
        break;
      case 'NEO':
        this.showNeoAccountModal = false;
        this.neoWalletName = null;
        this.neoAccountAddress = null;
        this.store.dispatch({ type: UPDATE_NEO_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_NEO_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_NEO_BALANCES });
        break;
    }
  }

  changeWallet(type: ConnectWalletType): void {
    this.connectWalletType = type;
    this.showConnectModal = true;
    switch (type) {
      case 'ETH':
        this.showEthAccountModal = false;
        break;
      case 'NEO':
        this.showNeoAccountModal = false;
        break;
    }
  }
  //#endregion

  //#region connect wallet modal
  connectNeoWallet(wallet: NeoWallet): void {
    switch (wallet.name) {
      case 'NeoLine':
        this.neolineWalletApiService.connect();
        break;
      case 'O3':
        this.o3NeoWalletApiService.connect();
        break;
    }
  }

  connectEthWallet(wallet: EthWallet): void {
    switch (wallet.name) {
      case 'MetaMask':
        this.metaMaskWalletApiService.connect();
        break;
      case 'O3':
        this.o3EthWalletApiService.connect();
        break;
    }
  }

  closeConnectModal(): void {
    this.showConnectModal = false;
  }
  //#endregion
}
