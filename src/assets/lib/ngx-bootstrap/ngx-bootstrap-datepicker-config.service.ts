import { BsDatepickerConfig, BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { NgxBootstrapLocaleMappingService } from 'assets/lib/ngx-bootstrap/ngx-bootstrap-locale-mapping.service';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { ThemeHelper } from '@app/shared/layout/themes/ThemeHelper';

export class NgxBootstrapDatePickerConfigService {

    static getDaterangepickerConfig(): BsDaterangepickerConfig {
        return Object.assign(new BsDaterangepickerConfig(), {
            containerClass: 'theme-' + NgxBootstrapDatePickerConfigService.getThemeColor()
        });
    }

    static getDatepickerConfig(): BsDatepickerConfig {
        return Object.assign(new BsDatepickerConfig(), {
            containerClass: 'theme-' + NgxBootstrapDatePickerConfigService.getThemeColor()
        });
    }

    static getThemeColor(): string {
        return ThemeHelper.getThemeColor();
    }

    static getDatepickerLocale(): BsLocaleService {
        let localeService = new BsLocaleService();
        localeService.use(eaf.localization.currentLanguage.name);
        return localeService;
    }

    static registerNgxBootstrapDatePickerLocales(): Promise<boolean> {
        // For now, skip dynamic locale loading to avoid build issues
        // TODO: Implement static locale imports for supported languages
        console.warn('Dynamic ngx-bootstrap locale loading disabled for production build');
        return Promise.resolve(true);
    }
}
