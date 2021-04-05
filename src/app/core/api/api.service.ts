import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AssetQueryResponse,
  CommonHttpResponse,
  CROSS_CHAIN_SWAP_DETAIL_HOST,
  INQUIRY_HOST,
  UTXO_HOST,
  Token,
  TxProgress,
  NNEO_TOKEN,
  ALL_NEO_TOKENS,
  CHAIN_TOKENS,
  NEOLINE_NETWORK,
} from '@lib';
import BigNumber from 'bignumber.js';
import { CommonService } from '../util/common.service';
import { SwapService } from '../util/swap.service';

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;
  RATE_HOST = 'https://hub.o3.network/v1';

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private swapService: SwapService
  ) {}

  postEmail(email: string): Observable<any> {
    return this.http.post(`https://subscribe.o3swap.com/subscribe`, { email });
  }

  getUtxo(address: string, amount: string): Promise<any> {
    return this.http
      .post(`${UTXO_HOST}/utxo`, {
        address,
        neoVal: amount,
      })
      .pipe(
        map((res: any) => {
          if (res.status === 'ok' && res.result) {
            let sum = 0;
            const utxoList = res.result.map((item) => {
              sum += item.amount;
              return {
                txid: item.txid,
                index: item.n,
              };
            });
            return { utxoList, sum };
          }
          return false;
        })
      )
      .toPromise();
  }

  getCrossChainSwapDetail(hash: string): Observable<TxProgress> {
    if (hash.startsWith('0x')) {
      hash = hash.slice(2);
    }
    return this.http
      .get(`${CROSS_CHAIN_SWAP_DETAIL_HOST}/api/v1/getcrosstx?txhash=${hash}`)
      .pipe(
        map((res: any) => {
          const target: TxProgress = {
            step1: { hash: '', status: 1 },
            step2: { hash: '', status: 0 },
            step3: { hash: '', status: 0 },
          };
          if (res.desc === 'success' && res.result) {
            const data = JSON.parse(res.result);
            if (data.fchaintx && data.fchaintx.txhash) {
              target.step1.hash = data.fchaintx.txhash;
              target.step1.status = 2;
            }
            if (data.mchaintx && data.mchaintx.txhash) {
              target.step2.hash = data.mchaintx.txhash;
              target.step2.status = 2;
            }
            if (data.tchaintx && data.tchaintx.txhash) {
              target.step3.hash = data.tchaintx.txhash;
              target.step3.status = 2;
            }
            if (target.step1.status === 2 && target.step2.status === 0) {
              target.step2.status = 1;
            }
            if (target.step2.status === 2 && target.step3.status === 0) {
              target.step3.status = 1;
            }
          }
          return target;
        })
      );
  }

  getSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Observable<AssetQueryResponse> {
    let noRequestRes;
    // neo => nneo
    if (fromToken.symbol === 'NEO' && toToken.symbol === 'nNEO') {
      noRequestRes = [
        {
          amount: [
            inputAmount,
            new BigNumber(inputAmount)
              .shiftedBy(NNEO_TOKEN[0].decimals)
              .toFixed(),
          ],
          swapPath: ['NEO', 'nNEO'],
        },
      ];
    }
    // nneo => neo
    if (fromToken.symbol === 'nNEO' && toToken.symbol === 'NEO') {
      noRequestRes = [
        {
          amount: [
            new BigNumber(inputAmount)
              .shiftedBy(NNEO_TOKEN[0].decimals)
              .toFixed(),
            inputAmount,
          ],
          swapPath: ['nNEO', 'NEO'],
        },
      ];
    }
    if (fromToken.chain !== 'NEO' && toToken.chain !== 'NEO') {
      noRequestRes = [
        {
          amount: [
            new BigNumber(inputAmount).shiftedBy(fromToken.decimals).toFixed(),
            new BigNumber(inputAmount).shiftedBy(fromToken.decimals).toFixed(),
          ],
          swapPath: [fromToken.symbol, toToken.symbol],
        },
      ];
    }
    this.commonService.log(noRequestRes);
    if (noRequestRes) {
      return of(this.handleReceiveSwapPathFiat(noRequestRes, toToken));
    }
    // swap from neo
    let toAssetName: string;
    toAssetName = toToken.symbol;
    if (toToken.chain !== 'NEO') {
      toAssetName = toToken.atNeoAssetName;
    }
    const amount = this.swapService.getAmountIn(fromToken, inputAmount);
    return this.http
      .post(
        `${INQUIRY_HOST}?StartAsset=${fromToken.symbol}&EndAsset=${toAssetName}&amount=${amount}`,
        null
      )
      .pipe(
        map((res: AssetQueryResponse) => {
          if (res.length > 0) {
            return this.handleReceiveSwapPathFiat(res, toToken);
          } else {
            return [];
          }
        })
      );
  }

  getToStandardSwapPath(
    fromToken: Token,
    inputAmount: string
  ): Promise<string[]> {
    if (NEOLINE_NETWORK === 'MainNet') {
      if (fromToken.symbol === 'fUSDT') {
        return of(['fUSDT']).toPromise();
      }
      return this.getToStandardSwapPathReq(fromToken, 'fUSDT', inputAmount);
    } else {
      if (fromToken.symbol === 'nNEO') {
        return of(['nNEO']).toPromise();
      }
      return this.getToStandardSwapPathReq(fromToken, 'nNEO', inputAmount);
    }
  }

  getRates(): Observable<any> {
    return this.http.get(`${this.RATE_HOST}/crypto/rates`).pipe(
      map((res: CommonHttpResponse) => {
        const rates: any = { usdt: 1 };
        if (res.status === 'success') {
          rates.neo = res.data.neo2.neo.price;
          rates.flm = res.data.neo2.flm.price;
          rates.swth = res.data.neo2.swth.price;
          rates.eth = res.data.eth.eth.price;
          rates.ont = res.data.ont.ont.price;
        }
        return rates;
      })
    );
  }

  //#region
  private getToStandardSwapPathReq(
    fromToken: Token,
    toAssetName: string,
    inputAmount: string
  ): Promise<string[]> {
    const amount = this.swapService.getAmountIn(fromToken, inputAmount);
    return this.http
      .post(
        `${INQUIRY_HOST}?StartAsset=${fromToken.symbol}&EndAsset=${toAssetName}&amount=${amount}`,
        null
      )
      .pipe(
        map((res: AssetQueryResponse) => {
          if (res.length > 0) {
            return res[0].swapPath;
          } else {
            return [];
          }
        })
      )
      .toPromise();
  }

  private getNeoAssetLogoByName(name: string): string {
    const token1 = ALL_NEO_TOKENS.find((item) => item.symbol === name);
    const token2 = CHAIN_TOKENS.ETH.find((item) => item.symbol === name);
    const token3 = CHAIN_TOKENS.BSC.find((item) => item.symbol === name);
    const token4 = CHAIN_TOKENS.HECO.find((item) => item.symbol === name);
    const token = token1 || token2 || token3 || token4;
    return token && token.logo;
  }

  private handleReceiveSwapPathFiat(
    swapPathArr: AssetQueryResponse,
    toToken: Token | string
  ): AssetQueryResponse {
    swapPathArr.forEach((item) => {
      item.receiveAmount = item.amount[item.amount.length - 1];
      const endTokenName = item.swapPath[item.swapPath.length - 1];
      if (typeof toToken !== 'string' && endTokenName !== toToken.symbol) {
        item.swapPath.push(toToken.symbol);
      }
      item.swapPathLogo = [];
      item.swapPath.forEach((name) => {
        item.swapPathLogo.push(this.getNeoAssetLogoByName(name));
      });
    });
    return this.shellSortSwapPath(swapPathArr);
  }

  private shellSortSwapPath(arr: any[]): any[] {
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
  //#endregion
}
