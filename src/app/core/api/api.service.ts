import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, Subject } from 'rxjs';
import { Chain } from '@lib';

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;
  chain: Chain = 'neo';
  RATE_HOST = 'https://hub.o3.network/v1';
  tokenBalanceSource = new Subject<any>();
  tokenBalanceSub$ = this.tokenBalanceSource.asObservable();
  myNeoDapiSource = new Subject<any>();
  myNeoDapiSub$ = this.myNeoDapiSource.asObservable();
  accountSource = new Subject<any>();
  accountSub$ = this.accountSource.asObservable();
  walletTypeSource = new Subject<any>();
  walletTypeSub$ = this.walletTypeSource.asObservable();

  constructor(private http: HttpClient) {}

  pushTokenBalances(value): void {
    this.tokenBalanceSource.next(value);
  }

  pushMyNeoDapi(value): void {
    this.myNeoDapiSource.next(value);
  }

  pushAccount(value): void {
    this.accountSource.next(value);
  }

  pushWalletType(value): void {
    this.walletTypeSource.next(value);
  }

  getRates(): Observable<any> {
    return this.http.get(`${this.RATE_HOST}/coin/rates?chain=${this.chain}`, {
      headers: { Connection: 'keep-alive' },
    });
  }
}
