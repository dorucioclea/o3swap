export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
  chain: CHAINS;
  atNeoAssetName?: string;
}

const NEO_TOKENS: Token[] = [
  {
    assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
    symbol: 'nNEO',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/nNEO.png',
    chain: 'NEO',
  },
  {
    assetID: 'c277117879af3197fbef92c71e95800aa3b89d9a',
    symbol: 'pONT',
    decimals: 9,
    amount: '0',
    logo: '/assets/images/tokens/pONT.png',
    chain: 'NEO',
  },
  {
    assetID: '0df563008be710f3e0130208f8adc95ed7e5518d',
    symbol: 'pnWETH',
    decimals: 18,
    amount: '0',
    logo: '/assets/images/tokens/pnWETH.png',
    chain: 'NEO',
  },
  {
    assetID: '534dcac35b0dfadc7b2d716a7a73a7067c148b37',
    symbol: 'pnWBTC',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/pnWBTC.png',
    chain: 'NEO',
  },
  {
    assetID: '282e3340d5a1cd6a461d5f558d91bc1dbc02a07b',
    symbol: 'pnUSDT',
    decimals: 6,
    amount: '0',
    logo: '/assets/images/tokens/pnUSDT.png',
    chain: 'NEO',
  },
  {
    assetID: '4d9eab13620fe3569ba3b0e56e2877739e4145e3',
    symbol: 'FLM',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/FLM.png',
    chain: 'NEO',
  },
  {
    assetID: '3e09e602eeeb401a2fec8e8ea137d59aae54a139',
    symbol: 'SWTH',
    decimals: 8,
    amount: '0',
    logo: '/assets/images/tokens/SWTH.png',
    chain: 'NEO',
  },
];

const ETH_TOKENS: Token[] = [];
const BSC_TOKENS: Token[] = [];

const HECO_TOKENS: Token[] = [];

const ALL: Token[] = [];

export const CHAIN_TOKENS = {
  ALL,
  NEO: NEO_TOKENS,
  ETH: ETH_TOKENS,
  BSC: BSC_TOKENS,
  HECO: HECO_TOKENS,
};

export type CHAINS = 'ALL' | 'NEO' | 'ETH' | 'BSC' | 'HECO';
