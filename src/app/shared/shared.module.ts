import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { LoadingComponent } from './compontent/loading/loading.component';
import { SwapSettingComponent } from './compontent/swap-setting/swap-setting.component';
import { SwapExchangeComponent } from './compontent/swap-exchange/swap-exchange.component';
import { SwapTokenComponent } from './compontent/swap-token/swap-token.component';
import { DashboardStakeComponent } from './compontent/dashboard-stake/dashboard-stake.component';

import { ShortAddressPipe } from './pipes/short-address.pipe';
import { TransNumberPipe } from './pipes/trans-number.pipe';
import { TranslatePipe } from './pipes/translate.pipe';

import { ErrSrcDirective } from './directive/err-src.directive';

import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';

const COMPONENTS = [
  LoadingComponent,
  SwapSettingComponent,
  SwapExchangeComponent,
  SwapTokenComponent,
  DashboardStakeComponent,
];
const PIPES = [ShortAddressPipe, TransNumberPipe, TranslatePipe];
const DIRECTIVES = [ErrSrcDirective];
const THIRD_MODULES = [
  NzNotificationModule,
  NzMessageModule,
  NzToolTipModule,
  NzButtonModule,
  NzModalModule,
  NzProgressModule,
];

@NgModule({
  declarations: [...PIPES, ...COMPONENTS, ...DIRECTIVES],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ...THIRD_MODULES],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...PIPES,
    ...THIRD_MODULES,
    ...COMPONENTS,
    ...DIRECTIVES,
  ],
})
export class SharedModule {}
