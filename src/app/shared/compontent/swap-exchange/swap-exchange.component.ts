import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
export const defaultSlipValue = 2; // 默认滑点 2%
export const defaultDeadline = 10; // 分钟

@Component({
  selector: 'app-swap-exchange',
  templateUrl: './swap-exchange.component.html',
  styleUrls: ['./swap-exchange.component.scss'],
})
export class SwapExchangeComponent implements OnInit {
  @Input() slipValue: number | string;
  @Input() isCustomSlip: boolean; // 自定义滑点
  @Input() deadline: number;
  @Output() closePage = new EventEmitter<any>();

  // setting slip
  slipValueGroup = [0.1, 0.5, 1, 2];
  slipValueError: string;

  constructor() {}

  ngOnInit(): void {
    this.checkSlipValue();
  }

  selectSlipValue(value: number): void {
    this.slipValue = value;
    this.isCustomSlip = false;
    this.checkSlipValue();
  }
  clickCustomSlipValue(): void {
    this.isCustomSlip = true;
    this.slipValue = '';
  }
  backToHomePage(): void {
    this.updateDeadline();
    this.updateSlipValue();
    const settingObj = {
      deadline: this.deadline,
      slipValue: this.slipValue,
      isCustomSlip: this.isCustomSlip,
    };
    this.closePage.emit(settingObj);
  }

  //#region
  checkSlipValue(): void {
    const tempSlip = Number(this.slipValue);
    if (Number.isNaN(tempSlip) || tempSlip <= 0) {
      return;
    }
    if (this.slipValue < 0.5) {
      this.slipValueError = 'Your transaction may fail';
    } else if (this.slipValue > 5) {
      this.slipValueError = 'Your transaction may be frontrun';
    } else {
      this.slipValueError = '';
    }
  }
  updateDeadline(): void {
    let tempDeadline = Math.floor(Number(this.deadline));
    if (Number.isNaN(tempDeadline) || tempDeadline <= 0) {
      tempDeadline = defaultDeadline;
    }
    this.deadline = tempDeadline;
  }
  updateSlipValue(): void {
    const tempSlip = Number(this.slipValue);
    if (Number.isNaN(tempSlip) || tempSlip <= 0) {
      this.isCustomSlip = false;
      this.slipValue = defaultSlipValue;
    }
  }
  //#endregion
}
