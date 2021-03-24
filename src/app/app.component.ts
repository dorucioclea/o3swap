import { Component, OnInit } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import {
  Account,
  Chain,
  RESET_NEO_ACCOUNT,
  UPDATE_NEO_BALANCES,
  UPDATE_NEO_IS_MAINNET,
  UPDATE_WALLET_TYPE,
  WalletType,
} from '@lib';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService, ApiService, SwapService } from '@core';
import { Store, UPDATE } from '@ngrx/store';
import { Observable } from 'rxjs';
import { UPDATE_ACCOUNT, UPDATE_NEO_DAPI_JS } from '@lib';

type MenuType = 'home' | 'swap';
interface AppState {
  wallet: any;
  swap: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  menuType: MenuType = 'home';
  currentPage = this.router.url;
  isHome = true;
  // 弹窗
  showConnectModal = false;
  showAccountModal = false;
  neolineDapiNeo;

  swap$: Observable<any>;
  myNeoDapi;
  account: Account;

  wallet$: Observable<any>;
  walletType: WalletType;
  chain: Chain;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    public apiService: ApiService,
    private swapService: SwapService
  ) {
    this.wallet$ = store.select('wallet');
    this.swap$ = store.select('swap');
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
      }
    });
  }

  ngOnInit(): void {
    this.wallet$.subscribe((state) => {
      this.walletType = state.walletType;
      this.chain = state.chain;
    });
    this.swap$.subscribe((state) => {
      this.account = state.account;
    });
    o3dapi.initPlugins([o3dapiNeo]);
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapiNeo = new (window as any).NEOLine.Init();
    });
  }

  showConnect(): void {
    if (!this.account) {
      this.showConnectModal = true;
    } else {
      this.showAccountModal = true;
    }
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  connectWallet(type: WalletType): void {
    this.showConnectModal = false;
    this.walletType = type;
    if (this.chain === 'neo') {
      if (this.walletType === 'NeoLine' && this.neolineDapiNeo === undefined) {
        window.open('https://neoline.io');
        return;
      }
      this.myNeoDapi =
        this.walletType === 'O3' ? o3dapi.NEO : this.neolineDapiNeo;
      this.getNeoAccount();
    }
  }

  disConnect(): void {
    this.showAccountModal = false;
    this.account = null;
    this.store.dispatch({ type: RESET_NEO_ACCOUNT });
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

  getNeoAccount(): void {
    this.myNeoDapi
      .getAccount()
      .then((result) => {
        // console.log(result);
        if (this.commonService.isNeoAddress(result.address)) {
          this.account = result;
          this.store.dispatch({
            type: UPDATE_ACCOUNT,
            data: this.account,
          });
          this.store.dispatch({
            type: UPDATE_NEO_DAPI_JS,
            data: this.myNeoDapi,
          });
          this.store.dispatch({
            type: UPDATE_WALLET_TYPE,
            data: this.walletType,
          });
          if (this.walletType === 'NeoLine') {
            this.initNeolineJs();
          }
          this.swapService.getNeoBalances();
        } else {
          this.nzMessage.error('Please connect to Neo wallet');
        }
      })
      .catch((error) => {
        this.swapService.handleDapiError(error);
      });
  }

  initNeolineJs(): void {
    // this.myNeoDapi.getNetworks().then((res) => {
    //   if ((res.defaultNetwork as string).toLowerCase().includes('test')) {
    //     this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: false });
    //     this.nzMessage.error('Please connect wallet to the main net.');
    //   } else {
    //     this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: true });
    //   }
    // });
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.account = result.detail;
        this.store.dispatch({ type: UPDATE_ACCOUNT, data: this.account });
        this.swapService.getNeoBalances();
      }
    );
    // window.addEventListener(
    //   'NEOLine.NEO.EVENT.NETWORK_CHANGED',
    //   (result: any) => {
    //     if (
    //       (result.detail.defaultNetwork as string)
    //         .toLowerCase()
    //         .includes('test')
    //     ) {
    //       this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: false });
    //       this.nzMessage.error('Please connect wallet to the main net.');
    //     } else {
    //       this.store.dispatch({ type: UPDATE_NEO_IS_MAINNET, data: true });
    //     }
    //   }
    // );
  }
}
