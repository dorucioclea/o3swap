import { NgModule } from '@angular/core';

//#region services
import { ApiService } from './api/api.service';
import { RpcApiService } from './api/rpc.service';
import { CommonService } from './util/common.service';
import { SwapService } from './util/swap.service';
import { MetaMaskWalletApiService } from './util/walletApi/metamask';
import { NeolineWalletApiService } from './util/walletApi/neoline';
import { O3NeoWalletApiService } from './util/walletApi/o3-neo';
import { O3EthWalletApiService } from './util/walletApi/o3-eth';
import { VaultdMetaMaskWalletApiService } from './util/walletApi/vault-metamask';

const SERVICES = [
  ApiService,
  RpcApiService,
  CommonService,
  SwapService,
  MetaMaskWalletApiService,
  NeolineWalletApiService,
  O3NeoWalletApiService,
  O3EthWalletApiService,
  VaultdMetaMaskWalletApiService,
];
//#endregion

@NgModule({
  providers: [...SERVICES],
})
export class CoreModule {}
