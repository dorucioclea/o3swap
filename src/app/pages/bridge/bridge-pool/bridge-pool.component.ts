import { Component, OnInit, OnDestroy } from '@angular/core';
import { USD_TOKENS } from '@lib';

@Component({
  selector: 'app-bridge-pool',
  templateUrl: './bridge-pool.component.html',
  styleUrls: ['./bridge-pool.component.scss'],
})
export class BridgePoolComponent implements OnInit, OnDestroy {
  USD_TOKENS = USD_TOKENS;
  constructor() {}
  ngOnDestroy(): void {}

  ngOnInit(): void {}
}
