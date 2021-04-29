import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {
  HomeComponent,
  SwapComponent,
  VaultComponent,
  HubComponent,
  LiquidityComponent,
  LegacyLiquidityComponent,
} from './pages';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'swap', component: SwapComponent },
  { path: 'vault', component: VaultComponent },
  { path: 'hub', component: HubComponent },
  { path: 'hub/liquidity/:type', component: LiquidityComponent },
  { path: 'hub/legacy-liquidity/remove', component: LegacyLiquidityComponent },
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
