import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AssetQueryResponse,
  CommonHttpResponse,
  CROSS_CHAIN_SWAP_DETAIL_HOST,
  UTXO_HOST,
  Token,
  TxProgress,
  NNEO_TOKEN,
  CHAIN_TOKENS,
  NETWORK,
  POLY_HOST,
  ETH_PUSDT_ASSET,
  SWAP_CONTRACT_CHAIN_ID,
  POLY_HOST_ADDRESS,
  ETH_SOURCE_ASSET_HASH,
  INQUIRY_HOST,
  USD_TOKENS,
  O3_AGGREGATOR_FEE,
  O3_AGGREGATOR_SLIPVALUE,
  FUSDT_ASSET_HASH,
  WETH_ASSET_HASH,
  LP_TOKENS,
  UPDATE_CHAIN_TOKENS,
  ChainTokens,
} from '@lib';
import BigNumber from 'bignumber.js';
import { CommonService } from '../util/common.service';
import { SwapService } from '../util/swap.service';
import { Store } from '@ngrx/store';

interface State {
  tokens: any;
}

@Injectable()
export class ApiService {
  apiDo = environment.apiDomain;
  RATE_HOST = 'https://hub.o3.network/v1';

  tokens$: Observable<any>;
  chainTokens = new ChainTokens();

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private swapService: SwapService,
    private store: Store<State>
  ) {
    this.getTokens();
  }

  //#region home
  postEmail(email: string): Observable<any> {
    return this.http.post(`https://subscribe.o3swap.com/subscribe`, { email });
  }
  //#endregion

  //#region o3 api
  async getTokens(): Promise<void> {
    let apiTokens = await this.http
      .get(`${INQUIRY_HOST}/v1/tokens/all`)
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success') {
            return res.data;
          }
        })
      )
      .toPromise();
    if (!apiTokens) {
      apiTokens = CHAIN_TOKENS;
    }
    Object.keys(apiTokens).forEach((key) => {
      apiTokens[key] = apiTokens[key].map((item) => {
        let chainLowerCase = (item.chain as string).toLowerCase();
        if (item.chain === 'NEO') {
          chainLowerCase = 'neo2';
        }
        return {
          symbol: item.symbol,
          logo: `https://img.o3.network/logo/${chainLowerCase}/${item.address}.png`,
          assetID: item.address,
          amount: '0',
          decimals: item.decimals,
          chain: item.chain,
          maxAmount: item.max_amount,
        };
      });
    });
    apiTokens.ALL = apiTokens.recommend;
    delete apiTokens.recommend;
    this.commonService.log(apiTokens);
    this.chainTokens = apiTokens;
    this.store.dispatch({ type: UPDATE_CHAIN_TOKENS, data: apiTokens });
  }

  getRates(): Observable<any> {
    return this.http.get(`${this.RATE_HOST}/crypto/rates`).pipe(
      map((res: CommonHttpResponse) => {
        if (res.status === 'success') {
          return res.data;
        }
      })
    );
  }

  async getSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<AssetQueryResponse> {
    if (fromToken.chain === 'NEO' && toToken.chain === 'NEO') {
      if (
        (fromToken.symbol === 'NEO' && toToken.symbol === 'nNEO') ||
        (fromToken.symbol === 'nNEO' && toToken.symbol === 'NEO')
      ) {
        return this.getNeoNNeoSwapPath(fromToken, toToken, inputAmount);
      }
      return this.getFromNeoSwapPath(fromToken, toToken, inputAmount);
    }
    if (fromToken.chain === 'NEO' && toToken.chain !== 'NEO') {
      return of([]).toPromise();
    }
    this.commonService.log(1);
    if (fromToken.chain === toToken.chain) {
      if (
        (fromToken.symbol === 'ETH' && toToken.symbol === 'WETH') ||
        (fromToken.symbol === 'WETH' && toToken.symbol === 'ETH') ||
        (fromToken.symbol === 'BNB' && toToken.symbol === 'WBNB') ||
        (fromToken.symbol === 'WBNB' && toToken.symbol === 'BNB') ||
        (fromToken.symbol === 'WHT' && toToken.symbol === 'HT') ||
        (fromToken.symbol === 'HT' && toToken.symbol === 'WHT')
      ) {
        return this.getEthWEthSwapPath(fromToken, toToken, inputAmount);
      }
      const res = await this.getFromEthSwapPath(
        fromToken,
        toToken,
        inputAmount
      );
      return this.handleReceiveSwapPathFiat(res, toToken);
    }
    this.commonService.log(2);
    const fromUsd = USD_TOKENS.find((item) => item.chain === fromToken.chain);
    const toUsd = USD_TOKENS.find((item) => item.chain === toToken.chain);
    if (
      fromUsd.symbol === fromToken.symbol &&
      toUsd.symbol === toToken.symbol
    ) {
      const res = await this.getFromEthCrossChainSwapPath(
        fromToken,
        toToken,
        inputAmount
      );
      return this.handleReceiveSwapPathFiat(res, toToken);
    }
    this.commonService.log(toUsd.symbol);
    this.commonService.log(toToken.symbol);
    if (
      fromUsd.symbol !== fromToken.symbol &&
      toUsd.symbol === toToken.symbol
    ) {
      this.commonService.log(3);
      const res = await this.getFromEthCrossChainAggregatorSwapPath(
        fromToken,
        toToken,
        inputAmount,
        fromUsd
      );
      return this.handleReceiveSwapPathFiat(res, toToken);
    }
    this.commonService.log(4);
    return of([]).toPromise();
  }

  getToStandardSwapPath(
    fromToken: Token,
    inputAmount: string
  ): Promise<string[]> {
    if (NETWORK === 'MainNet') {
      if (fromToken.symbol === 'fUSDT') {
        return of([FUSDT_ASSET_HASH]).toPromise();
      }
      return this.getToStandardSwapPathReq(
        fromToken,
        FUSDT_ASSET_HASH,
        inputAmount
      );
    } else {
      if (fromToken.symbol === 'nNEO') {
        return of([NNEO_TOKEN.assetID]).toPromise();
      }
      return this.getToStandardSwapPathReq(
        fromToken,
        NNEO_TOKEN.assetID,
        inputAmount
      );
    }
  }
  //#endregion

  //#region neo nneo swap
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
  //#endregion

  //#region poly api
  getBridgeAmountOut(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<string> {
    const fromPUsdt = ETH_PUSDT_ASSET[fromToken.chain].assetID;
    const toPUsdt = ETH_PUSDT_ASSET[toToken.chain].assetID;
    const amount = this.commonService.decimalToInteger(
      inputAmount,
      fromToken.decimals
    );
    return this.http
      .get(
        `${POLY_HOST}/calcOutGivenIn/${POLY_HOST_ADDRESS}/${fromPUsdt}/${toPUsdt}/${amount}`
      )
      .pipe(
        map((res: any) => {
          if (res.code === 200 && res.amount_out) {
            return new BigNumber(res.amount_out)
              .shiftedBy(-toToken.decimals)
              .toFixed();
          }
        })
      )
      .toPromise();
  }

  // getFromEthPoolFeeRate(): Promise<string> {
  //   return this.http
  //     .get(`${POLY_HOST}/swapFee/${POLY_HOST_ADDRESS}`)
  //     .pipe(
  //       map((res: any) => {
  //         if (res.code === 200) {
  //           return new BigNumber(res.fee).shiftedBy(-10).toFixed();
  //         }
  //       })
  //     )
  //     .toPromise();
  // }

  getCrossChainSwapDetail(hash: string): Observable<TxProgress> {
    hash = this.commonService.remove0xHash(hash);
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

  getFromEthPolyFee(fromToken: Token, toToken: Token): Promise<string> {
    return this.http
      .post(`${CROSS_CHAIN_SWAP_DETAIL_HOST}/getfee`, {
        SrcChainId: SWAP_CONTRACT_CHAIN_ID[fromToken.chain],
        Hash: this.commonService.remove0xHash(ETH_SOURCE_ASSET_HASH),
        DstChainId: SWAP_CONTRACT_CHAIN_ID[toToken.chain],
      })
      .pipe(
        map((res: any) => {
          if (res.TokenAmount) {
            return res.TokenAmount;
          }
        })
      )
      .toPromise();
  }
  //#endregion

  //#region bridge page
  /**
   * @description: Input USDT get LP, pool add LP
   * @param fromToken fromToken
   * @param amount amount
   * @return Promise
   */
  getPoolOutGivenSingleIn(fromToken: Token, amount: string): Promise<string> {
    const poolPUsdtHash = ETH_PUSDT_ASSET[fromToken.chain].assetID;
    const lpToken = LP_TOKENS.find((item) => item.chain === fromToken.chain);
    amount = new BigNumber(amount).shiftedBy(fromToken.decimals).toFixed();
    return this.http
      .get(
        `${POLY_HOST}/calcPoolOutGivenSingleIn/${POLY_HOST_ADDRESS}/${poolPUsdtHash}/${amount}`
      )
      .pipe(
        map((res: any) => {
          if (res.code === 200) {
            return new BigNumber(res.pool_amount_out)
              .shiftedBy(-lpToken.decimals)
              .toFixed();
          }
        })
      )
      .toPromise();
  }

  /**
   * @description: Input USDT get LP, pool remove LP
   * @param fromTokenn fromToken
   * @param amount USDT amount
   * @return Promise Out
   */
  getPoolInGivenSingleOut(fromToken: Token, amount: string): Promise<string> {
    const poolPUsdtHash = ETH_PUSDT_ASSET[fromToken.chain].assetID;
    const lpToken = LP_TOKENS.find((item) => item.chain === fromToken.chain);
    amount = new BigNumber(amount).shiftedBy(fromToken.decimals).toFixed();
    return this.http
      .get(
        `${POLY_HOST}/calcPoolInGivenSingleOut/${POLY_HOST_ADDRESS}/${poolPUsdtHash}/${amount}`
      )
      .pipe(
        map((res: any) => {
          if (res.code === 200) {
            return new BigNumber(res.pool_amount_out)
              .shiftedBy(-lpToken.decimals)
              .toFixed();
          }
        })
      )
      .toPromise();
  }

  /**
   * @description: Input LP get USDT
   * @param fromToken fromToken
   * @param amount LP amount
   * @return promise
   */
  getSingleOutGivenPoolIn(fromToken: Token, amount: string): Promise<string> {
    const poolPUsdtHash = ETH_PUSDT_ASSET[fromToken.chain].assetID;
    const usdtToken = USD_TOKENS.find((item) => item.chain === fromToken.chain);
    amount = new BigNumber(amount).shiftedBy(18).toFixed();
    return this.http
      .get(
        `${POLY_HOST}/calcSingleOutGivenPoolIn/${POLY_HOST_ADDRESS}/${poolPUsdtHash}/${amount}`
      )
      .pipe(
        map((res: any) => {
          if (res.code === 200) {
            return new BigNumber(res.token_amount_out)
              .shiftedBy(-usdtToken.decimals)
              .toFixed();
          }
        })
      )
      .toPromise();
  }

  getPUsdtBalance(assetID: string, decimals: number): Promise<string> {
    return this.http
      .get(`${POLY_HOST}/balance/${POLY_HOST_ADDRESS}/${assetID}`)
      .pipe(
        map((res: any) => {
          if (res.code === 200) {
            return new BigNumber(res.balance).shiftedBy(-decimals).toFixed();
          }
        })
      )
      .toPromise();
  }
  //#endregion

  //#region private functions
  private getNeoNNeoSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<AssetQueryResponse> {
    let result;
    // neo => nneo
    if (fromToken.symbol === 'NEO' && toToken.symbol === 'nNEO') {
      result = [
        {
          amount: [
            inputAmount,
            new BigNumber(inputAmount).shiftedBy(NNEO_TOKEN.decimals).toFixed(),
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
            new BigNumber(inputAmount).shiftedBy(NNEO_TOKEN.decimals).toFixed(),
            inputAmount,
          ],
          swapPath: ['nNEO', 'NEO'],
        },
      ];
    }
    this.commonService.log(result);
    if (result) {
      return of(this.handleReceiveSwapPathFiat(result, toToken)).toPromise();
    }
  }

  private getFromNeoSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<AssetQueryResponse> {
    const amount = this.swapService.getAmountIn(fromToken, inputAmount);
    return this.http
      .post(`${INQUIRY_HOST}/v1/neo/quote`, {
        from: this.commonService.remove0xHash(fromToken.assetID),
        to: this.commonService.remove0xHash(toToken.assetID),
        amount,
      })
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success') {
            const target = [];
            res.data.forEach((item) => {
              const swapPath = this.swapService.getAssetNamePath(
                item.path,
                this.chainTokens[fromToken.chain]
              );
              const temp = {
                amount: item.amounts,
                swapPath,
                assetHashPath: item.path,
                aggregator: item.aggregator,
              };
              target.push(temp);
            });
            return this.handleReceiveSwapPathFiat(target, toToken);
          }
        })
      )
      .toPromise();
  }

  private getEthWEthSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<AssetQueryResponse> {
    // eth <=> weth
    const result = [
      {
        amount: [
          new BigNumber(inputAmount).shiftedBy(fromToken.decimals).toFixed(),
          new BigNumber(inputAmount).shiftedBy(toToken.decimals).toFixed(),
        ],
        swapPath: [fromToken.symbol, toToken.symbol],
      },
    ];
    this.commonService.log(result);
    return of(this.handleReceiveSwapPathFiat(result, toToken)).toPromise();
  }

  private getFromEthSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<AssetQueryResponse> {
    const amount = this.commonService.decimalToInteger(
      inputAmount,
      fromToken.decimals
    );
    let fromAssetHash = fromToken.assetID;
    let toAssetHash = toToken.assetID;
    if (
      fromToken.symbol === WETH_ASSET_HASH[fromToken.chain].standardTokenSymbol
    ) {
      fromAssetHash = WETH_ASSET_HASH[fromToken.chain].assetID;
    }
    if (
      toToken.symbol === WETH_ASSET_HASH[fromToken.chain].standardTokenSymbol
    ) {
      toAssetHash = WETH_ASSET_HASH[fromToken.chain].assetID;
    }
    return this.http
      .post(`${INQUIRY_HOST}/v1/${fromToken.chain.toLowerCase()}/quote`, {
        from: this.commonService.add0xHash(fromAssetHash),
        to: this.commonService.add0xHash(toAssetHash),
        amount,
      })
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success') {
            const target = [];
            res.data = res.data.filter(
              (item) =>
                item.aggregator === 'Pancakeswap' ||
                item.aggregator === 'Uniswap' ||
                item.aggregator === 'Mdex-Heco'
            );
            res.data.forEach((item) => {
              const swapPath = this.swapService.getAssetNamePath(
                item.path,
                this.chainTokens[fromToken.chain]
              );
              const temp = {
                amount: item.amounts,
                swapPath,
                assetHashPath: item.path,
                aggregator: item.aggregator,
              };
              if (
                fromToken.symbol ===
                WETH_ASSET_HASH[fromToken.chain].standardTokenSymbol
              ) {
                temp.swapPath.unshift(fromToken.symbol);
              }
              if (
                toToken.symbol ===
                WETH_ASSET_HASH[fromToken.chain].standardTokenSymbol
              ) {
                temp.swapPath.push(toToken.symbol);
              }
              target.push(temp);
            });
            return target;
          }
        })
      )
      .toPromise();
  }

  private async getFromEthCrossChainAggregatorSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string,
    fromUsd: Token
  ): Promise<AssetQueryResponse> {
    const res1 = await this.getFromEthSwapPath(fromToken, fromUsd, inputAmount); // 排序
    for (const res1Item of res1) {
      const amountOutA = res1Item.amount[res1Item.amount.length - 1];
      this.commonService.log(`amountOutA: ${amountOutA}`);
      const amountOutB = this.swapService.getMinAmountOut(
        amountOutA,
        O3_AGGREGATOR_FEE
      );
      this.commonService.log(`amountOutB: ${amountOutB}`);
      let polyAmountIn = this.swapService.getMinAmountOut(
        amountOutB,
        O3_AGGREGATOR_SLIPVALUE
      );
      this.commonService.log(`polyAmountIn: ${polyAmountIn}`);
      polyAmountIn = new BigNumber(polyAmountIn)
        .shiftedBy(-fromUsd.decimals)
        .toFixed();
      const res2 = await this.getFromEthCrossChainSwapPath(
        fromUsd,
        toToken,
        polyAmountIn
      );
      const polyAmountOut = res2[0].amount[1];
      res1Item.amount.push(polyAmountOut);
      res1Item.swapPath.push(toToken.symbol);
    }
    this.commonService.log(res1);
    return res1;
  }

  private getFromEthCrossChainSwapPath(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): Promise<AssetQueryResponse> {
    const fromPUsdt = ETH_PUSDT_ASSET[fromToken.chain].assetID;
    const toPUsdt = ETH_PUSDT_ASSET[toToken.chain].assetID;
    const amount = this.commonService.decimalToInteger(
      inputAmount,
      fromToken.decimals
    );
    return this.http
      .get(
        `${POLY_HOST}/calcOutGivenIn/${POLY_HOST_ADDRESS}/${fromPUsdt}/${toPUsdt}/${amount}`
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
            return result;
          }
        })
      )
      .toPromise();
  }

  private getToStandardSwapPathReq(
    fromToken: Token,
    standardTokenAssetHash: string,
    inputAmount: string
  ): Promise<string[]> {
    const amount = this.swapService.getAmountIn(fromToken, inputAmount);
    return this.http
      .post(`${INQUIRY_HOST}/v1/neo/quote`, {
        from: this.commonService.remove0xHash(fromToken.assetID),
        to: this.commonService.remove0xHash(standardTokenAssetHash),
        amount,
      })
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success') {
            return res.data[0].path;
          } else {
            return [];
          }
        })
      )
      .toPromise();
  }

  private getAssetLogoByName(name: string): string {
    let token;
    for (const key in this.chainTokens) {
      if (this.chainTokens.hasOwnProperty(key)) {
        const tokenList = this.chainTokens[key];
        token = tokenList.find((item) => item.symbol === name);
        if (token) {
          break;
        }
      }
    }
    return token && token.logo;
  }

  private handleReceiveSwapPathFiat(
    swapPathArr: AssetQueryResponse,
    toToken: Token
  ): AssetQueryResponse {
    swapPathArr.forEach((item) => {
      item.receiveAmount = item.amount[item.amount.length - 1];
      const endTokenName = item.swapPath[item.swapPath.length - 1];
      if (typeof toToken !== 'string' && endTokenName !== toToken.symbol) {
        item.swapPath.push(toToken.symbol);
      }
      item.swapPathLogo = [];
      item.swapPath.forEach((name) => {
        item.swapPathLogo.push(this.getAssetLogoByName(name));
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
