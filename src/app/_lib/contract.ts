import { NETWORK } from './network';

export const NEO_NNEO_CONTRACT_HASH =
  NETWORK === 'MainNet'
    ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
    : '17da3881ab2d050fea414c80b3fa8324d756f60e';

export const NEO_SWAP_CONTRACT_HASH =
  NETWORK === 'MainNet'
    ? '89fa00d894c9a1475f8f94e84c79724b3faf64db'
    : '812d7291e2f0c89255cf355c1027872257d1ca37';

export const ETH_CROSS_SWAP_CONTRACT_HASH = {
  ETH:
    NETWORK === 'MainNet' ? '' : '0x8Baa27e659F55249bb36113346980BFFABC53AeF',
  BSC:
    NETWORK === 'MainNet' ? '' : '0x51FfD5196e3945c4CE25101eEB7f4062b97B9A1A',
  HECO:
    NETWORK === 'MainNet' ? '' : '0x0488ADd7e3D4C58acb8DF7c487dAfC48e3224833',
};

export const UNI_SWAP_CONTRACT_HASH =
  NETWORK === 'MainNet' ? '' : '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

export const SWAP_CONTRACT_CHAIN_ID = {
  BSC: NETWORK === 'MainNet' ? '' : 79,
  HECO: NETWORK === 'MainNet' ? '' : 7,
  ETH: NETWORK === 'MainNet' ? '' : 2,
};

export const POLY_HOST_ADDRESS = '0x0687e6392de735B83ed2808797c92051B5dF5618';

export const ETH_SWAP_CONTRACT_HASH =
  NETWORK === 'MainNet' ? '' : '0xAB55811908273B2629abE0F2B59cFD69cE938392';
