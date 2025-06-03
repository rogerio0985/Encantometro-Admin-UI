﻿import { Injector, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { EafMultiTenancyService } from '@eaf/multi-tenancy/eaf-multi-tenancy.service';
import { EafSessionService } from '@eaf/session/eaf-session.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ChangeUserLanguageDto, ProfileServiceProxy } from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import { StorageService } from '@eaf/utils/storage.service';

@Component({
    templateUrl: './topbar.component.html',
    selector: 'topbar',
    encapsulation: ViewEncapsulation.None
})
export class TopBarComponent extends AppComponentBase implements OnInit {

    languages: eaf.localization.ILanguageInfo[];
    currentLanguage: eaf.localization.ILanguageInfo;
    isImpersonatedLogin = false;
    isMultiTenancyEnabled = false;
    shownLoginName = '';
    shownFullName = '';
    tenancyName = '';
    userName = '';
    profilePicture = AppConsts.appBaseUrl + '/assets/common/images/nopicture.png';
    defaultLogo = AppConsts.appBaseUrl + '/assets/common/images/eaf/eaf-' + this.currentTheme.baseSettings.menu.asideSkin + '.png';
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    unreadChatMessageCount = 0;
    chatConnected = false;
    isSystemUser = true;
    showChatMenu = false;

    constructor(
        injector: Injector,
        private _eafSessionService: EafSessionService,
        private _eafMultiTenancyService: EafMultiTenancyService,
        private _profileServiceProxy: ProfileServiceProxy,
        private _authService: AppAuthService,
        private _impersonationService: ImpersonationService,
        private _storageService: StorageService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.isMultiTenancyEnabled = this._eafMultiTenancyService.isEnabled;
        this.languages = _.filter(this.localization.languages, l => (l).isDisabled === false);

        this.currentLanguage = this.localization.currentLanguage;
        this.isImpersonatedLogin = this._eafSessionService.impersonatorUserId > 0;

        this.showChatMenu = this.feature.isEnabled('App.ChatFeature');

        this.setCurrentLoginInformations();
        this.getProfilePicture();

        this.registerToEvents();
    }

    registerToEvents() {
        eaf.event.on('app.profilePictureChanged', () => {
            this.getProfilePicture();
        });

        eaf.event.on('app.onMySettingsModalSaved', () => {
            this.onMySettingsModalSaved();
        });

        eaf.event.on('app.languagesChanged', () => {
            this.reloadLanguages();
        });

        eaf.event.on('app.chat.unreadMessageCountChanged', messageCount => {
            this.unreadChatMessageCount = messageCount;
        });

        eaf.event.on('app.chat.connected', () => {
            this.chatConnected = true;
        });
    }

    showChat(id: string): void {
        let side = document.getElementById(id);
        side.classList.add('mr-0');
    }


    changeLanguage(languageName: string): void {
        const input = new ChangeUserLanguageDto();
        input.languageName = languageName;

        this._storageService.setCookieValue(
            'Eaf.Localization.CultureName',
            languageName,
            new Date(new Date().getTime() + 5 * 365 * 86400000), //5 year
            eaf.appPath
        );
        this._profileServiceProxy.changeLanguage(input)
            .subscribe(() => {
                window.location.reload();
            });
    }

    reloadLanguages(): void {
        this.languages = _.filter(this.localization.languages, l => (<any>l).isDisabled == false);
    }

    setCurrentLoginInformations(): void {
        this.shownLoginName = this.appSession.getShownLoginName();
        this.shownFullName = this.appSession.user.name;
        this.tenancyName = this.appSession.tenancyName;
        this.userName = this.appSession.user.userName;
        this.isSystemUser = this.appSession.user.authenticationSource == undefined;
    }

    getProfilePicture(): void {
        this._profileServiceProxy.getProfilePicture().subscribe(result => {
            if (result && result.profilePicture) {
                this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
            }
        });
    }

    showLoginAttempts(): void {
        eaf.event.trigger('app.show.loginAttemptsModal');
    }

    changePassword(): void {
        eaf.event.trigger('app.show.changePasswordModal');
    }

    changeProfilePicture(): void {
        eaf.event.trigger('app.show.changeProfilePictureModal');
    }

    changeMySettings(): void {
        eaf.event.trigger('app.show.mySettingsModal');
    }

    logout(): void {
        this._authService.logout();
    }

    onMySettingsModalSaved(): void {
        this.shownLoginName = this.appSession.getShownLoginName();
    }

    backToMyAccount(): void {
        this._impersonationService.backToImpersonator();
    }


}
