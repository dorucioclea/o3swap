import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Account, UPDATE_NEO_BALANCES, WalletType } from '@lib';
import { NzMessageService } from 'ng-zorro-antd/message';

interface AppState {
  swap: any;
  wallet: any;
}

@Injectable()
export class SwapService {
  wallet$: Observable<any>;
  walletType: WalletType;

  swap$: Observable<any>;
  myNeoDapi;
  account: Account;

  constructor(
    private store: Store<AppState>,
    private nzMessage: NzMessageService
  ) {
    this.swap$ = store.select('swap');
    this.wallet$ = store.select('wallet');
    this.wallet$.subscribe((state) => {
      this.walletType = state.walletType;
    });
    this.swap$.subscribe((state) => {
      this.myNeoDapi = state.neoDapi;
      this.account = state.account;
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
        const tempTokenBalance = {};
        tokens.forEach((tokenItem: any) => {
          tempTokenBalance[tokenItem.assetID] = tokenItem;
        });
        this.store.dispatch({
          type: UPDATE_NEO_BALANCES,
          data: tempTokenBalance,
        });
      })
      .catch((error) => {
        this.handleDapiError(error);
      });
  }

  handleDapiError(error): void {
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
  }
}
