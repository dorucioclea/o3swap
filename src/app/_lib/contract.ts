import { NETWORK } from './network';

export const NEO_NNEO_CONTRACT_HASH =
  NETWORK === 'MainNet'
    ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
    : '17da3881ab2d050fea414c80b3fa8324d756f60e';

export const SWAP_CONTRACT_HASH =
  NETWORK === 'MainNet'
    ? '89fa00d894c9a1475f8f94e84c79724b3faf64db'
    : '812d7291e2f0c89255cf355c1027872257d1ca37';

export const ETH_SWAP_CONTRACT_HASH =
  NETWORK === 'MainNet' ? '' : '0x77F3A156e8E597C64d4a12d62f20a0d2ff839dD5';

export const UNI_SWAP_CONTRACT_HASH =
  NETWORK === 'MainNet' ? '' : '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

export const SWAP_CONTRACT_CHAIN_ID = {
  BSC: NETWORK === 'MainNet' ? '' : 79,
  HECO: NETWORK === 'MainNet' ? '' : 7,
  ETH: NETWORK === 'MainNet' ? '' : 2,
};
