import { Token } from '@lib';
import { NETWORK } from './network';

const ETH_TOKEN: Token[] = [
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
];

const BSC_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
];

const HECO_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '77e8eBD5B2D7cD984e6Ae05a809409c795Bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];

const ALL_TOKENS: Token[] = [
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '77e8eBD5B2D7cD984e6Ae05a809409c795Bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];

export const CHAIN_BRIDGE_TOKENS = {
  ETH: ETH_TOKEN,
  BSC: BSC_TOKEN,
  HECO: HECO_TOKEN,
  ALL: ALL_TOKENS,
};
