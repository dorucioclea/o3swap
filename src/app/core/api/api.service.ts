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
  NETWORK,
  POLY_HOST,
  ETH_PUSDT,
  SWAP_CONTRACT_CHAIN_ID,
} from '@lib';
import BigNumber from 'bignumber.js';
import { CommonService } from '../util/common.service';
import { SwapService } from '../util/swap.service';

@Injectable()
export class ApiService {
  CHAIN_TOKENS: any = CHAIN_TOKENS;
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

  getTokens(): void {
    this.http.get('https://o3swap.com/pairs.json').subscribe((res) => {
      Object.keys(res).forEach((key) => {
        res[key] = res[key].map((item) => {
          return {
            symbol: item.symbol,
            logo: item.url,
            assetID: item.contract,
            amount: '0',
            decimals: item.decimals,
            chain: item.tag,
          };
        });
      });
      this.CHAIN_TOKENS = res;
    });
  }

  getFromEthPoolFee(): Promise<string> {
    return this.http
      .get(`${POLY_HOST}/swapFee/0x16a3Ac9d6682dc4b1bfC02da254379E9F4b37Fed`)
      .pipe(
        map((res: any) => {
          if (res.code === 200) {
            return new BigNumber(res.fee).shiftedBy(-18).toFixed();
          }
        })
      )
      .toPromise();
  }

  getFromEthPolyFee(fromToken: Token, toToken: Token): Promise<string> {
    return this.http
      .post(`${CROSS_CHAIN_SWAP_DETAIL_HOST}/getfee`, {
        SrcChainId: SWAP_CONTRACT_CHAIN_ID[fromToken.chain],
        Hash: fromToken.assetID,
        DstChainId: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      })
      .pipe(
        map((res: any) => {
          if (res.UsdtAmount) {
            return res.UsdtAmount;
          }
        })
      )
      .toPromise();
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
      .post(`${CROSS_CHAIN_SWAP_DETAIL_HOST}/transactionofhash`, { hash })
      .pipe(
        map((res: any) => {
          const target: TxProgress = {
            step1: { hash: '', status: 1 },
            step2: { hash: '', status: 0 },
            step3: { hash: '', status: 0 },
          };
          if (res.TransactionState) {
            const data = res.TransactionState;
            if (data[0].Hash) {
              target.step1.hash = data[0].Hash;
              target.step1.status = 2;
            }
            if (data[1].Hash) {
              target.step2.hash = data[1].Hash;
              target.step2.status = 2;
            }
            if (data[2].Hash) {
              target.step3.hash = data[2].Hash;
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
    if (
      (fromToken.symbol === 'NEO' && toToken.symbol === 'nNEO') ||
      (fromToken.symbol === 'nNEO' && toToken.symbol === 'NEO')
    ) {
      return this.getNeoNNeoSwapPath(fromToken, toToken, inputAmount);
    }
    if (fromToken.chain !== 'NEO' && toToken.chain !== 'NEO') {
      return this.getFromEthCrossChainSwapPath(fromToken, toToken, inputAmount);
    }
    if (fromToken.chain === 'NEO') {
      return this.getFromNeoSwapPath(fromToken, toToken, inputAmount);
    }
  }

  getToStandardSwapPath(
    fromToken: Token,
    inputAmount: string
  ): Promise<string[]> {
    if (NETWORK === 'MainNet') {
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
  private getNeoNNeoSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Observable<AssetQueryResponse> {
    let result;
    // neo => nneo
    if (fromToken.symbol === 'NEO' && toToken.symbol === 'nNEO') {
      result = [
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
      result = [
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
    this.commonService.log(result);
    if (result) {
      return of(this.handleReceiveSwapPathFiat(result, toToken));
    }
  }

  private getFromNeoSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Observable<AssetQueryResponse> {
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

  private getFromEthCrossChainSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Observable<AssetQueryResponse> {
    const fromPUsdt = ETH_PUSDT[fromToken.chain];
    const toPUsdt = ETH_PUSDT[toToken.chain];
    const amount = this.commonService.decimalToInteger(
      inputAmount,
      fromToken.decimals
    );
    return this.http
      .get(
        `${POLY_HOST}/calcOutGivenIn/0x16a3Ac9d6682dc4b1bfC02da254379E9F4b37Fed/${fromPUsdt}/${toPUsdt}/${amount}`
      )
      .pipe(
        map((res: any) => {
          if (res.code === 200) {
            const result: AssetQueryResponse = [
              {
                amount: [
                  new BigNumber(inputAmount)
                    .shiftedBy(fromToken.decimals)
                    .toFixed(),
                  res.amount_out,
                ],
                swapPath: [fromToken.symbol, toToken.symbol],
              },
            ];
            return this.handleReceiveSwapPathFiat(result, toToken);
          }
        })
      );
  }

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
