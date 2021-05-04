import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import { CommonService } from '@core';
import { ConnectChainType } from '@lib';
import { environment } from '@env/environment';
import { Store } from '@ngrx/store';
import { Unsubscribable, Observable } from 'rxjs';

interface State {
  language: any;
}

@Component({
  selector: 'app-wallet-connect-item',
  templateUrl: './wallet-connect-item.component.html',
  styleUrls: ['./wallet-connect-item.component.scss'],
})
export class WalletConnectItemComponent implements OnInit, OnDestroy {
  @Input() walletList: any[];
  @Input() chain: ConnectChainType;
  @Input() walletName: string;
  @Input() walletChain?: ConnectChainType;
  @Input() walletAddress: string;
  @Output() connect = new EventEmitter();

  disableEthO3 = true;

  langPageName = 'header';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private commonService: CommonService,
    private store: Store<State>
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }
  ngOnDestroy(): void {
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  ngOnInit(): void {
    if (environment.testSite === true) {
      this.disableEthO3 = false;
    }
  }

  copy(value: string): void {
    this.commonService.copy(value);
  }

  connectWallet(wallet): void {
    this.connect.emit(wallet);
  }
}
