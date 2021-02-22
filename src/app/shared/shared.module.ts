import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { LoadingComponent } from './compontent/loading/loading.component';

import { ShortAddressPipe } from './pipes/short-address.pipe';
import { TransNumberPipe } from './pipes/trans-number.pipe';

import { ErrSrcDirective } from './directive/err-src.directive';

import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzMessageModule } from 'ng-zorro-antd/message';

const COMPONENTS = [LoadingComponent];
const PIPES = [ShortAddressPipe, TransNumberPipe];
const DIRECTIVES = [ErrSrcDirective];
const THIRD_MODULES = [NzNotificationModule, NzMessageModule];

@NgModule({
  declarations: [...PIPES, ...COMPONENTS, ...DIRECTIVES],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ...THIRD_MODULES],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...PIPES,
    ...COMPONENTS,
    ...DIRECTIVES,
  ],
})
export class SharedModule {}
