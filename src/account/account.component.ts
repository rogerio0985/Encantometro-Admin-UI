import { Component, Injector, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { LoginService } from './login/login.service';
import { StorageService } from '@eaf/utils/storage.service';

@Component({
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class AccountComponent extends AppComponentBase implements OnInit {

    private viewContainerRef: ViewContainerRef;

    currentLanguage: eaf.localization.ILanguageInfo;
    languages: eaf.localization.ILanguageInfo[] = [];

    currentYear: number = moment().year();
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    public constructor(
        injector: Injector,
        private _router: Router,
        private _loginService: LoginService,
        private _uiCustomizationService: AppUiCustomizationService,
        viewContainerRef: ViewContainerRef,
        private _storageService: StorageService
    ) {
        super(injector);

        // We need this small hack in order to catch application root view container ref for modals
        this.viewContainerRef = viewContainerRef;
    }

    showTenantChange(): boolean {
        if (!this._router.url) {
            return false;
        }

        return eaf.multiTenancy.isEnabled;
    }

    useFullWidthLayout(): boolean {
        return false;
    }

    ngOnInit(): void {
        document.body.className = this._uiCustomizationService.getAccountModuleBodyClass();

        this.languages = _.filter(eaf.localization.languages, l => (<any>l).isDisabled === false);
        this.currentLanguage = eaf.localization.currentLanguage;
    }

    goToHome(): void {
        (window as any).location.href = '/';
    }

    getBgUrl(): string {
        return 'url(./assets/common/images/encatometrofundo.png)';
    }

    changeLanguage(language: eaf.localization.ILanguageInfo) {
        this._storageService.setCookieValue(
            'Eaf.Localization.CultureName',
            language.name,
            new Date(new Date().getTime() + 5 * 365 * 86400000), // 5 year
            eaf.appPath
        );

        location.reload();
    }
}
