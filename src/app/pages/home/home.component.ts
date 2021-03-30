import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LiquiditySource } from './liquidity-source';
import { ApiService } from '@core';
import { CommonHttpResponse } from '@lib';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  liquiditySource = LiquiditySource;
  lang = 'en';
  copyRightYear = new Date().getFullYear();
  roadmapIndex = 0;
  roadmapLen = 4;
  roadmapInterval;
  enterActiviteFirst = false;
  enterActiviteLast = false;

  email = '';
  canSubscribe = true;
  isFocus = false;
  isLoadingEmail = false;

  priceOptions = {
    path: '/assets/json/price/data.json',
  };

  swapOptions = {
    path: '/assets/json/swap/data.json',
  };

  exchangeOptions = {
    path: '/assets/json/exchange.json',
  };

  constructor(
    private nzMessage: NzMessageService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.roadmapIntervalFun();
  }

  roadmapIntervalFun(): void {
    this.roadmapInterval = setInterval(() => {
      this.roadmapIndex = (this.roadmapIndex + 1) % this.roadmapLen;
    }, 2000);
  }

  enterRoadmap(index: number): void {
    clearInterval(this.roadmapInterval);
    this.roadmapIndex = index;
  }

  leaveRoadmap(): void {
    this.roadmapIntervalFun();
  }

  subscriptNews(): void {
    if (this.isLoadingEmail === true) {
      return;
    }
    if (this.checkEmail() === false) {
      this.nzMessage.error('please enter your vaild email');
      return;
    }
    this.isLoadingEmail = true;
    this.apiService
      .postEmail(this.email)
      .subscribe((res: CommonHttpResponse) => {
        this.isLoadingEmail = false;
        if (res.status === 'success') {
          this.canSubscribe = false;
        } else {
          this.nzMessage.error(res.error_msg);
        }
      });
  }

  checkEmail(): boolean {
    const regex = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/;
    if (regex.test(this.email)) {
      return true;
    } else {
      return false;
    }
  }

  changeLang(lang: 'en' | 'zh'): void {
    this.lang = lang;
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  }
}
