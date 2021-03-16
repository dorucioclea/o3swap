import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { LoadingComponent } from './compontent/loading/loading.component';

import { ShortAddressPipe } from './pipes/short-address.pipe';
import { TransNumberPipe } from './pipes/trans-number.pipe';
import { TranslatePipe } from './pipes/translate.pipe';

import { ErrSrcDirective } from './directive/err-src.directive';

import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

const COMPONENTS = [LoadingComponent];
const PIPES = [ShortAddressPipe, TransNumberPipe, TranslatePipe];
const DIRECTIVES = [ErrSrcDirective];
const THIRD_MODULES = [NzNotificationModule, NzMessageModule, NzToolTipModule];

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
