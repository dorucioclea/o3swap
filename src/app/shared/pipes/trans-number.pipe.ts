import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transNumber',
})
export class TransNumberPipe implements PipeTransform {
  transform(value: any): any {
    if (!value) {
      return;
    }
    let data = value.toString();
    const dataGroup = data.split('.');
    if (dataGroup[0].length >= 13) {
      return dataGroup[0];
    }
    if (value && data.length > 13) {
      data = data.substring(0, 13);
    }
    return data;
  }
}
