
import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AppTimezoneScope } from '@shared/AppEnums';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    SettingScopes,
    HostSettingsEditDto,
    HostSettingsServiceProxy,
    SendTestEmailInput,
    JsonClaimMapDto
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { KeyValueListManagerComponent } from '@app/shared/common/key-value-list-manager/key-value-list-manager.component';

@Component({
    templateUrl: './settings.component.html',
    animations: [appModuleAnimation()]
})
export class SettingsComponent extends AppComponentBase implements OnInit {

    @ViewChild('openIdConnectClaimsMappingManager') openIdConnectClaimsMappingManager: KeyValueListManagerComponent;

    loading = false;
    hostSettings: HostSettingsEditDto;
    testEmailAddress: string = undefined;
    showTimezoneSelection = eaf.clock.provider.supportsMultipleTimezone;
    defaultTimezoneScope: SettingScopes = AppTimezoneScope.Application;

    usingDefaultTimeZone = false;
    openIdConnectClaimMappings: { key: string, value: string }[];
    enabledSocialLoginSettings: string[];
    initialTimeZone: string = undefined;


    constructor(
        injector: Injector,
        private _hostSettingService: HostSettingsServiceProxy
    ) {
        super(injector);
    }

    loadHostSettings(): void {
        const self = this;
        self._hostSettingService.getAllSettings()
            .subscribe(setting => {
                self.hostSettings = setting;
                self.initialTimeZone = setting.general.timezone;
                self.usingDefaultTimeZone = setting.general.timezoneForComparison === self.setting.get('Eaf.Timing.TimeZone');
 				this.openIdConnectClaimMappings = this.hostSettings.externalLoginProviderSettings.openIdConnectClaimsMapping
                    .map(item => {
                        return {
                            key: item.key,
                            value: item.claim
                        };
                    });
            });
    }

    init(): void {
        const self = this;
        self.testEmailAddress = self.appSession.user.emailAddress;
        self.showTimezoneSelection = eaf.clock.provider.supportsMultipleTimezone;
        self.loadHostSettings();
		self.loadSocialLoginSettings();
    }

    ngOnInit(): void {
        const self = this;
        self.init();
    }

    sendTestEmail(): void {
        const self = this;
        const input = new SendTestEmailInput();
        input.emailAddress = self.testEmailAddress;
        self._hostSettingService.sendTestEmail(input).subscribe(result => {
            self.notify.success(self.l('TestEmailSentSuccessfully'));
        });
    }

    saveAll(): void {
        const self = this;
        self._hostSettingService.updateAllSettings(self.hostSettings).subscribe(result => {
            self.notify.success(self.l('SavedSuccessfully'));

            AppConsts.appActiveDirectoryEnabled =
                self.hostSettings.azureActiveDirectory.isModuleEnabled &&
                self.hostSettings.azureActiveDirectory.isEnabled;

            AppConsts.appLdapEnabled =
                self.hostSettings.ldap.isModuleEnabled &&
                self.hostSettings.ldap.isEnabled;

            if (eaf.clock.provider.supportsMultipleTimezone && self.usingDefaultTimeZone && self.initialTimeZone !== self.hostSettings.general.timezone) {
                self.message.info(self.l('TimeZoneSettingChangedRefreshPageNotification')).then(() => {
                    window.location.reload();
                });
            }
        });
    }

    loadSocialLoginSettings(): void {
        const self = this;
        self.enabledSocialLoginSettings = ['Google', 'Microsoft', 'OpenId'];
    }

    clearAdSettings(): void {
        const self = this;

        if(self.hostSettings.azureActiveDirectory.isEnabled) {

            this.message.confirm(
                this.l('UserActiveDirectoryDeleteAllWarningMessage'),
                this.l('AreYouSure'),
                (isConfirmed) => {
                    if (isConfirmed) {
                        self.hostSettings.azureActiveDirectory.clientId = "";
                        self.hostSettings.azureActiveDirectory.clientSecret = "";
                        self.hostSettings.azureActiveDirectory.tenant = "";

                        self.hostSettings.userManagement.isRegisterRequiredForLogin = false;
                    }
                    else {
                        self.hostSettings.azureActiveDirectory.isEnabled = true;
                    }
                }
            );
        }
    }

    clearLdapSettings(): void {
        const self = this;

        if(self.hostSettings.ldap.isEnabled) {
            this.message.confirm(
                this.l('UserLdapDeleteAllWarningMessage'),
                this.l('AreYouSure'),
                (isConfirmed) => {
                    if (isConfirmed) {
                        self.hostSettings.ldap.domain = "";
                        self.hostSettings.ldap.userName = "";
                        self.hostSettings.ldap.password = "";

                        self.hostSettings.userManagement.isRegisterRequiredForLogin = false;
                    }
                    else {
                        self.hostSettings.ldap.isEnabled = true;
                    }
                }
            );
        }
    }

    mapClaims(): void {
        if (this.openIdConnectClaimsMappingManager) {
            this.hostSettings.externalLoginProviderSettings.openIdConnectClaimsMapping = this.openIdConnectClaimsMappingManager.getItems()
                .map(item =>
                    new JsonClaimMapDto({
                        key: item.key,
                        claim: item.value
                    })
                );
        }
    }

}
