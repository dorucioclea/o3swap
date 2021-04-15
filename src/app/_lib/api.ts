import { NETWORK } from './network';

// 主网后续要改!!!!
export const CROSS_CHAIN_SWAP_DETAIL_HOST =
  NETWORK === 'MainNet'
    ? 'https://bridge.poly.network/testnet/v1'
    : 'https://bridge.poly.network/testnet/v1';

export const UTXO_HOST =
  NETWORK === 'MainNet'
    ? 'https://fapi.ngd.network/api/web'
    : 'http://52.230.21.178:10020/web';

// 主网后续要改!!!!!!!
export const POLY_HOST =
  NETWORK === 'MainNet'
    ? 'http://138.91.6.226:9999'
    : 'http://138.91.6.226:9999';

export const INQUIRY_HOST =
  NETWORK === 'MainNet'
    ? 'https://aggregator.api.o3swap.com'
    : 'http://47.110.14.167:8081';
