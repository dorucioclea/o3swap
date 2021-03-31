export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
  chain: CHAINS;
  atNeoAssetName?: string;
}

export const ALL_NEO_TOKENS: Token[] = [
  // {
  //   assetID:
  //     '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
  //   symbol: 'NEO',
  //   decimals: 0,
  //   amount: '0',
  //   logo: '/assets/images/tokens/NEO.png',
  // },
  {
    assetID: '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/nNEO.png',
    chain: 'NEO',
  },
  {
    assetID: '23535b6fd46b8f867ed010bab4c2bd8ef0d0c64f',
    symbol: 'pnWETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/pnWETH.png',
    chain: 'NEO',
  },
  {
    assetID: '9b2446d658859a96a7c40204d027bf5f9ca896e5',
    symbol: 'fWETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/fWETH.png',
    chain: 'NEO',
  },
  {
    assetID: 'b8f78d43ea9fe006c85a26b9aff67bcf69dd4fe1',
    symbol: 'pnUSDT',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/pnUSDT.png',
    chain: 'NEO',
  },
  {
    assetID: 'b55026d49bb5b585e1d2f9820efdc969f4b8cde6',
    symbol: 'fUSDT',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/fUSDT.png',
    chain: 'NEO',
  },
  // {
  //   assetID:
  //     '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  //   symbol: 'GAS',
  //   decimals: 8,
  //   amount: '0',
  //   logo: '/assets/images/tokens/GAS.png',
  // chain: 'NEO'
  // },
  {
    assetID: '806f018810c6f74c22d1b27fe4da2feec7298c58',
    symbol: 'SWTH',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/SWTH.png',
    chain: 'NEO',
  },
  {
    assetID: '083ea8071188c7fe5b5e4af96ded222670d76663',
    symbol: 'FLM',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/FLM.png',
    chain: 'NEO',
  },
  {
    assetID: '658cabf9c1f71ba0fa64098a7c17e52b94046ece',
    symbol: 'pONT',
    decimals: 9,
    amount: '0',
    logo: '/assets/images/tokens/pONT.png',
    chain: 'NEO',
  },
  {
    assetID: '69c57a716567a0f6910a0b3c1d4508fa163eb927',
    symbol: 'pnWBTC',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/pnWBTC.png',
    chain: 'NEO',
  },
  {
    assetID: 'aa94bb6ff87660da94bbe57c34e0373163b7ac93',
    symbol: 'fWBTC',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/fWBTC.png',
    chain: 'NEO',
  },
];

export const NEO_TOKENS: Token[] = [
  // {
  //   assetID:
  //     '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
  //   symbol: 'NEO',
  //   decimals: 0,
  //   amount: '0',
  //   logo: '/assets/images/tokens/NEO.png',
  // },
  {
    assetID: '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/nNEO.png',
    chain: 'NEO',
  },
  {
    assetID: '9b2446d658859a96a7c40204d027bf5f9ca896e5',
    symbol: 'fWETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/fWETH.png',
    chain: 'NEO',
  },
  {
    assetID: 'b55026d49bb5b585e1d2f9820efdc969f4b8cde6',
    symbol: 'fUSDT',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/fUSDT.png',
    chain: 'NEO',
  },
  // {
  //   assetID:
  //     '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  //   symbol: 'GAS',
  //   decimals: 8,
  //   amount: '0',
  //   logo: '/assets/images/tokens/GAS.png',
  // chain: 'NEO'
  // },
  {
    assetID: '806f018810c6f74c22d1b27fe4da2feec7298c58',
    symbol: 'SWTH',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/SWTH.png',
    chain: 'NEO',
  },
  {
    assetID: '083ea8071188c7fe5b5e4af96ded222670d76663',
    symbol: 'FLM',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/FLM.png',
    chain: 'NEO',
  },
  {
    assetID: '658cabf9c1f71ba0fa64098a7c17e52b94046ece',
    symbol: 'pONT',
    decimals: 9,
    amount: '0',
    logo: '/assets/images/tokens/pONT.png',
    chain: 'NEO',
  },
  {
    assetID: 'aa94bb6ff87660da94bbe57c34e0373163b7ac93',
    symbol: 'fWBTC',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/fWBTC.png',
    chain: 'NEO',
  },
];

const ETH_TOKENS: Token[] = [
  {
    assetID: '0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/ETH.png',
    chain: 'ETH',
    atNeoAssetName: 'pnWETH',
  },
  {
    assetID: '6ee856ae55b6e1a249f04cd3b947141bc146273c',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/USDT.png',
    chain: 'ETH',
    atNeoAssetName: 'pnUSDT',
  },
];

const BSC_TOKENS: Token[] = [
  {
    assetID: '163f9d7a590e1921c1461bf6ed455b67e7877e95',
    symbol: 'BETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/BETH.png',
    chain: 'BSC',
  },
  {
    assetID: '8301f2213c0eed49a7e28ae4c3e91722919b8b47',
    symbol: 'BUSD',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/BUSD.png',
    chain: 'BSC',
  },
];

const HECO_TOKENS: Token[] = [
  {
    assetID: 'f58e4a9d111fba6f74f0eedaa275fb5a6806d67b',
    symbol: 'HUSD',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/HUSD.png',
    chain: 'HECO',
  },
];

const ALL: Token[] = [
  {
    assetID: '0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/ETH.png',
    chain: 'ETH',
    atNeoAssetName: 'pnWETH',
  },
  {
    assetID: '6ee856ae55b6e1a249f04cd3b947141bc146273c',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/USDT.png',
    chain: 'ETH',
    atNeoAssetName: 'pnUSDT',
  },
  {
    assetID: '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/nNEO.png',
    chain: 'NEO',
  },
  // {
  //   assetID: '8301f2213c0eed49a7e28ae4c3e91722919b8b47',
  //   symbol: 'BUSD',
  //   decimals: 6,
  //   amount: '0',
  //   logo: '/assets/images/tokens/BUSD.png',
  //   chain: 'BSC',
  // },
  // {
  //   assetID: 'f58e4a9d111fba6f74f0eedaa275fb5a6806d67b',
  //   symbol: 'HUSD',
  //   decimals: 8,
  //   amount: '0',
  //   logo: '/assets/images/tokens/HUSD.png',
  //   chain: 'HECO',
  // },
];

export const CHAIN_TOKENS = {
  ALL,
  NEO: NEO_TOKENS,
  ETH: ETH_TOKENS,
  BSC: BSC_TOKENS,
  HECO: HECO_TOKENS,
};

export type CHAINS = 'ALL' | 'NEO' | 'ETH' | 'BSC' | 'HECO';

export const CrossChainToToken: Token = {
  assetID: '0000000000000000000000000000000000000000',
  symbol: 'ETH',
  decimals: 18,
  amount: '0',
  logo: '/assets/images/tokens/ETH.png',
  chain: 'ETH',
  atNeoAssetName: 'pnWETH',
};
