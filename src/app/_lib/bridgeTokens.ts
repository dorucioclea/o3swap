import { Token } from '@lib';
import { NETWORK } from './network';

const ETH_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet'
        ? '0xdac17f958d2ee523a2206206994597c13d831ec7'
        : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
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
      NETWORK === 'MainNet'
        ? '0xe9e7cea3dedca5984780bafc599bd69add087d56'
        : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: NETWORK === 'MainNet' ? 'BUSD' : 'BUSDT',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
];

const HECO_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet'
        ? '0xa71edc38d189767582c38a3145b5873052c3e47a'
        : '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: NETWORK === 'MainNet' ? 'HUSD' : 'HUSDT',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];

const ALL_TOKENS: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet'
        ? '0xdac17f958d2ee523a2206206994597c13d831ec7'
        : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '0xe9e7cea3dedca5984780bafc599bd69add087d56'
        : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: NETWORK === 'MainNet' ? 'BUSD' : 'BUSDT',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '0xa71edc38d189767582c38a3145b5873052c3e47a'
        : '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: NETWORK === 'MainNet' ? 'HUSD' : 'HUSDT',
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
