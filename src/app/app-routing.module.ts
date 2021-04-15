import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent, SwapComponent, DashboardComponent, BridgeComponent, LiquidityComponent } from './pages';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  // { path: 'swap', component: SwapComponent },
  // { path: 'vault', component: DashboardComponent },
  // { path: 'hub', component: BridgeComponent },
  // { path: 'hub/liquidity/:type', component: LiquidityComponent },
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
