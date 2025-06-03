import { AppConsts } from '@shared/AppConsts';
import * as rtlDetect from 'rtl-detect';
import { StyleLoaderService } from '@shared/utils/style-loader.service';
import { ThemeHelper } from '@app/shared/layout/themes/ThemeHelper';

export class DynamicResourcesHelper {

    static loadResources(callback: () => void): void {
        Promise.all([DynamicResourcesHelper.loadStyles()])
            .then(() => {
                callback();
            });
    }

    static loadStyles(): Promise<any> {
        let theme = ThemeHelper.getThemeColor();

        const isRtl = rtlDetect.isRtlLang(eaf.localization.currentLanguage.name);

        if (isRtl) {
            document.documentElement.setAttribute('dir', 'rtl');
        }

        const cssPostfix = isRtl ? '-rtl' : '';
        const styleLoaderService = new StyleLoaderService();

        let styleUrls = [
            AppConsts.appBaseUrl + '/assets/common/styles/themes/' + theme + '/style.bundle.css',
            AppConsts.appBaseUrl + '/assets/common/styles/themes/' + theme + '/customize.css'
        ].concat(DynamicResourcesHelper.getAdditionalThemeAssets());

        styleLoaderService.loadArray(styleUrls);

        if (isRtl) {
            styleLoaderService.load(
                AppConsts.appBaseUrl + '/assets/common/styles/abp-zero-template-rtl.min.css'
            );
        }

        return Promise.resolve(true);
    }

    static getAdditionalThemeAssets(): string[] {
        let assetContributor = ThemeHelper.getTheme();
        if (!assetContributor) {
            return [];
        }

        return [];
    }
}
