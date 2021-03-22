import { Component } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { Chain, WalletType } from '@lib';
import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonService, ApiService } from '@core';

type MenuType = 'home' | 'swap';
interface Account {
  address: string;
  label: string;
}

const defaultAccount = {
  address: '0xd34E3B073a484823058Ab76fc2304D5394beafE4',
  label: 'eth',
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  menuType: MenuType = 'home';
  currentPage = this.router.url;
  isHome = true;
  chain: Chain;
  // 弹窗
  showConnectModal = false;
  showAccountModal = false;

  neolineDapiNeo;
  myNeoDapi;
  walletType: WalletType = 'O3';
  account: Account;

  constructor(
    private router: Router,
    private nzMessage: NzMessageService,
    private commonService: CommonService,
    public apiService: ApiService
  ) {
    this.chain = this.apiService.chain;
    this.isHome = this.isHomePage();
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
      }
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
    this.apiService.pushWalletType(this.walletType);
    if (this.chain === 'neo') {
      this.myNeoDapi =
        this.walletType === 'O3' ? o3dapi.NEO : this.neolineDapiNeo;
      this.apiService.pushMyNeoDapi(this.myNeoDapi);
      this.getNeoAccount();
    }
  }

  disConnect(): void {
    this.showAccountModal = false;
    this.account = undefined;
    this.apiService.pushAccount(this.account);
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
          if (this.walletType === 'NeoLine') {
            this.initNeolineJs();
          }
          this.account = result;
          this.apiService.pushAccount(this.account);
          this.apiService.getNeoBalances();
        } else {
          this.nzMessage.error('Please connect to Neo wallet');
        }
      })
      .catch((error) => {
        switch (error.type) {
          case 'NO_PROVIDER':
            window.open(
              this.walletType === 'O3'
                ? 'https://o3.network/#download'
                : 'https://neoline.io'
            );
            break;
          case 'CONNECTION_DENIED':
            this.nzMessage.error(
              'The user rejected the request to connect with your dApp'
            );
            break;
          default:
            this.nzMessage.error(error.description || '');
            break;
        }
      });
  }

  initNeolineJs(): void {
    this.myNeoDapi.getNetworks().then((res) => {
      if ((res.defaultNetwork as string).toLowerCase().includes('test')) {
        this.apiService.pushIsMainNet(false);
        this.nzMessage.error('Please connect wallet to the main net.');
      } else {
        this.apiService.pushIsMainNet(true);
      }
    });
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.account = result.detail;
        this.apiService.pushAccount(this.account);
        this.apiService.getNeoBalances();
      }
    );
    window.addEventListener(
      'NEOLine.NEO.EVENT.NETWORK_CHANGED',
      (result: any) => {
        if (
          (result.detail.defaultNetwork as string)
            .toLowerCase()
            .includes('test')
        ) {
          this.apiService.pushIsMainNet(false);
          this.nzMessage.error('Please connect wallet to the main net.');
        } else {
          this.apiService.pushIsMainNet(true);
        }
      }
    );
  }
}
