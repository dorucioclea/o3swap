import { Component, Input, OnInit } from '@angular/core';
import { DEFAULT_DEADLINE, DEFAULT_SLIPVALUE } from '@lib';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-swap-setting',
  templateUrl: './swap-setting.component.html',
  styleUrls: ['./swap-setting.component.scss'],
})
export class SwapSettingComponent implements OnInit {
  @Input() slipValue: number | string;
  @Input() isCustomSlip: boolean; // 自定义滑点
  @Input() deadline: number;

  // setting slip
  slipValueGroup = [0.1, 0.5, 1, 2];
  slipValueError: string;

  constructor(private modal: NzModalRef) {}

  ngOnInit(): void {
    this.checkSlipValue();
  }

  selectSlipValue(value: number): void {
    this.slipValue = value;
    this.isCustomSlip = false;
    this.checkSlipValue();
  }
  clickCustomSlipValue(): void {
    if (this.isCustomSlip === false) {
      this.slipValue = '';
    }
    this.isCustomSlip = true;
  }
  inputSlipValue(event): void {
    this.slipValue = event.target.value;
    this.isCustomSlip = true;
  }
  close(): void {
    this.updateDeadline();
    this.updateSlipValue();
    const settingObj = {
      deadline: this.deadline,
      slipValue: this.slipValue,
      isCustomSlip: this.isCustomSlip,
    };
    console.log(settingObj);
    this.modal.close(settingObj);
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
    } else if (this.slipValue >= 100) {
      this.slipValueError = 'Enter a valid slippage percentage';
    } else {
      this.slipValueError = '';
    }
  }
  updateDeadline(): void {
    let tempDeadline = Math.floor(Number(this.deadline));
    if (
      Number.isNaN(tempDeadline) ||
      tempDeadline <= 0 ||
      tempDeadline >= 100
    ) {
      tempDeadline = DEFAULT_DEADLINE;
    }
    this.deadline = tempDeadline;
  }
  updateSlipValue(): void {
    const tempSlip = Number(this.slipValue);
    if (Number.isNaN(tempSlip) || tempSlip <= 0 || tempSlip >= 100) {
      // this.isCustomSlip = false;
      this.slipValue = DEFAULT_SLIPVALUE;
    }
  }
  //#endregion
}
