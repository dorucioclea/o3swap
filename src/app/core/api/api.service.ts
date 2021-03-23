import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Chain, WalletType } from '@lib';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;
  chain: Chain = 'neo';
  RATE_HOST = 'https://hub.o3.network/v1';
  INQUIRY_HOST = 'http://47.110.14.167:5002/AssetQuery';

  tokenBalance = {};
  tokenBalanceSource = new Subject<any>();
  tokenBalanceSub$ = this.tokenBalanceSource.asObservable();

  myNeoDapi;
  myNeoDapiSource = new Subject<any>();
  myNeoDapiSub$ = this.myNeoDapiSource.asObservable();

  account;
  accountSource = new Subject<any>();
  accountSub$ = this.accountSource.asObservable();

  walletType: WalletType;
  walletTypeSource = new Subject<WalletType>();
  walletTypeSub$ = this.walletTypeSource.asObservable();

  isMainNet = true;
  isMainNetSource = new Subject<boolean>();
  isMainNetSub$ = this.isMainNetSource.asObservable();

  constructor(private http: HttpClient) {}

  pushTokenBalances(value): void {
    this.tokenBalance = value;
    this.tokenBalanceSource.next(value);
  }

  pushMyNeoDapi(value): void {
    this.myNeoDapi = value;
    this.myNeoDapiSource.next(value);
  }

  pushAccount(value): void {
    this.account = value;
    this.accountSource.next(value);
  }

  pushWalletType(value: WalletType): void {
    this.walletType = value;
    this.walletTypeSource.next(value);
  }

  pushIsMainNet(value: boolean): void {
    this.isMainNet = value;
    this.isMainNetSource.next(value);
  }

  postEmail(email: string): Observable<any> {
    return this.http.post(`https://subscribe.o3swap.com/subscribe`, { email });
  }

  getSwapPath(
    fromAssetName: string,
    toAssetName: string,
    amount: string
  ): Observable<any> {
    return this.http.post(
      `${this.INQUIRY_HOST}?StartAsset=${fromAssetName}&EndAsset=${toAssetName}&amount=${amount}`,
      null
    );
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
        this.pushTokenBalances(tempTokenBalance);
      });
  }

  getRates(): Observable<any> {
    const commonHeader = {
      headers: { Connection: 'keep-alive' },
    };
    const neoHttp = this.http.get(
      `${this.RATE_HOST}/coin/rates?chain=neo`,
      commonHeader
    );
    const ethHttp = this.http.get(
      `${this.RATE_HOST}/coin/rates?chain=eth`,
      commonHeader
    );
    const btcHttp = this.http.get(
      `${this.RATE_HOST}/coin/rates?chain=btc`,
      commonHeader
    );
    const ontHttp = this.http.get(
      `${this.RATE_HOST}/coin/rates?chain=ont`,
      commonHeader
    );
    return forkJoin([neoHttp, ethHttp, btcHttp, ontHttp]).pipe(
      map((res: any) => {
        const rates: any = { pnUSDT: 1 };
        if (res[0].status === 'success') {
          rates.nNEO = res[0].data.neo.price;
          rates.FLM = res[0].data.flm.price;
          rates.SWTH = res[0].data.swth.price;
        }
        if (res[1].status === 'success') {
          rates.pnWETH = res[1].data.eth.price;
        }
        if (res[2].status === 'success') {
          rates.pnWBTC = res[2].data.btc.price;
        }
        if (res[3].status === 'success') {
          rates.pONT = res[3].data.ont.price;
        }
        return rates;
      })
    );
  }
}
