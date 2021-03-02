import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Chain } from '@lib';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;
  chain: Chain = 'neo';
  RATE_HOST = 'https://hub.o3.network/v1';
  INQUIRY_HOST = 'http://localhost:5000/AssetQuery';

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
