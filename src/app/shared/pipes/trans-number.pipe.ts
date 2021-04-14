import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transNumber',
})
export class TransNumberPipe implements PipeTransform {
  transform(value: any, len = 13): any {
    if (!value) {
      return;
    }
    let data = value.toString();
    const dataGroup = data.split('.');
    if (dataGroup[0].length >= len) {
      return dataGroup[0];
    }
    if (value && data.length > len) {
      data = data.substring(0, len);
    }
    return data;
  }
}
