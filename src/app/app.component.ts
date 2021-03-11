import { Component } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { WalletType } from '@lib';
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
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  menuType: MenuType = 'home';
  currentPage = this.router.url;
  isHome = true;
  chain;
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
    this.initNeolineJs();
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

  initNeolineJs(): void {
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapiNeo = new (window as any).NEOLine.Init();
    });
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.account = result.detail;
        this.apiService.pushAccount(this.account);
        this.getNeoBalances();
      }
    );
    window.addEventListener(
      'NEOLine.NEO.EVENT.DISCONNECTED',
      (account: any) => {
        // console.log(account);
      }
    );
  }

  getNeoAccount(): void {
    this.myNeoDapi =
      this.walletType === 'O3' ? o3dapi.NEO : this.neolineDapiNeo;
    this.apiService.pushMyNeoDapi(this.myNeoDapi);
    this.myNeoDapi
      .getAccount()
      .then((result) => {
        // console.log(result);
        if (this.commonService.isNeoAddress(result.address)) {
          this.account = result;
          this.apiService.pushAccount(this.account);
          this.getNeoBalances();
        } else {
          this.nzMessage.error('请连接 Neo 钱包');
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

  getNeoBalances(): void {
    this.myNeoDapi
      .getBalance({
        params: [{ address: this.account.address }],
        network: 'TestNet',
      })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.account.address];
        // console.log(tokens);
        const tempTokenBalance = {};
        tokens.forEach((tokenItem: any) => {
          tempTokenBalance[tokenItem.assetID] = tokenItem;
        });
        this.apiService.pushTokenBalances(tempTokenBalance);
      });
  }
}
