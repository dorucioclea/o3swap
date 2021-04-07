import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

type LiquidityType = 'add' | 'remove';

@Component({
  selector: 'app-liquidity',
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss']
})
export class LiquidityComponent implements OnInit, OnDestroy {
  swapProgress = 20;
  liquidityType: LiquidityType = 'add';

  constructor() {
    this.liquidityType = 'add';
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {

  }
  changeLiquidityType(params: LiquidityType): void {
    this.liquidityType = params;
  }
}
