export const MESSAGE = {
  CopiedSuccessfully: {
    en: `Copied Successfully`,
    zh: '',
  },
  UpdateMetaMaskExtension: {
    en: `Please update your MetaMask extension`,
    zh: '',
  },
  ConnectionSucceeded: {
    en: `Connection succeeded!`,
    zh: '',
  },
  SwitchMetaMaskNetwork: {
    en: (params: string[]) =>
      `Please switch network to ${params[0]} ${params[1]} on MetaMask extension.`,
    zh: '',
  },
  SwitchNeolineNetwork: {
    en: (params: string[]) =>
      `Please switch network to ${params[0]} on NeoLine extension.`,
    zh: '',
  },
  InsufficientBalance: {
    en: `Insufficient balance`,
    zh: '',
  },
  SystemBusy: {
    en: `System busy`,
    zh: '',
  },
  O3DAPINotReady: {
    en: `O3 dAPI is not ready, please open O3 wallet before use.`,
    zh: '',
  },
  EnterVaildEmail: {
    en: `please enter your vaild email`,
    zh: '',
  },
  ConnectWalletFirst: {
    en: (params: string[]) => `Please connect the ${params[0]} wallet first`,
    zh: '',
  },
  InsufficientPolyFee: {
    en: (params: string[]) => `Insufficient ${params[0]} for poly fee`,
    zh: '',
  },
  maximumLimit: {
    en: `You've exceeded the maximum limit`,
    zh: '',
  },
  WrongInput: {
    en: `Wrong input`,
    zh: '',
  },
  decimalLimit: {
    en: `You've exceeded the decimal limit.`,
    zh: '',
  },
  quoteAgain: {
    en: `Did not get the quotation, please get it again`,
    zh: '',
  },
  InsufficientAmountAndPolyFee: {
    en: (params: string[]) =>
      `Insufficient ${params[0]} for transfer amount and poly fee`,
    zh: '',
  },
};
