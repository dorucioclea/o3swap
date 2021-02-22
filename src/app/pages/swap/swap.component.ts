import { Component, OnInit } from '@angular/core';
// import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import BigNumber from 'bignumber.js';
import {
  DEFAULT_FROM_TOKEN,
  TOKENS,
  TOKENS_OBJECT,
  ExchangeGroup,
  RATE_HOST,
  NEO_SCRIPTHASH,
} from './constants';
import { Token, WalletType, Exchange, RateChain } from './type';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.less'],
})
export class SwapComponent implements OnInit {
  inquiryHost = 'http://localhost:5000/AssetQuery';

  showExchangeModal = false;

  constructor() {}

  ngOnInit(): void {}
}
