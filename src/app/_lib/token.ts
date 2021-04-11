import { NETWORK } from './network';
export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
  chain: CHAINS;
  rateName: string;
  atNeoAssetName?: string;
  sourceTokenSymbol?: string;
}

export const ETH_SOURCE_CONTRACT_HASH = '0000000000000000000000000000000000000000';

const MIX_NEO_TOKENS: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet'
        ? '0df563008be710f3e0130208f8adc95ed7e5518d'
        : '23535b6fd46b8f867ed010bab4c2bd8ef0d0c64f',
    symbol: 'pnWETH',
    decimals: 18,
    amount: '0',
    rateName: 'eth',
    chain: 'NEO',
    logo: '/assets/images/tokens/eth.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '282e3340d5a1cd6a461d5f558d91bc1dbc02a07b'
        : 'b8f78d43ea9fe006c85a26b9aff67bcf69dd4fe1',
    symbol: 'pnUSDT',
    decimals: 6,
    amount: '0',
    rateName: 'usdt',
    chain: 'NEO',
    logo: '/assets/images/tokens/usdt.png',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '534dcac35b0dfadc7b2d716a7a73a7067c148b37'
        : '69c57a716567a0f6910a0b3c1d4508fa163eb927',
    symbol: 'pnWBTC',
    decimals: 8,
    amount: '0',
    rateName: 'btc',
    chain: 'NEO',
    logo: '/assets/images/tokens/btc.png',
  },
];

export const NEO_TOKENS: Token[] = [
  {
    assetID:
      '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    symbol: 'NEO',
    decimals: 0,
    amount: '0',
    rateName: 'neo',
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
    rateName: 'neo',
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
    rateName: 'eth',
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
    rateName: 'usdt',
    chain: 'NEO',
    logo: '/assets/images/tokens/usdt.png',
  },
  // {
  //   assetID:
  //     '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  //   symbol: 'GAS',
  //   decimals: 8,
  //   amount: '0',
  //   rateName: 'gas',
  //   chain: 'NEO',
  //   logo: '/assets/images/tokens/gas.png',
  // },
  {
    assetID:
      NETWORK === 'MainNet'
        ? '3e09e602eeeb401a2fec8e8ea137d59aae54a139'
        : '806f018810c6f74c22d1b27fe4da2feec7298c58',
    symbol: 'SWTH',
    decimals: 8,
    amount: '0',
    rateName: 'swth',
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
    rateName: 'flm',
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
    rateName: 'ont',
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
    rateName: 'btc',
    chain: 'NEO',
    logo: '/assets/images/tokens/btc.png',
  },
];

export const ALL_NEO_TOKENS: Token[] = [...NEO_TOKENS, ...MIX_NEO_TOKENS];

const ETH_TOKENS: Token[] = [
  {
    assetID: ETH_SOURCE_CONTRACT_HASH,
    symbol: 'ETH',
    decimals: 18,
    amount: '0',
    chain: 'ETH',
    rateName: 'eth',
    logo: '/assets/images/tokens/eth.png',
    atNeoAssetName: 'pnWETH',
    sourceTokenSymbol: 'ETH',
  },
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    rateName: 'usdt',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
    atNeoAssetName: 'pnUSDT',
    sourceTokenSymbol: 'ETH',
  },
];

const BSC_TOKENS: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '163f9d7a590e1921c1461bf6ed455b67e7877e95',
    symbol: 'BETH',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    rateName: 'eth',
    logo: '/assets/images/tokens/eth.png',
    sourceTokenSymbol: 'BNB',
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
    sourceTokenSymbol: 'BNB',
  },
];

const HECO_TOKENS: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '77e8eBD5B2D7cD984e6Ae05a809409c795Bf9b04',
    symbol: 'HUSD',
    decimals: 18,
    amount: '0',
    rateName: 'usdt',
    logo: '/assets/images/tokens/usdt.png',
    chain: 'HECO',
    sourceTokenSymbol: 'HT',
  },
];

const ALL: Token[] = [
  {
    assetID: ETH_SOURCE_CONTRACT_HASH,
    symbol: 'ETH',
    decimals: 18,
    amount: '0',
    chain: 'ETH',
    rateName: 'eth',
    logo: '/assets/images/tokens/eth.png',
    atNeoAssetName: 'pnWETH',
    sourceTokenSymbol: 'ETH',
  },
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    rateName: 'usdt',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
    atNeoAssetName: 'pnUSDT',
    sourceTokenSymbol: 'ETH',
  },
  {
    assetID:
      NETWORK === 'MainNet'
        ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
        : '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    rateName: 'neo',
    chain: 'NEO',
    logo: '/assets/images/tokens/neo.png',
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
    sourceTokenSymbol: 'BNB',
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
    sourceTokenSymbol: 'HT',
  },
];

export const USD_TOKENS: Token[] = [
  {
    assetID: '74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    rateName: 'usdt',
    chain: 'ETH',
    logo: '/assets/images/tokens/usdt.png',
    atNeoAssetName: 'pnUSDT',
    sourceTokenSymbol: 'ETH',
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
    sourceTokenSymbol: 'BNB',
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
    sourceTokenSymbol: 'HT',
  },
];

const LP_TOKENS: Token[] = [
  {
    assetID: '0xD5d63Dce45E0275Ca76a8b2e9BD8C11679A57D0D',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    rateName: 'pLP',
    chain: 'ETH',
    logo: '/assets/images/tokens/lp.png',
  },
  {
    assetID: '0xD5d63Dce45E0275Ca76a8b2e9BD8C11679A57D0D',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    rateName: 'pLP',
    chain: 'BSC',
    logo: '/assets/images/tokens/lp.png',
  },
  {
    assetID: '0x74A7f2A3aFa8B0CB577985663B5811901A860619',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    rateName: 'pLP',
    chain: 'HECO',
    logo: '/assets/images/tokens/lp.png',
  },
];

export const CHAIN_TOKENS = {
  ALL,
  NEO: NEO_TOKENS,
  ETH: ETH_TOKENS,
  BSC: BSC_TOKENS,
  HECO: HECO_TOKENS,
  USD: USD_TOKENS,
  LP: LP_TOKENS,
  MIX_NEO_TOKENS,
};

export type CHAINS = 'ALL' | 'NEO' | 'ETH' | 'BSC' | 'HECO';

export const CrossChainToToken: Token = {
  assetID: ETH_SOURCE_CONTRACT_HASH,
  symbol: 'ETH',
  decimals: 18,
  amount: '0',
  chain: 'ETH',
  rateName: 'eth',
  logo: '/assets/images/tokens/eth.png',
  atNeoAssetName: 'pnWETH',
};

export const NNEO_TOKEN: Token[] = [
  {
    assetID:
      NETWORK === 'MainNet'
        ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
        : '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    rateName: 'neo',
    chain: 'NEO',
    logo: '/assets/images/tokens/neo.png',
  },
];

export const ETH_PUSDT = {
  ETH: '0x63799851696CDE43c2305dccd7208a03272BA591',
  BSC: '0x78Ec09343122737925f9839d7794de49FeB6B083',
  HECO: '0xbdd265FC4D5b7E7a937608B91EDAFc38F27E4479',
};
