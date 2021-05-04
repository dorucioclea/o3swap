import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LiquiditySource } from './liquidity-source';
import { ApiService } from '@core';
import { CommonHttpResponse, UPDATE_LANGUAGE } from '@lib';
import { interval, Observable, Unsubscribable } from 'rxjs';
import { Store } from '@ngrx/store';

interface State {
  language: any;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './mobile.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  liquiditySource = LiquiditySource;
  copyRightYear = new Date().getFullYear();
  roadmapIndex = 0;
  roadmapLen = 4;
  roadmapInterval: Unsubscribable;
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

  langPageName = 'home';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;

  constructor(
    private store: Store<State>,
    private nzMessage: NzMessageService,
    private apiService: ApiService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
  }

  ngOnInit(): void {
    this.roadmapIntervalFun();
  }

  ngOnDestroy(): void {
    if (this.roadmapInterval) {
      this.roadmapInterval.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  roadmapIntervalFun(): void {
    if (this.roadmapInterval) {
      this.roadmapInterval.unsubscribe();
    }
    this.roadmapInterval = interval(2000).subscribe(() => {
      this.roadmapIndex = (this.roadmapIndex + 1) % this.roadmapLen;
    });
  }

  enterRoadmap(index: number): void {
    this.roadmapInterval.unsubscribe();
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
    if (lang === this.lang) {
      return;
    }
    this.lang = lang;
    this.store.dispatch({ type: UPDATE_LANGUAGE, data: lang });
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  }
}
