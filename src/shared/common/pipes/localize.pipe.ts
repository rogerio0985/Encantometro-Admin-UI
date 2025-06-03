import { Injector, Pipe, PipeTransform } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { LocalizationService } from '@eaf/localization/localization.service';

@Pipe({
    name: 'localize'
})
export class LocalizePipe implements PipeTransform {

    localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
    localizationSourceNameEaf = AppConsts.localization.defaultLocalizationSourceNameEaf;

    localization: LocalizationService;

    constructor(injector: Injector) {
        this.localization = injector.get(LocalizationService);
    }

    l(key: string, ...args: any[]): string {
        args.unshift(key);
        args.unshift(this.localizationSourceName);
        return this.ls.apply(this, args);
    }

    ls(sourcename: string, key: string, ...args: any[]): string {
        let localizedText = this.localization.localize(key, this.localizationSourceName);

        if (!localizedText || localizedText.indexOf(key) != -1 || localizedText == key)
            localizedText = this.localization.localize(key, this.localizationSourceNameEaf);

        args.unshift(localizedText);

        return eaf.utils.formatString.apply(this, args);
    }

    transform(key: string, ...args: any[]): string {
        return this.l(key, args);
    }
}
