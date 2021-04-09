import { Token } from '@lib';
import { NETWORK } from './network';

export const USDT_TOKEN: Token[] = [
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    rateName: 'usdt',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
    atNeoAssetName: 'pnUSDT',
  }
];

const BUSD_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    rateName: 'usdt',
    logo: '/assets/images/tokens/usdt.png',
  }
];

const HUSD_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '77e8eBD5B2D7cD984e6Ae05a809409c795Bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    rateName: 'usdt',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  }
];

const USD_TOKENS: Token[] = [
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    rateName: 'usdt',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
    atNeoAssetName: 'pnUSDT',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    rateName: 'usdt',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '77e8eBD5B2D7cD984e6Ae05a809409c795Bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    rateName: 'usdt',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  }
];


export const CHAIN_USD_TOKENS = {
  ETH: USDT_TOKEN,
  BSC: BUSD_TOKEN,
  HECO: HUSD_TOKEN,
  USD: USD_TOKENS,
};
