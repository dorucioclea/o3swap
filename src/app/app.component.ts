import { Component, OnInit } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import {
  NeolineWalletApiService,
  MetaMaskWalletApiService,
  VaultdMetaMaskWalletApiService,
} from '@core';
import { RiskWarningComponent } from '@shared/compontent/risk-warning/risk-warning.component';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  currentPage = this.router.url;
  isHome = true;

  constructor(
    private router: Router,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private neolineWalletApiService: NeolineWalletApiService,
    private vaultdMetaMaskWalletApiService: VaultdMetaMaskWalletApiService,
    private modal: NzModalService,
  ) {
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
        if (sessionStorage.getItem(`${this.currentPage}WarningDialog`) !== 'true' && location.pathname !== '/' && location.pathname !== '/home') {
          this.riskWarning();
        }
      }
    });
  }

  ngOnInit(): void {
    if (location.pathname !== '/' && location.pathname !== '/home') {
      this.neolineWalletApiService.init();
      this.metaMaskWalletApiService.init();
      this.vaultdMetaMaskWalletApiService.init();
    }
  }

  isHomePage(): boolean {
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return true;
    }
    return false;
  }

  riskWarning(): void {
    const modal = this.modal.create({
      nzContent: RiskWarningComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzMaskClosable: false,
      nzClassName: 'custom-modal'
    });
    modal.afterClose.subscribe(() => {
      sessionStorage.setItem(`${this.currentPage}WarningDialog`, 'true');
    });
  }
}
