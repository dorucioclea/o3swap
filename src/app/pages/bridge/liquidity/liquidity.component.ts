import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ApiService, CommonService } from '@core';

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
    private commonService: CommonService,
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
      this.rates = res;
    });
  }

  wordlimit(value: string | number): string {
    return this.commonService.wordlimit(value);
  }

  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
  }

  changeLiquidityType(params: LiquidityType): void {
    this.liquidityType = params;
  }
}
