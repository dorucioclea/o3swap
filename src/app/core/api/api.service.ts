import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AssetQueryResponse, CommonHttpResponse, Token } from '@lib';
import BigNumber from 'bignumber.js';

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
    toToken: Token | string,
    amount: string
  ): Observable<any> {
    let toAssetName: string;
    if (typeof toToken === 'string') {
      toAssetName = toToken;
    } else {
      toAssetName = toToken.symbol;
      if (toToken.chain !== 'NEO') {
        toAssetName = toToken.atNeoAssetName;
      }
    }
    return this.http
      .post(
        `${this.INQUIRY_HOST}?StartAsset=${fromAssetName}&EndAsset=${toAssetName}&amount=${amount}`,
        null
      )
      .pipe(
        map((res: any) => {
          if (res.length > 0) {
            return this.handleReceiveSwapPathFiat(res, toToken);
          } else {
            return [];
          }
        })
      );
  }

  getRates(): Observable<any> {
    return this.http.get(`${this.RATE_HOST}/crypto/rates`).pipe(
      map((res: CommonHttpResponse) => {
        const rates: any = { pnUSDT: 1, USDT: 1 };
        if (res.status === 'success') {
          rates.nNEO = res.data.neo2.neo.price;
          rates.FLM = res.data.neo2.flm.price;
          rates.SWTH = res.data.neo2.swth.price;
          rates.ETH = res.data.eth.eth.price;
          rates.fWETH = res.data.eth.eth.price;
          rates.pnWBTC = res.data.btc.btc.price;
          rates.pONT = res.data.ont.ont.price;
        }
        return rates;
      })
    );
  }

  handleReceiveSwapPathFiat(
    swapPathArr: AssetQueryResponse,
    toToken: Token | string
  ): AssetQueryResponse {
    swapPathArr.forEach((item) => {
      item.receiveAmount = item.amount[item.amount.length - 1];
      const endTokenName = item.swapPath[item.swapPath.length - 1];
      if (typeof toToken !== 'string' && endTokenName !== toToken.symbol) {
        item.swapPath.push(toToken.symbol);
      }
    });
    return this.shellSortSwapPath(swapPathArr);
  }

  shellSortSwapPath(arr: any[]): any[] {
    const len = arr.length;
    let temp;
    let gap = 1;
    while (gap < len / 3) {
      // 动态定义间隔序列
      gap = gap * 3 + 1;
    }
    for (gap; gap > 0; gap = Math.floor(gap / 3)) {
      for (let i = gap; i < len; i++) {
        temp = arr[i];
        let j;
        for (
          j = i - gap;
          j >= 0 &&
          new BigNumber(arr[j].receiveAmount).comparedTo(
            new BigNumber(temp.receiveAmount)
          ) < 0;
          j -= gap
        ) {
          arr[j + gap] = arr[j];
        }
        arr[j + gap] = temp;
      }
    }
    return arr;
  }
}
