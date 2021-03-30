import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonHttpResponse } from '@lib';

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
    return this.http.get(`${this.RATE_HOST}/crypto/rates`).pipe(
      map((res: CommonHttpResponse) => {
        const rates: any = { pnUSDT: 1 };
        if (res.status === 'success') {
          rates.nNEO = res.data.neo2.neo.price;
          rates.FLM = res.data.neo2.flm.price;
          rates.SWTH = res.data.neo2.swth.price;
          rates.fWETH = res.data.eth.eth.price;
          rates.pnWBTC = res.data.btc.btc.price;
          rates.pONT = res.data.ont.ont.price;
        }
        return rates;
      })
    );
  }
}
