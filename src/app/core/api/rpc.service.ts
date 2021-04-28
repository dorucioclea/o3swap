import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import {
  NEO_TX_HOST,
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

  constructor(private http: HttpClient, private commonService: CommonService) {}

  getNeoTxByHash(txHash: string): Promise<any> {
    if (NETWORK === 'TestNet') {
      return this.getNeoTxByHashTestnet(txHash);
    }
    return rpc.Query.getRawTransaction(this.commonService.add0xHash(txHash))
      .execute(NEO_TX_HOST)
      .then((res) => res.result);
  }

  getNeoTxByHashTestnet(txHash: string): Promise<any> {
    txHash = this.commonService.add0xHash(txHash);
    return this.http
      .get(`${NEO_TX_HOST}/v1/neo2/transaction/${txHash}`, {
        headers: { Network: NETWORK.toLowerCase() },
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
