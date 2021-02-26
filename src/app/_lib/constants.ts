import { Token } from './type';

const NEO_TOKENS: Token[] = [
  {
    assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
    symbol: 'nNEO',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/f46719e2d16bf50cddcef9d4bbfece901f73cbb6.png',
  },
  {
    assetID: 'c277117879af3197fbef92c71e95800aa3b89d9a',
    symbol: 'pONT',
    decimals: 9,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/c277117879af3197fbef92c71e95800aa3b89d9a.png',
  },
  {
    assetID: '0df563008be710f3e0130208f8adc95ed7e5518d',
    symbol: 'pnWETH',
    decimals: 18,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/0df563008be710f3e0130208f8adc95ed7e5518d.png',
  },
  {
    assetID: '534dcac35b0dfadc7b2d716a7a73a7067c148b37',
    symbol: 'pnWBTC',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/534dcac35b0dfadc7b2d716a7a73a7067c148b37.png',
  },
  {
    assetID: '282e3340d5a1cd6a461d5f558d91bc1dbc02a07b',
    symbol: 'pnUSDT',
    decimals: 6,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/282e3340d5a1cd6a461d5f558d91bc1dbc02a07b.png',
  },
  {
    assetID: '4d9eab13620fe3569ba3b0e56e2877739e4145e3',
    symbol: 'FLM',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/4d9eab13620fe3569ba3b0e56e2877739e4145e3.png',
  },
  {
    assetID: '3e09e602eeeb401a2fec8e8ea137d59aae54a139',
    symbol: 'SWTH',
    decimals: 8,
    amount: null,
    logo:
      'https://img.o3.network/logo/neo2/3e09e602eeeb401a2fec8e8ea137d59aae54a139.png',
  },
];

const ETH_TOKENS = [];

export const ALL_TOKENS = { neo: NEO_TOKENS, eth: ETH_TOKENS };

export const DEFAULT_FROM_TOKEN: Token = {
  assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
  symbol: 'nNEO',
  decimals: 8,
  amount: null,
  logo:
    'https://img.o3.network/logo/neo2/f46719e2d16bf50cddcef9d4bbfece901f73cbb6.png',
};

// export const NEO_SCRIPTHASH =
//   '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';

export const SWAP_CONTRACT_HASH = '5ea2866235ab389fdd44017059eac95ca9e247aa';
