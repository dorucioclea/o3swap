import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import {
  ETH_WALLETS,
  NEO_WALLETS,
  BSC_WALLETS,
  HECO_WALLETS,
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
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  RESET_BSC_BALANCES,
  RESET_HECO_BALANCES,
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

export type ConnectChainType = 'ETH' | 'NEO' | 'BSC' | 'HECO';
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
  BSC_WALLETS = BSC_WALLETS;
  HECO_WALLETS = HECO_WALLETS;
  currentPage = this.router.url;
  isHome = true;
  connectChainType: ConnectChainType = 'NEO';
  showConnectModal = false; // connect wallet modal
  // account modal
  showNeoAccountModal = false;
  showEthAccountModal = false;
  showBscAccountModal = false;
  showHecoAccountModal = false;
  showNeoAccountModalTimeOut;
  showEthAccountModalTimeOut;
  showBscAccountModalTimeOut;
  showHecoAccountModalTimeOut;

  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

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
    this.apiService.getTokens();
    this.swap$.subscribe((state) => {
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
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

  showAccountModal(type: ConnectChainType): void {
    switch (type) {
      case 'ETH':
        clearTimeout(this.showEthAccountModalTimeOut);
        this.showEthAccountModal = true;
        break;
      case 'NEO':
        clearTimeout(this.showNeoAccountModalTimeOut);
        this.showNeoAccountModal = true;
        break;
      case 'BSC':
        clearTimeout(this.showBscAccountModalTimeOut);
        this.showBscAccountModal = true;
        break;
      case 'HECO':
        clearTimeout(this.showHecoAccountModalTimeOut);
        this.showHecoAccountModal = true;
        break;
    }
  }

  hideAccountModal(type: ConnectChainType): void {
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
      case 'BSC':
        this.showBscAccountModalTimeOut = setTimeout(() => {
          this.showBscAccountModal = false;
        }, 200);
        break;
      case 'HECO':
        this.showHecoAccountModalTimeOut = setTimeout(() => {
          this.showHecoAccountModal = false;
        }, 200);
        break;
    }
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  //#region account modal
  disConnect(type: ConnectChainType): void {
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
      case 'BSC':
        this.showBscAccountModal = false;
        this.bscWalletName = null;
        this.bscAccountAddress = null;
        this.store.dispatch({ type: UPDATE_BSC_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_BSC_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_BSC_BALANCES });
        break;
      case 'HECO':
        this.showHecoAccountModal = false;
        this.hecoWalletName = null;
        this.hecoAccountAddress = null;
        this.store.dispatch({ type: UPDATE_HECO_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_HECO_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_HECO_BALANCES });
        break;
    }
  }

  changeWallet(type: ConnectChainType): void {
    this.connectChainType = type;
    this.showConnectModal = true;
    switch (type) {
      case 'ETH':
        this.showEthAccountModal = false;
        break;
      case 'NEO':
        this.showNeoAccountModal = false;
        break;
      case 'BSC':
        this.showBscAccountModal = false;
        break;
      case 'HECO':
        this.showHecoAccountModal = false;
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
        this.metaMaskWalletApiService.connect(this.connectChainType);
        break;
      case 'O3':
        this.o3EthWalletApiService.connect(this.connectChainType);
        break;
    }
  }

  closeConnectModal(): void {
    this.showConnectModal = false;
  }
  //#endregion
}
