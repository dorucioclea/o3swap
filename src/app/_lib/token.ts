export interface Token {
  symbol: string;
  logo: string;
  assetID: string;
  amount: string;
  decimals: number;
}

// const NEO_TOKENS: Token[] = [
//   {
//     assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
//     symbol: 'nNEO',
//     decimals: 8,
//     amount: null,
//     logo: '/assets/images/tokens/neo/neo.png',
//   },
//   {
//     assetID: 'c277117879af3197fbef92c71e95800aa3b89d9a',
//     symbol: 'pONT',
//     decimals: 9,
//     amount: null,
//     logo: '/assets/images/tokens/neo/ont.png',
//   },
//   {
//     assetID: '0df563008be710f3e0130208f8adc95ed7e5518d',
//     symbol: 'pnWETH',
//     decimals: 18,
//     amount: null,
//     logo: '/assets/images/tokens/neo/eth.png',
//   },
//   {
//     assetID: '534dcac35b0dfadc7b2d716a7a73a7067c148b37',
//     symbol: 'pnWBTC',
//     decimals: 8,
//     amount: null,
//     logo: '/assets/images/tokens/neo/btc.png',
//   },
//   {
//     assetID: '282e3340d5a1cd6a461d5f558d91bc1dbc02a07b',
//     symbol: 'pnUSDT',
//     decimals: 6,
//     amount: null,
//     logo: '/assets/images/tokens/neo/usdt.png',
//   },
//   {
//     assetID: '4d9eab13620fe3569ba3b0e56e2877739e4145e3',
//     symbol: 'FLM',
//     decimals: 8,
//     amount: null,
//     logo: '/assets/images/tokens/neo/flm.png',
//   },
//   {
//     assetID: '3e09e602eeeb401a2fec8e8ea137d59aae54a139',
//     symbol: 'SWTH',
//     decimals: 8,
//     amount: null,
//     logo: '/assets/images/tokens/neo/swth.png',
//   },
// ];

export const NEO_TOKENS: Token[] = [
  {
    assetID:
      '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    symbol: 'NEO',
    decimals: 0,
    amount: null,
    logo: '/assets/images/tokens/neo/neo.png',
  },
  {
    assetID: '17da3881ab2d050fea414c80b3fa8324d756f60e',
    symbol: 'nNEO',
    decimals: 8,
    amount: null,
    logo: '/assets/images/tokens/neo/neo.png',
  },
  {
    assetID: '9b2446d658859a96a7c40204d027bf5f9ca896e5',
    symbol: 'fWETH',
    decimals: 18,
    amount: null,
    logo: '/assets/images/tokens/neo/eth.png',
  },
  {
    assetID: 'b8f78d43ea9fe006c85a26b9aff67bcf69dd4fe1',
    symbol: 'pnUSDT',
    decimals: 6,
    amount: null,
    logo: '/assets/images/tokens/neo/usdt.png',
  },
  {
    assetID:
      '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
    symbol: 'GAS',
    decimals: 8,
    amount: null,
    logo: '/assets/images/tokens/neo/gas.png',
  },
  {
    assetID: '806f018810c6f74c22d1b27fe4da2feec7298c58',
    symbol: 'SWTH',
    decimals: 8,
    amount: null,
    logo: '/assets/images/tokens/neo/swth.png',
  },
  {
    assetID: '083ea8071188c7fe5b5e4af96ded222670d76663',
    symbol: 'FLM',
    decimals: 8,
    amount: null,
    logo: '/assets/images/tokens/neo/flm.png',
  },
  {
    assetID: '658cabf9c1f71ba0fa64098a7c17e52b94046ece',
    symbol: 'pONT',
    decimals: 9,
    amount: null,
    logo: '/assets/images/tokens/neo/ont.png',
  },
  {
    assetID: '69c57a716567a0f6910a0b3c1d4508fa163eb927',
    symbol: 'pnWBTC',
    decimals: 8,
    amount: null,
    logo: '/assets/images/tokens/neo/btc.png',
  },
];

export const ETH_TOKENS: Token[] = [];

export const ALL_TOKENS: Token[] = [...NEO_TOKENS, ...ETH_TOKENS];

export const DEFAULT_FROM_TOKEN: Token = {
  assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
  symbol: 'nNEO',
  decimals: 8,
  amount: '10.123456789011222',
  logo: '/assets/images/tokens/neo/neo.png',
};
