import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  NeoWalletName,
  EthWalletName,
  UPDATE_NEO_ACCOUNT,
  SwapStateType,
  RESET_NEO_BALANCES,
  UPDATE_NEO_WALLET_NAME,
  UPDATE_ETH_ACCOUNT,
  UPDATE_ETH_WALLET_NAME,
  UPDATE_BSC_ACCOUNT,
  UPDATE_BSC_WALLET_NAME,
  UPDATE_HECO_ACCOUNT,
  UPDATE_HECO_WALLET_NAME,
  RESET_BSC_BALANCES,
  RESET_HECO_BALANCES,
  ConnectChainType,
} from '@lib';
import { CommonService } from '@core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

interface State {
  swap: SwapStateType;
}

@Component({
  selector: 'app-header-connect',
  templateUrl: './header-connect.component.html',
  styleUrls: ['./header-connect.component.scss'],
})
export class HeaderConnectComponent implements OnInit {
  connectChainType: ConnectChainType = 'ETH';
  showConnectModal = false; // connect wallet modal

  swap$: Observable<any>;
  neoAccountAddress: string;
  ethAccountAddress: string;
  bscAccountAddress: string;
  hecoAccountAddress: string;
  neoWalletName: NeoWalletName;
  ethWalletName: EthWalletName;
  bscWalletName: EthWalletName;
  hecoWalletName: EthWalletName;

  constructor(
    private store: Store<State>,
    private commonService: CommonService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.swap$ = store.select('swap');
  }

  ngOnInit(): void {
    this.swap$.subscribe((state) => {
      this.neoAccountAddress = state.neoAccountAddress;
      this.ethAccountAddress = state.ethAccountAddress;
      this.bscAccountAddress = state.bscAccountAddress;
      this.hecoAccountAddress = state.hecoAccountAddress;
      this.neoWalletName = state.neoWalletName;
      this.ethWalletName = state.ethWalletName;
      this.bscWalletName = state.bscWalletName;
      this.hecoWalletName = state.hecoWalletName;
      this.changeDetectorRef.detectChanges();
    });
  }

  showConnect(): void {
    this.showConnectModal = true;
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  //#region account modal
  disConnect(type: ConnectChainType): void {
    switch (type) {
      case 'ETH':
        this.ethWalletName = null;
        this.ethAccountAddress = null;
        this.store.dispatch({ type: UPDATE_ETH_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_ETH_WALLET_NAME, data: null });
        break;
      case 'NEO':
        this.neoWalletName = null;
        this.neoAccountAddress = null;
        this.store.dispatch({ type: UPDATE_NEO_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_NEO_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_NEO_BALANCES });
        break;
      case 'BSC':
        this.bscWalletName = null;
        this.bscAccountAddress = null;
        this.store.dispatch({ type: UPDATE_BSC_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_BSC_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_BSC_BALANCES });
        break;
      case 'HECO':
        this.hecoWalletName = null;
        this.hecoAccountAddress = null;
        this.store.dispatch({ type: UPDATE_HECO_ACCOUNT, data: null });
        this.store.dispatch({ type: UPDATE_HECO_WALLET_NAME, data: null });
        this.store.dispatch({ type: RESET_HECO_BALANCES });
        break;
    }
  }

  changeWallet(type: ConnectChainType): void {
    this.connectChainType = type;
    this.showConnectModal = true;
  }
  //#endregion
}
