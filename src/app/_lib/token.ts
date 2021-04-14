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
export const ETH_SOURCE_ASSET_HASH =
  '0x0000000000000000000000000000000000000000';
export const WETH_ASSET_HASH = {
  ETH: {
    standardTokenSymbol: 'ETH',
    assetID: 'MainNet' ? '' : '0xc778417e063141139fce010982780140aa0cd5ab',
  },
  BSC: {
    standardTokenSymbol: 'BNB',
    assetID: 'MainNet' ? '' : '0x094616f0bdfb0b526bd735bf66eca0ad254ca81f',
  },
};
export const ETH_PUSDT_ASSET = {
  ETH: {
    assetID: 'MainNet' ? '' : '0x63799851696CDE43c2305dccd7208a03272BA591',
    decimals: 6,
  },
  BSC: {
    assetID: 'MainNet' ? '' : '0x78Ec09343122737925f9839d7794de49FeB6B083',
    decimals: 18,
  },
  HECO: {
    assetID: 'MainNet' ? '' : '0xbdd265FC4D5b7E7a937608B91EDAFc38F27E4479',
    decimals: 18,
  },
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

//#region liquidity page
export const USD_TOKENS: Token[] = [
  {
    assetID: 'MainNet' ? '' : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'USDT',
    decimals: 6,
    amount: '0',
    chain: 'ETH',
    logo: `https://img.o3.network/logo/eth/0x74a7f2a3afa8b0cb577985663b5811901a860619.png`,
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: NETWORK === 'MainNet' ? 'BUSD' : 'BUSDT',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: `https://img.o3.network/logo/bsc/0x74a7f2a3afa8b0cb577985663b5811901a860619.png`,
  },
  {
    assetID:
      NETWORK === 'MainNet' ? '' : '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
    symbol: NETWORK === 'MainNet' ? 'HUSD' : 'HUSDT',
    decimals: 18,
    amount: '0',
    chain: 'HECO',
    logo: `https://img.o3.network/logo/heco/0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04.png`,
  },
];
export const LP_TOKENS: Token[] = [
  {
    assetID: 'MainNet' ? '' : '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    chain: 'ETH',
    logo: '/assets/images/tokens/lp.png',
  },
  {
    assetID: 'MainNet' ? '' : '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    chain: 'BSC',
    logo: '/assets/images/tokens/lp.png',
  },
  {
    assetID: 'MainNet' ? '' : '0x74a7f2a3afa8b0cb577985663b5811901a860619',
    symbol: 'pLP',
    decimals: 18,
    amount: '0',
    chain: 'HECO',
    logo: '/assets/images/tokens/lp.png',
  },
];
//#endregion

//#region chain tokens
const CHAIN_TOKENS_MAINNET: ChainToken = {
  ETH: [
    {
      symbol: 'ETH',
      decimals: 18,
      assetID: '0x0000000000000000000000000000000000000000',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'USDT',
      decimals: 6,
      assetID: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'USDC',
      decimals: 6,
      assetID: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'DAI',
      decimals: 18,
      assetID: '0x6b175474e89094c44da98b954eedeac495271d0f',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'WBTC',
      decimals: 8,
      assetID: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'BUSD',
      decimals: 18,
      assetID: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'TUSD',
      decimals: 18,
      assetID: '0x0000000000085d4780b73119b644ae5ecd22b376',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'UNI',
      decimals: 18,
      assetID: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'AAVE',
      decimals: 18,
      assetID: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: '1INCH',
      decimals: 18,
      assetID: '0x111111111117dc0aa78b770fa6a738034120c302',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'COMP',
      decimals: 18,
      assetID: '0xc00e94cb662c3520282e6f5717214004a7f26888',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'CRV',
      decimals: 18,
      assetID: '0xd533a949740bb3306d119cc777fa900ba034cd52',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'ENJ',
      decimals: 18,
      assetID: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'BNB',
      decimals: 18,
      assetID: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'HT',
      decimals: 18,
      assetID: '0x6f259637dcd74c767781e37bc6133cd6a68aa161',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'LINK',
      decimals: 18,
      assetID: '0x514910771af9ca656af840dff83e8264ecf986ca',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'MKR',
      decimals: 18,
      assetID: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'OMG',
      decimals: 18,
      assetID: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'SUSHI',
      decimals: 18,
      assetID: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'YFI',
      decimals: 18,
      assetID: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'ZRX',
      decimals: 18,
      assetID: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'BNT',
      decimals: 18,
      assetID: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'GRT',
      decimals: 18,
      assetID: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'SNX',
      decimals: 18,
      assetID: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'MATIC',
      decimals: 18,
      assetID: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'LRC',
      decimals: 18,
      assetID: '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'KNC',
      decimals: 18,
      assetID: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'DODO',
      decimals: 18,
      assetID: '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'SKL',
      decimals: 18,
      assetID: '0x00c83aecc790e8a4453e5dd3b0b4b3680501a7a7',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'BAND',
      decimals: 18,
      assetID: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'PERP',
      decimals: 18,
      assetID: '0xbc396689893d065f41bc2c6ecbee5e0085233447',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
  ],
  BSC: [
    {
      symbol: 'BUSD',
      decimals: 18,
      assetID: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'Cake',
      decimals: 18,
      assetID: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'ETH',
      decimals: 18,
      assetID: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'USDT',
      decimals: 18,
      assetID: '0x55d398326f99059ff775485246999027b3197955',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'USDC',
      decimals: 18,
      assetID: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'UST',
      decimals: 18,
      assetID: '0x23396cf899ca06c4472205fc903bdb4de249d6fc',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'YFI',
      decimals: 18,
      assetID: '0x88f1a5ae2a3bf98aeaf342d26b30a79438c9142e',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'ADA',
      decimals: 18,
      assetID: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'ALICE',
      decimals: 6,
      assetID: '0xe7b91602ce96a537cb729f484b8ddb3c1fecbb45',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'ALPHA',
      decimals: 18,
      assetID: '0xa1faa113cbe53436df28ff0aee54275c13b40975',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'ATOM',
      decimals: 18,
      assetID: '0x0eb3a705fc54725037cc9e008bdede697f62f335',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
  ],
  HECO: [
    {
      symbol: 'USDT',
      decimals: 18,
      assetID: '0xa71edc38d189767582c38a3145b5873052c3e47a',
      amount: '0',
      logo: '',
      chain: 'HECO',
    },
  ],
  NEO: [
    {
      symbol: 'NEO',
      decimals: 0,
      assetID:
        '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'nNEO',
      decimals: 8,
      assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pnWETH',
      decimals: 12,
      assetID: '0df563008be710f3e0130208f8adc95ed7e5518d',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pONT',
      decimals: 9,
      assetID: 'c277117879af3197fbef92c71e95800aa3b89d9a',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pnUSDT',
      decimals: 6,
      assetID: '282e3340d5a1cd6a461d5f558d91bc1dbc02a07b',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pnWBTC',
      decimals: 8,
      assetID: '534dcac35b0dfadc7b2d716a7a73a7067c148b37',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'FLM',
      decimals: 8,
      assetID: '4d9eab13620fe3569ba3b0e56e2877739e4145e3',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'SWTH',
      decimals: 8,
      assetID: '3e09e602eeeb401a2fec8e8ea137d59aae54a139',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'fWETH',
      decimals: 12,
      assetID: '179a0db04a130dec6060cd9569d7ee7d7e8eccdc',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'fWBTC',
      decimals: 8,
      assetID: '36a8f669d55bbfe99a3e9f7953745736bfa5453c',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'fUSDT',
      decimals: 6,
      assetID: '1aa893170b1babfefba973e9a9183990d792c2a7',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
  ],
  ALL: [
    {
      symbol: 'ETH',
      decimals: 18,
      assetID: '0x0000000000000000000000000000000000000000',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'USDT',
      decimals: 6,
      assetID: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'nNEO',
      decimals: 8,
      assetID: 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'BUSD',
      decimals: 18,
      assetID: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'USDT',
      decimals: 18,
      assetID: '0xa71edc38d189767582c38a3145b5873052c3e47a',
      amount: '0',
      logo: '',
      chain: 'HECO',
    },
  ],
};

const CHAIN_TOKENS_TESTNET: ChainToken = {
  ETH: [
    {
      symbol: 'ETH',
      decimals: 18,
      assetID: '0x0000000000000000000000000000000000000000',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'USDT',
      decimals: 6,
      assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'DAI',
      decimals: 18,
      assetID: '0xad6d458402f60fd3bd25163575031acdce07538d',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'USDC',
      decimals: 6,
      assetID: '0x0d9c8723b343a8368bebe0b5e89273ff8d712e3c',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'WETH',
      decimals: 18,
      assetID: '0xc778417e063141139fce010982780140aa0cd5ab',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
  ],
  BSC: [
    {
      symbol: 'BUSDT',
      decimals: 18,
      assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
  ],
  HECO: [
    {
      symbol: 'HUSDT',
      decimals: 18,
      assetID: '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
      amount: '0',
      logo: '',
      chain: 'HECO',
    },
  ],
  NEO: [
    {
      symbol: 'NEO',
      decimals: 0,
      assetID:
        '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
      logo: '',
      amount: '0',
      chain: 'NEO',
    },
    {
      symbol: 'nNEO',
      decimals: 8,
      assetID: '17da3881ab2d050fea414c80b3fa8324d756f60e',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pnETH',
      decimals: 12,
      assetID: '23535b6fd46b8f867ed010bab4c2bd8ef0d0c64f',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pONTD',
      decimals: 9,
      assetID: '658cabf9c1f71ba0fa64098a7c17e52b94046ece',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pnUSDT',
      decimals: 6,
      assetID: 'b8f78d43ea9fe006c85a26b9aff67bcf69dd4fe1',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'pnWBTC',
      decimals: 8,
      assetID: '69c57a716567a0f6910a0b3c1d4508fa163eb927',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'FLM',
      decimals: 8,
      assetID: '083ea8071188c7fe5b5e4af96ded222670d76663',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'SWTH',
      decimals: 8,
      assetID: '806f018810c6f74c22d1b27fe4da2feec7298c58',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'FWETH',
      decimals: 12,
      assetID: '9b2446d658859a96a7c40204d027bf5f9ca896e5',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'fWBTC',
      decimals: 8,
      assetID: 'aa94bb6ff87660da94bbe57c34e0373163b7ac93',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'fUSDT',
      decimals: 6,
      assetID: 'b55026d49bb5b585e1d2f9820efdc969f4b8cde6',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
  ],
  ALL: [
    {
      symbol: 'ETH',
      decimals: 18,
      assetID: '0x0000000000000000000000000000000000000000',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'USDT',
      decimals: 6,
      assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
      amount: '0',
      logo: '',
      chain: 'ETH',
    },
    {
      symbol: 'nNEO',
      decimals: 8,
      assetID: '17da3881ab2d050fea414c80b3fa8324d756f60e',
      amount: '0',
      logo: '',
      chain: 'NEO',
    },
    {
      symbol: 'BUSDT',
      decimals: 18,
      assetID: '0x74a7f2a3afa8b0cb577985663b5811901a860619',
      amount: '0',
      logo: '',
      chain: 'BSC',
    },
    {
      symbol: 'HUSDT',
      decimals: 18,
      assetID: '0x77e8ebd5b2d7cd984e6ae05a809409c795bf9b04',
      amount: '0',
      logo: '',
      chain: 'HECO',
    },
  ],
};

type ChainToken = {
  ETH: Token[];
  NEO: Token[];
  BSC: Token[];
  HECO: Token[];
  ALL: Token[];
};
export const CHAIN_TOKENS: ChainToken = 'MainNet'
  ? CHAIN_TOKENS_MAINNET
  : CHAIN_TOKENS_TESTNET;
//#endregion
