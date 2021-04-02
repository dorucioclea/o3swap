import { NEOLINE_NETWORK } from './network';

export const NEO_NNEO_CONTRACT_HASH =
  NEOLINE_NETWORK === 'MainNet'
    ? 'f46719e2d16bf50cddcef9d4bbfece901f73cbb6'
    : '17da3881ab2d050fea414c80b3fa8324d756f60e';

export const SWAP_CONTRACT_HASH =
  NEOLINE_NETWORK === 'MainNet'
    ? '0x89fa00d894c9a1475f8f94e84c79724b3faf64db'
    : '0x812d7291e2f0c89255cf355c1027872257d1ca37';

export const ETH_SWAP_CONTRACT_HASH =
  NEOLINE_NETWORK === 'MainNet'
    ? ''
    : '0x77F3A156e8E597C64d4a12d62f20a0d2ff839dD5';
