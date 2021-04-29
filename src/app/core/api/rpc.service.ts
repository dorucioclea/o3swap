import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import {
  NEOLINE_TX_HOST,
  O3_TX_HOST,
  ETH_RPC_HOST,
  BSC_RPC_HOST,
  HECO_RPC_HOST,
  METAMASK_CHAIN_ID,
  CHAINS,
  NETWORK,
  CommonHttpResponse,
  Token,
  ETH_SOURCE_ASSET_HASH,
} from '@lib';
import { CommonService } from '../util/common.service';
import { map } from 'rxjs/operators';
import { rpc } from '@cityofzion/neon-js';
import { BigNumber } from 'bignumber.js';

@Injectable()
export class RpcApiService {
  apiDo = environment.apiDomain;
  headers = { Network: NETWORK.toLowerCase() };

  constructor(private http: HttpClient, private commonService: CommonService) {}

  //#region balances
  getO3TokenBalance(address: string): Promise<any> {
    return this.http
      .get(`${O3_TX_HOST}/v1/neo2/address/assets?address=${address}`, {
        headers: this.headers,
      })
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success') {
            const { nep5, asset } = res.data;
            const targetRes = {};
            if (nep5) {
              nep5.forEach(({ asset_id, symbol, balance }) => {
                targetRes[asset_id] = {
                  assetID: asset_id,
                  symbol,
                  amount: new BigNumber(balance).toFixed(),
                };
              });
            }
            if (asset) {
              asset.forEach(({ asset_id, symbol, balance }) => {
                targetRes[asset_id] = {
                  assetID: asset_id,
                  symbol,
                  amount: balance,
                };
              });
            }
            return targetRes;
          } else {
            return {};
          }
        })
      )
      .toPromise();
  }

  getNeoLineTokenBalance(address: string): Promise<any> {
    return this.http
      .post(
        `${NEOLINE_TX_HOST}/v1/neo2/address/balances`,
        { params: [{ address }] },
        { headers: this.headers }
      )
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success' && res.data) {
            const targetRes = {};
            if (res.data[address]) {
              res.data[address].forEach(({ asset_id, symbol, amount }) => {
                targetRes[asset_id] = {
                  assetID: asset_id,
                  symbol,
                  amount,
                };
              });
            }
            return targetRes;
          } else {
            return {};
          }
        })
      )
      .toPromise();
  }

  getEthTokenBalance(params, token: Token): Promise<any> {
    let method = 'eth_call';
    if (token.assetID === ETH_SOURCE_ASSET_HASH) {
      method = 'eth_getBalance';
    }
    return this.http
      .post(this.getEthRpcHost(token.chain), {
        jsonrpc: '2.0',
        id: METAMASK_CHAIN_ID[token.chain],
        method,
        params,
      })
      .pipe(
        map((response: any) => {
          const balance = response.result;
          if (
            balance &&
            !new BigNumber(balance).isNaN() &&
            new BigNumber(balance).comparedTo(0) > 0
          ) {
            return new BigNumber(balance).shiftedBy(-token.decimals).toFixed();
          }
        })
      )
      .toPromise();
  }
  //#endregion

  //#region transaction
  getNeoLineTxByHash(txHash: string): Promise<any> {
    txHash = this.commonService.add0xHash(txHash);
    return this.http
      .get(`${NEOLINE_TX_HOST}/v1/neo2/transaction/${txHash}`, {
        headers: this.headers,
      })
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success') {
            return res.data;
          } else {
            return null;
          }
        })
      )
      .toPromise();
  }

  getO3TxByHash(txHash: string): Promise<any> {
    txHash = this.commonService.add0xHash(txHash);
    return this.http
      .post(
        `${O3_TX_HOST}/v1/neo2/txids_valid`,
        { txids: [txHash] },
        { headers: this.headers }
      )
      .pipe(
        map((res: CommonHttpResponse) => {
          if (res.status === 'success' && res.data) {
            return res.data[0];
          } else {
            return null;
          }
        })
      )
      .toPromise();
  }

  getEthTxReceipt(txHash: string, chain: CHAINS): Observable<any> {
    return this.http
      .post(this.getEthRpcHost(chain), {
        jsonrpc: '2.0',
        id: METAMASK_CHAIN_ID[chain],
        method: 'eth_getTransactionReceipt',
        params: [this.commonService.add0xHash(txHash)],
      })
      .pipe(
        map((res: any) => {
          if (res.result) {
            return res.result;
          }
        })
      );
  }
  //#endregion

  private getEthRpcHost(chain: CHAINS): string {
    switch (chain) {
      case 'ETH':
        return ETH_RPC_HOST;
      case 'BSC':
        return BSC_RPC_HOST;
      case 'HECO':
        return HECO_RPC_HOST;
    }
  }
}
