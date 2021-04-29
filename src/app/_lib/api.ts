import { NETWORK } from './network';
import { environment } from '@env/environment';

export const CROSS_CHAIN_SWAP_DETAIL_HOST =
  NETWORK === 'MainNet'
    ? 'https://bridge.poly.network/v1'
    : 'https://bridge.poly.network/testnet/v1';

export const UTXO_HOST =
  NETWORK === 'MainNet'
    ? 'https://fapi.ngd.network/api/web'
    : 'http://52.230.21.178:10020/web';

export const POLY_HOST =
  NETWORK === 'MainNet'
    ? 'https://swap.poly.network'
    : 'http://138.91.6.226:9999';

let inquiryHost;
if (environment.testSite) {
  inquiryHost =
    NETWORK === 'MainNet'
      ? 'http://47.110.14.167:8081'
      : 'http://47.110.14.167:8082';
} else {
  inquiryHost =
    NETWORK === 'MainNet'
      ? 'https://aggregator.api.o3swap.com'
      : 'http://47.110.14.167:8082';
}

export const INQUIRY_HOST = inquiryHost;

export const NEOLINE_TX_HOST = 'https://api.neoline.io';
export const O3_TX_HOST = 'https://hub.o3.network';

export const ETH_RPC_HOST =
  NETWORK === 'MainNet'
    ? 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
    : 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

export const BSC_RPC_HOST =
  NETWORK === 'MainNet'
    ? 'https://bsc-dataseed1.binance.org:443'
    : 'https://data-seed-prebsc-1-s1.binance.org:8545';

export const HECO_RPC_HOST =
  NETWORK === 'MainNet'
    ? 'https://http-mainnet-node.huobichain.com'
    : 'https://http-testnet.hecochain.com';
