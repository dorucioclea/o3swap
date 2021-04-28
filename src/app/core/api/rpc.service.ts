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
} from '@lib';
import { CommonService } from '../util/common.service';
import { map } from 'rxjs/operators';
import { rpc } from '@cityofzion/neon-js';

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

  getEthTxReceipt(txHash: string, chain: CHAINS): Observable<any> {
    let host;
    switch (chain) {
      case 'ETH':
        host = ETH_RPC_HOST;
        break;
      case 'BSC':
        host = BSC_RPC_HOST;
        break;
      case 'HECO':
        host = HECO_RPC_HOST;
        break;
    }
    return this.http
      .post(host, {
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
}
