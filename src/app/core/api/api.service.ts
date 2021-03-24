import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;
  RATE_HOST = 'https://hub.o3.network/v1';
  INQUIRY_HOST = 'http://47.110.14.167:5002/AssetQuery';

  constructor(private http: HttpClient) {}

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

  getRates(): Observable<any> {
    const neoHttp = this.http.get(`${this.RATE_HOST}/coin/rates?chain=neo`);
    const ethHttp = this.http.get(`${this.RATE_HOST}/coin/rates?chain=eth`);
    const btcHttp = this.http.get(`${this.RATE_HOST}/coin/rates?chain=btc`);
    const ontHttp = this.http.get(`${this.RATE_HOST}/coin/rates?chain=ont`);
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
