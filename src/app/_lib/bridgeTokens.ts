import { Token } from '@lib';
import { NETWORK } from './network';

const ETH_TOKEN: Token[] = [
  {
    assetID: '74a7f2a3afa8b0cb577985663b5811901a860619',
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
      NETWORK === 'MainNet' ? '' : '74a7f2a3afa8b0cb577985663b5811901a860619',
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
      NETWORK === 'MainNet' ? '' : '77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];

const ALL_TOKENS: Token[] = [
  {
    assetID: '74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
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
