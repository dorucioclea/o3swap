import { NgModule } from '@angular/core';

import { ApiService } from './api/api.service';
import { CommonService } from './util/common.service';

@NgModule({
  providers: [ApiService, CommonService],
})
export class CoreModule {}
