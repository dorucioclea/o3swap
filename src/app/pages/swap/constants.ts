const NEO_TOKENS = [
  {
    assetID:
      '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    symbol: 'NEO',
    decimals: 0,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b.png',
  },
  {
    assetID:
      '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
    symbol: 'GAS',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7.png',
  },
  {
    assetID: 'e8f98440ad0d7a6e76d84fb1c3d3f8a16e162e97',
    symbol: 'EXT',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/e8f98440ad0d7a6e76d84fb1c3d3f8a16e162e97.png',
  },
  {
    assetID: '81c089ab996fc89c468a26c0a88d23ae2f34b5c0',
    symbol: 'EDS',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/81c089ab996fc89c468a26c0a88d23ae2f34b5c0.png',
  },
  {
    assetID: 'a87cc2a513f5d8b4a42432343687c2127c60bc3f',
    symbol: 'MCT',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/a87cc2a513f5d8b4a42432343687c2127c60bc3f.png',
  },
  {
    assetID: 'ab38352559b8b203bde5fddfa0b07d8b2525e132',
    symbol: 'SWTH',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/ab38352559b8b203bde5fddfa0b07d8b2525e132.png',
  },
  {
    assetID: 'c074a05e9dcf0141cbe6b4b3475dd67baf4dcb60',
    symbol: 'CNEO',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/c074a05e9dcf0141cbe6b4b3475dd67baf4dcb60.png',
  },
  {
    assetID: '4d9eab13620fe3569ba3b0e56e2877739e4145e3',
    symbol: 'FLM',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/4d9eab13620fe3569ba3b0e56e2877739e4145e3.png',
  },
];

const ETH_TOKENS = [];

const neoTokensObj = {};
NEO_TOKENS.forEach((token) => {
  neoTokensObj[token.assetID] = token;
});

const ethTokensObj = {};
ETH_TOKENS.forEach((token) => {
  ethTokensObj[token.assetID] = token;
});

export const TOKENS = { neo: NEO_TOKENS, eth: ETH_TOKENS };
export const TOKENS_OBJECT = { neo: neoTokensObj, eth: ethTokensObj };

export const DEFAULT_FROM_TOKEN = {
  assetID: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
  symbol: 'NEO',
  decimals: 0,
  amount: null,
  logo:
    'https://img.o3.network/logo/neo2/0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b.png',
};

export const ExchangeGroup = ['huobi', 'binance', 'coinbase'];

export const RATE_HOST = 'https://hub.o3.network/v1';

export const NEO_SCRIPTHASH =
  '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
