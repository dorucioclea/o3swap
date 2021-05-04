import { Pipe, PipeTransform } from '@angular/core';
import { langData } from '@lib';

@Pipe({
  name: 'translate',
})
export class TranslatePipe implements PipeTransform {
  constructor() {}

  public transform(
    value: string,
    lang: 'en',
    page = 'home',
    params: string[]
  ): any {
    if (params) {
      return langData[page][value][lang](params);
    } else {
      return langData[page][value][lang];
    }
  }
}
