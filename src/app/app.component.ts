import { Component, OnInit } from '@angular/core';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { NeolineWalletApiService, MetaMaskWalletApiService } from '@core';

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
    private neolineWalletApiService: NeolineWalletApiService
  ) {
    this.router.events.subscribe((res: RouterEvent) => {
      if (res instanceof NavigationEnd) {
        this.currentPage = res.urlAfterRedirects || res.url;
        this.isHome = this.isHomePage();
      }
    });
  }

  ngOnInit(): void {
    if (location.pathname !== '/' && location.pathname !== '/home') {
      this.neolineWalletApiService.init();
      this.metaMaskWalletApiService.init();
    }
  }

  isHomePage(): boolean {
    if (this.currentPage === '/' || this.currentPage === '/home') {
      return true;
    }
    return false;
  }
}
