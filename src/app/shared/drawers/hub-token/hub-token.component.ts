import { Component, OnInit } from '@angular/core';
import { CONST_BRIDGE_TOKENS, Token, USD_TOKENS } from '@lib';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-hub-token',
  templateUrl: './hub-token.component.html',
  styleUrls: ['./hub-token.component.scss'],
})
export class HubTokenComponent implements OnInit {
  CONST_BRIDGE_TOKENS = CONST_BRIDGE_TOKENS;
  USD_TOKENS = USD_TOKENS;

  constructor(private drawerRef: NzDrawerRef) {}

  ngOnInit(): void {}

  close(token?: Token): void {
    this.drawerRef.close(token);
  }
}
