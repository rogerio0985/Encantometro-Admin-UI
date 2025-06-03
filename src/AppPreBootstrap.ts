import { StorageService } from '@eaf/utils/storage.service';
import { CompilerOptions, NgModuleRef, Type } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from './shared/helpers/UrlHelper';
import { XmlHttpRequestHelper } from '@shared/helpers/XmlHttpRequestHelper';
import { DynamicResourcesHelper } from '@shared/helpers/DynamicResourcesHelper';
import { environment } from './environments/environment';


import * as moment from 'moment';
import * as _ from 'lodash';

export class AppPreBootstrap {

    private static storageService: StorageService;

    static Init(storageService: StorageService) {
        this.storageService = storageService;
    }

    static run(appRootUrl: string, callback: () => void, resolve: any, reject: any): void {
        AppPreBootstrap.getApplicationConfig(appRootUrl, () => {

            const queryStringObj = UrlHelper.getQueryParameters();

            if (queryStringObj.impersonationToken) {
                AppPreBootstrap.impersonatedAuthenticate(queryStringObj.impersonationToken, queryStringObj.tenantId, () => { AppPreBootstrap.getUserConfiguration(callback); });
            } else {
                AppPreBootstrap.getUserConfiguration(callback);
            }
        });
    }

    static bootstrap<TM>(moduleType: Type<TM>, compilerOptions?: CompilerOptions | CompilerOptions[]): Promise<NgModuleRef<TM>> {
        return platformBrowserDynamic().bootstrapModule(moduleType, compilerOptions);
    }

    private static getApplicationConfig(appRootUrl: string, callback: () => void) {
        let type = 'GET';
        let url = appRootUrl + 'assets/' + environment.appConfig;
        let customHeaders = [
            {
                name: 'Eaf.TenantId',
                value: eaf.multiTenancy.getTenantIdCookie() + ''
            }];

        XmlHttpRequestHelper.ajax(type, url, customHeaders, null, (result) => {

            AppConsts.appBaseUrlFormat = result.appBaseUrl;
            AppConsts.remoteServiceBaseUrlFormat = result.remoteServiceBaseUrl;
            AppConsts.localeMappings = result.localeMappings;

            AppConsts.appBaseUrl = result.appBaseUrl;
            AppConsts.remoteServiceBaseUrl = result.remoteServiceBaseUrl;

            callback();
        });
    }

    private static getCurrentClockProvider(currentProviderName: string): eaf.timing.IClockProvider {
        if (currentProviderName === 'unspecifiedClockProvider') {
            return eaf.timing.unspecifiedClockProvider;
        }

        if (currentProviderName === 'utcClockProvider') {
            return eaf.timing.utcClockProvider;
        }

        return eaf.timing.localClockProvider;
    }

    private static impersonatedAuthenticate(impersonationToken: string, tenantId: number, callback: () => void): void {
        eaf.multiTenancy.setTenantIdCookie(tenantId);
        const cookieLangValue = this.storageService.getCookieValue('Eaf.Localization.CultureName');

        let requestHeaders = {
            '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
            'Eaf.TenantId': eaf.multiTenancy.getTenantIdCookie(),
            'Eaf.Localization.CultureName': cookieLangValue
        };

        XmlHttpRequestHelper.ajax(
            'POST',
            AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/ImpersonatedAuthenticate?impersonationToken=' + impersonationToken,
            requestHeaders,
            null,
            (response) => {
                let result = response.result;
                eaf.auth.setToken(result.accessToken);
                AppPreBootstrap.setEncryptedTokenCookie(result.encryptedAccessToken);
                location.search = '';
                callback();
            }
        );
    }


    private static getUserConfiguration(callback: () => void): any {
        var cookieLangValue = this.storageService.getCookieValue('Eaf.Localization.CultureName');

        if (cookieLangValue == null || cookieLangValue == '') {
            cookieLangValue = 'pt-BR';
            this.storageService.setCookieValue(
                'Eaf.Localization.CultureName',
                cookieLangValue,
                new Date(new Date().getTime() + 5 * 365 * 86400000), // 5 year
                eaf.appPath
            );
        }

        const token = this.storageService.getCookieValue(eaf.auth.tokenCookieName);

        let requestHeaders = {
            '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
            'Eaf.TenantId': eaf.multiTenancy.getTenantIdCookie()
        };

        if (token) {
            requestHeaders['Authorization'] = 'Bearer ' + token;
        }

        return XmlHttpRequestHelper.ajax('GET', AppConsts.remoteServiceBaseUrl + '/EafUserConfiguration/GetAll', requestHeaders, null, (response) => {
            let result = response.result;

            _.merge(eaf, result);

            eaf.clock.provider = this.getCurrentClockProvider(result.clock.provider);

            moment.locale(eaf.localization.currentLanguage.name);
            (window as any).moment.locale(eaf.localization.currentLanguage.name);

            if (eaf.clock.provider.supportsMultipleTimezone) {
                moment.tz.setDefault(eaf.timing.timeZoneInfo.iana.timeZoneId);
                (window as any).moment.tz.setDefault(eaf.timing.timeZoneInfo.iana.timeZoneId);
            }

            eaf.event.trigger('eaf.dynamicScriptsInitialized');

            DynamicResourcesHelper.loadResources(callback);
        });
    }

    private static setEncryptedTokenCookie(encryptedToken: string) {

        this.storageService.setCookieValue(AppConsts.authorization.encrptedAuthTokenName,
            encryptedToken,
            new Date(new Date().getTime() + 365 * 86400000), //1 year
            eaf.appPath
        );
    }
}
