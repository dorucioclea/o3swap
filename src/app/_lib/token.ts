import { NETWORK } from './network';
export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
  chain: CHAINS;
}
export type CHAINS = 'ALL' | 'NEO' | 'ETH' | 'BSC' | 'HECO';

//#region some token
export const SOURCE_TOKEN_SYMBOL = {
  ETH: 'ETH',
  HECO: 'HT',
  BSC: 'BNB',
};
export const ETH_SOURCE_ASSET_HASH = '0x0000000000000000000000000000000000000000';
export const WETH_ASSET_HASH = '0xc778417e063141139fce010982780140aa0cd5ab';
export const ETH_PUSDT_ASSET_HASH = {
  ETH: '0x63799851696CDE43c2305dccd7208a03272BA591',
  BSC: '0x78Ec09343122737925f9839d7794de49FeB6B083',
  HECO: '0xbdd265FC4D5b7E7a937608B91EDAFc38F27E4479',
};
export const FUSDT_ASSET_HASH =
  NETWORK === 'MainNet'
    ? '1aa893170b1babfefba973e9a9183990d792c2a7'
    : 'b55026d49bb5b585e1d2f9820efdc969f4b8cde6';
export const NNEO_TOKEN: Token = {
  assetID:
    NETWORK === 'MainNet'
      ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
      : '17da3881ab2d050fea414c80b3fa8324d756f60e',
  symbol: 'nNEO',
  decimals: 8,
  amount: '0',
  chain: 'NEO',
  logo: '/assets/images/tokens/neo.png',
};
//#endregion

//#region chain tokens
const NEO_TOKENS: Token[] = [
  {
    assetID:
      '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    symbol: 'NEO',
    decimals: 0,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/neo.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
        : '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/neo.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '179a0db04a130dec6060cd9569d7ee7d7e8eccdc'
        : '9b2446d658859a96a7c40204d027bf5f9ca896e5',
    symbol: 'fWETH',
    decimals: 18,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/eth.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '1aa893170b1babfefba973e9a9183990d792c2a7'
        : 'b55026d49bb5b585e1d2f9820efdc969f4b8cde6',
    symbol: 'fUSDT',
    decimals: 6,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '3e09e602eeeb401a2fec8e8ea137d59aae54a139'
        : '806f018810c6f74c22d1b27fe4da2feec7298c58',
    symbol: 'SWTH',
    decimals: 8,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/swth.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '4d9eab13620fe3569ba3b0e56e2877739e4145e3'
        : '083ea8071188c7fe5b5e4af96ded222670d76663',
    symbol: 'FLM',
    decimals: 8,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/flm.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? 'c277117879af3197fbef92c71e95800aa3b89d9a'
        : '658cabf9c1f71ba0fa64098a7c17e52b94046ece',
    symbol: 'pONT',
    decimals: 9,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/ont.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '36a8f669d55bbfe99a3e9f7953745736bfa5453c'
        : 'aa94bb6ff87660da94bbe57c34e0373163b7ac93',
    symbol: 'fWBTC',
    decimals: 8,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/btc.png',
  },
];
const ETH_TOKENS: Token[] = [
  {
    assetID: ETH_SOURCE_ASSET_HASH,
    symbol: 'ETH',
    decimals: 18,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/eth.png',
  },
  {
    assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID: '0xc778417e063141139fce010982780140aa0cd5ab',
    symbol: 'WETH',
    decimals: 18,
    chain: 'ETH',
    logo: '/assets/images/tokens/eth.png',
    amount: '0',
  },
];
const BSC_TOKENS: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x163f9d7a590e1921c1461bf6ed455b67e7877e95',
    symbol: 'BETH',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/eth.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
];
const HECO_TOKENS: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];
const ALL: Token[] = [
  {
    assetID: ETH_SOURCE_ASSET_HASH,
    symbol: 'ETH',
    decimals: 18,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/eth.png',
  },
  {
    assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
        : '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    chain: 'NEO',
    logo: '/assets/images/tokens/neo.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];
// 只在接口出问题时使用
export const CHAIN_TOKENS = {
  ALL,
  NEO: NEO_TOKENS,
  ETH: ETH_TOKENS,
  BSC: BSC_TOKENS,
  HECO: HECO_TOKENS,
};
//#endregion

//#region liquidity page
export const USD_TOKENS: Token[] = [
  {
    assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'BUSD',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
  },
];
export const LP_TOKENS: Token[] = [
  {
    assetID: '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/lp.png',
  },
  {
    assetID: '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/lp.png',
  },
  {
    assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    chain: 'HECO',
    logo: '/assets/images/tokens/lp.png',
  },
];
//#endregion
