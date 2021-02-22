import { Pipe, PipeTransform } from '@angular/core';
import bignumber from 'bignumber.js';

@Pipe({
  name: 'transNumber',
})
export class TransNumberPipe implements PipeTransform {
  transform(value: any): any {
    return new bignumber(value).toFixed();
  }
}
