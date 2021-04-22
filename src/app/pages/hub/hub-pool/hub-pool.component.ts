import { Component, OnInit, OnDestroy } from '@angular/core';
import { USD_TOKENS } from '@lib';

@Component({
  selector: 'app-hub-pool',
  templateUrl: './hub-pool.component.html',
  styleUrls: ['./hub-pool.component.scss'],
})
export class HubPoolComponent implements OnInit, OnDestroy {
  USD_TOKENS = USD_TOKENS;
  constructor() {}
  ngOnDestroy(): void {}

  ngOnInit(): void {}
}
