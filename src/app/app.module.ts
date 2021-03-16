import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';

import { CoreModule } from '@core/core.module';
import { SharedModule } from '@shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import {
  HomeComponent,
  SwapComponent,
  SwapHomeComponent,
  SwapResultComponent,
  SwapSettingComponent,
  SwapTokenComponent,
} from './pages';

const PAGECOMPONENTS = [
  HomeComponent,
  SwapComponent,
  SwapHomeComponent,
  SwapResultComponent,
  SwapTokenComponent,
  SwapSettingComponent,
];

//#region ng-zorro-antd
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
registerLocaleData(en);
//#endregion

// #region Http Interceptors
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptor } from '@core';
const INTERCEPTOR_PROVIDES = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: HttpInterceptor,
    multi: true,
  },
];
// #endregion

@NgModule({
  declarations: [AppComponent, ...PAGECOMPONENTS],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    CoreModule,
    SharedModule,
  ],
  providers: [{ provide: NZ_I18N, useValue: en_US }, ...INTERCEPTOR_PROVIDES],
  bootstrap: [AppComponent],
})
export class AppModule {}
