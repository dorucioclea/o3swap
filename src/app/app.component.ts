import { Component } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { Exchange, RateChain, Token, WalletType } from './pages/swap/type';
import o3dapiNeo from 'o3-dapi-neo';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DEFAULT_FROM_TOKEN, TOKENS_OBJECT } from './pages/swap/constants';

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
  // 弹窗
  showConnectModal = false;
  showAccountModal = false;

  neolineDapiNeo;
  myNeoDapi;
  walletType: WalletType = 'O3';
  chain = 'neo'; // 'neo' | 'eth'
  account: Account;

  selectTokenType: string; // "from" | "to"
  fromToken: Token = DEFAULT_FROM_TOKEN;
  toToken: Token;
  rates: RateChain = new RateChain();

  fiat: Exchange = new Exchange();
  receiveAmount: Exchange = new Exchange();
  chooseExchange;
  inquiryTimeout: any;

  slipValue = 2;

  constructor(private router: Router, private nzMessage: NzMessageService) {
    this.isHome = this.isHomePage();
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
      }
    });
    this.initNeolineJs();
  }

  isHomePage(): boolean {
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return true;
    }
    return false;
  }

  showConnect(): void {
    if (!this.account) {
      this.showConnectModal = true;
    } else {
      this.showAccountModal = true;
    }
  }

  connectWallet(type: WalletType): void {
    this.showConnectModal = false;
    this.walletType = type;
    this.myNeoDapi = type === 'O3' ? o3dapiNeo : this.neolineDapiNeo;
    this.myNeoDapi
      .getAccount()
      .then((result) => {
        this.account = result;
        this.getBalances();
      })
      .catch((error) => {
        console.log(error);
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
            this.nzMessage.error(error.description);
            break;
        }
      });
  }

  disConnect(): void {
    this.showAccountModal = false;
    this.account = undefined;
  }

  initNeolineJs(): void {
    window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
      this.neolineDapiNeo = new (window as any).NEOLine.Init();
    });
    window.addEventListener(
      'NEOLine.NEO.EVENT.ACCOUNT_CHANGED',
      (result: any) => {
        this.account = result.detail;
        this.getBalances();
      }
    );
    window.addEventListener(
      'NEOLine.NEO.EVENT.DISCONNECTED',
      (account: any) => {
        console.log('---------');
        console.log(account);
      }
    );
  }

  getBalances(): void {
    this.myNeoDapi
      .getBalance({
        params: [{ address: this.account.address }],
        network: 'MainNet',
      })
      .then((addressTokens: any[]) => {
        const tokens = addressTokens[this.account.address];
        // 修改 tokens 列表的余额amount
        tokens.forEach((tokenItem) => {
          if (TOKENS_OBJECT[this.chain][tokenItem.assetID]) {
            TOKENS_OBJECT[this.chain][tokenItem.assetID].amount =
              tokenItem.amount;
          }
        });
        // 修改 from token 的余额 amount
        this.fromToken.amount =
          TOKENS_OBJECT[this.chain][this.fromToken.assetID]?.amount || '0';
      });
  }
}
