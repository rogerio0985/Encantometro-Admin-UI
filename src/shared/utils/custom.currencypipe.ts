
import { Pipe, PipeTransform, Injector} from '@angular/core';
import { formatCurrency, getCurrencySymbol } from '@angular/common';
import { AppConsts } from '@shared/AppConsts';

@Pipe({
    name: 'mycurrency',
  })
  export class CustomCurrencyPipe implements PipeTransform {

    transform(


        value: number,
        currencyCode: string = AppConsts.LocaleCurrency.find(l => l.locale == eaf.localization.currentLanguage.name).currencyCode,
        display:
            | 'code'
            | 'symbol'
            | 'symbol-narrow'
            | string
            | boolean = 'symbol',
        // digitsInfo: string = '3.2-2',
        digitsInfo: string = '1.2-2',
        locale: string = eaf.localization.currentLanguage.name,
    ): string | null {
        return formatCurrency(
          value,
          locale,
          getCurrencySymbol(currencyCode, 'wide', eaf.localization.currentLanguage.name),
          currencyCode,
          digitsInfo,
        );
    }

}
