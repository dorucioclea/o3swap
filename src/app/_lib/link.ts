import { NEOLINE_NETWORK } from './network';

export const NEO_TX_PAGES_PREFIX =
  NEOLINE_NETWORK === 'MainNet'
    ? 'https://neotube.io/transaction'
    : 'https://testnet.neotube.io/transaction';

export const POLY_TX_PAGES_PREFIX =
  NEOLINE_NETWORK === 'MainNet'
    ? 'https://explorer.poly.network/tx'
    : 'https://explorer.poly.network/testnet/tx';

export const ETH_TX_PAGES_PREFIX =
  NEOLINE_NETWORK === 'MainNet'
    ? 'https://etherscan.io/tx'
    : 'https://ropsten.etherscan.io/tx';
