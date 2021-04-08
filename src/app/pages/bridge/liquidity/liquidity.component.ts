import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ApiService } from '@core';

type LiquidityType = 'add' | 'remove';

@Component({
  selector: 'app-liquidity',
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss']
})
export class LiquidityComponent implements OnInit, OnDestroy {
  swapProgress = 20;
  liquidityType: LiquidityType = 'add';
  rates = {};

  inputAmount = '';

  constructor(
    private apiService: ApiService,
  ) {
    this.liquidityType = 'add';
  }

  ngOnInit() {
    this.getRates()
  }

  ngOnDestroy(): void {

  }

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      console.log(res)
      this.rates = res;
    });
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  changeLiquidityType(params: LiquidityType): void {
    this.liquidityType = params;
  }
}
