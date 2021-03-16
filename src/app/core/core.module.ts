import { APP_INITIALIZER, NgModule } from '@angular/core';

import { ApiService } from './api/api.service';
import { CommonService } from './util/common.service';

import { StartupService } from './startup/startup.service';
export function StartupServiceFactory(startupService: StartupService): any {
  return () => startupService.load();
}
const APPINIT_PROVIDES = [
  StartupService,
  {
    provide: APP_INITIALIZER,
    useFactory: StartupServiceFactory,
    deps: [StartupService],
    multi: true,
  },
];

@NgModule({
  providers: [ApiService, CommonService, ...APPINIT_PROVIDES],
})
export class CoreModule {}
