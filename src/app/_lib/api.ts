import { NETWORK } from './network';

export const INQUIRY_HOST =
  NETWORK === 'MainNet'
    ? 'https://neo-asset-router.o3swap.com/AssetQuery'
    : 'http://47.110.14.167:5002/AssetQuery';

export const CROSS_CHAIN_SWAP_DETAIL_HOST =
  NETWORK === 'MainNet'
    ? 'https://explorer.poly.network'
    : 'https://explorer.poly.network/testnet';

export const UTXO_HOST =
  NETWORK === 'MainNet'
    ? 'https://fapi.ngd.network/api/web'
    : 'http://52.230.21.178:10020/web';
