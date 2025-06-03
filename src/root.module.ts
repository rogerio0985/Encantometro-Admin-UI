import { EafModule } from '@eaf/eaf.module';
import { PlatformLocation, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, Injector, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { AppConsts } from '@shared/AppConsts';
import { CommonModule } from '@shared/common/common.module';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    API_BASE_URL,
    UiCustomizationSettingsDto
} from '@shared/service-proxies/service-proxies';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import * as localForage from 'localforage';
import * as _ from 'lodash';
import { AppPreBootstrap } from './AppPreBootstrap';
import { AppModule } from './app/app.module';
import { RootRoutingModule } from './root-routing.module';
import { RootComponent } from './root.component';
import { DomHelper } from '@shared/helpers/DomHelper';
import { CookieConsentService } from '@shared/common/session/cookie-consent.service';
import { NgxBootstrapDatePickerConfigService } from 'assets/lib/ngx-bootstrap/ngx-bootstrap-datepicker-config.service';
import { StorageService } from '@eaf/utils/storage.service';

export function appInitializerFactory(
    injector: Injector,
    platformLocation: PlatformLocation,
    storageService: StorageService
) {
    return () => {
        eaf.ui.setBusy();
        return new Promise<boolean>((resolve, reject) => {
            AppConsts.appBaseHref = getBaseHref(platformLocation);
            let appBaseUrl = getDocumentOrigin() + AppConsts.appBaseHref;
            AppPreBootstrap.Init(storageService);
            AppPreBootstrap.run(appBaseUrl, () => {
                handleLogoutRequest(injector.get(AppAuthService));
                initializeLocalForage();

                let appSessionService: AppSessionService = injector.get(AppSessionService);
                appSessionService.init().then((result) => {
                    initializeAppCssClasses(injector, result);
                    initializeTenantResources(injector);
                    initializeCookieConsent(injector);
                    registerLocales(resolve, reject);
                }, (err) => {
                    eaf.ui.clearBusy();
                    reject(err);
                });


            }, resolve, reject);
        });
    };
}

function initializeLocalForage() {
    localForage.config({
        driver: localForage.LOCALSTORAGE,
        name: 'Encantometro',
        version: 1.0,
        storeName: 'Encantometro',
        description: 'Cached data for Encantometro'
    });
}

function initializeAppCssClasses(injector: Injector, theme: UiCustomizationSettingsDto) {
    let appUiCustomizationService = injector.get(AppUiCustomizationService);
    appUiCustomizationService.init(theme);

    //Css classes based on the layout
    if (eaf.session.userId) {
        document.body.className = appUiCustomizationService.getAppModuleBodyClass();
    } else {
        document.body.className = appUiCustomizationService.getAccountModuleBodyClass();
    }
}

function initializeTenantResources(injector: Injector) {
    let appSessionService: AppSessionService = injector.get(AppSessionService);

    let metaImage = DomHelper.getElementByAttributeValue('meta', 'property', 'og:image');
    if (metaImage) {
        //set og share image meta tag
        metaImage.setAttribute('content', window.location.origin + '/assets/common/images/eaf/eaf-' + eaf.setting.get(appSessionService.theme.baseSettings.theme + '.' + 'App.UiManagement.Left.AsideSkin') + '.png');
    }
}

function initializeCookieConsent(injector: Injector) {
    let cookieConsentService: CookieConsentService = injector.get(CookieConsentService);
    cookieConsentService.init();
}

function getDocumentOrigin() {
    if (!document.location.origin) {
        return document.location.protocol + '//' + document.location.hostname + (document.location.port ? ':' + document.location.port : '');
    }

    return document.location.origin;
}

function registerLocales(resolve: (value?: boolean | Promise<boolean>) => void, reject: any) {
    if (shouldLoadLocale()) {
        let angularLocale = convertEafLocaleToAngularLocale(eaf.localization.currentLanguage.name);
        import(`@angular/common/locales/${angularLocale}.js`)
            .then(module => {
                registerLocaleData(module.default);
                NgxBootstrapDatePickerConfigService.registerNgxBootstrapDatePickerLocales().then(_ => {
                    resolve(true);
                });
            }, reject);
    } else {
        NgxBootstrapDatePickerConfigService.registerNgxBootstrapDatePickerLocales().then(_ => {
            resolve(true);
        });
    }
}

export function shouldLoadLocale(): boolean {
    return eaf.localization.currentLanguage.name && eaf.localization.currentLanguage.name !== 'en-US';
}

export function convertEafLocaleToAngularLocale(locale: string): string {
    if (!AppConsts.localeMappings) {
        return locale;
    }

    let localeMapings = _.filter(AppConsts.localeMappings, { from: locale });
    if (localeMapings && localeMapings.length) {
        return localeMapings[0]['to'];
    }

    return locale;
}

export function getRemoteServiceBaseUrl(): string {
    return AppConsts.remoteServiceBaseUrl;
}

export function getCurrentLanguage(): string {
    return eaf.localization.currentLanguage.name;
}

export function getBaseHref(platformLocation: PlatformLocation): string {
    let baseUrl = platformLocation.getBaseHrefFromDOM();
    if (baseUrl) {
        return baseUrl;
    }

    return '/';
}

function handleLogoutRequest(authService: AppAuthService) {
    let currentUrl = UrlHelper.initialUrl;
    let returnUrl = UrlHelper.getReturnUrl();
    if (currentUrl.indexOf(('account/logout')) >= 0 && returnUrl) {
        authService.logout(true, returnUrl);
    }
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppModule,
        CommonModule.forRoot(),
        EafModule,
        ServiceProxyModule,
        HttpClientModule,
        RootRoutingModule
    ],
    declarations: [
        RootComponent
    ],
    providers: [
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [Injector, PlatformLocation, StorageService],
            multi: true
        },
        {
            provide: LOCALE_ID,
            useFactory: getCurrentLanguage
        }
    ],
    bootstrap: [RootComponent]
})
export class RootModule {

}
