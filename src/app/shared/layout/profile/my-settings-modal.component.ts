﻿import { Component, ElementRef, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CurrentUserProfileEditDto,  ProfileServiceProxy, SettingScopes } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'mySettingsModal',
    templateUrl: './my-settings-modal.component.html'
})
export class MySettingsModalComponent extends AppComponentBase {

    @ViewChild('mySettingsModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    public active = false;
    public saving = false;
    public user: CurrentUserProfileEditDto;
    public canChangeUserName: boolean;
    public defaultTimezoneScope: SettingScopes = AppTimezoneScope.User;
    private _initialTimezone: string = undefined;
    isTwoFactorLoginEnabledForApplication = false;

    constructor(
        injector: Injector,
        private _profileService: ProfileServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.isTwoFactorLoginEnabledForApplication =
            eaf.setting.getBoolean('App.UserManagement.TwoFactorLogin.IsEnabled');
    }

    show(): void {
        this.active = true;
        this._profileService.getCurrentUserProfileForEdit().subscribe((result) => {
            this.user = result;
            this._initialTimezone = result.timezone;
            this.canChangeUserName = this.user.userName !== AppConsts.userManagement.defaultAdminUserName;
            this.modal.show();
        });
    }

    onShown(): void {
        document.getElementById('Name').focus();
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    save(): void {
        this.saving = true;
        this._profileService.updateCurrentUserProfile(this.user)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.appSession.user.name = this.user.name;
                this.appSession.user.surname = this.user.surname;
                this.appSession.user.userName = this.user.userName;
                this.appSession.user.emailAddress = this.user.emailAddress;

                this.notify.success(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);

                if (eaf.clock.provider.supportsMultipleTimezone && this._initialTimezone !== this.user.timezone) {
                    this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).then(() => {
                        window.location.reload();
                    });
                }
            });
    }
}
