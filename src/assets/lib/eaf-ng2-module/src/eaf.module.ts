import { NgModule } from '@angular/core';
import { EafSessionService } from './session/eaf-session.service';
import { PermissionCheckerService } from './auth/permission-checker.service';
import { FeatureCheckerService } from './features/feature-checker.service';
import { LocalizationService } from './localization/localization.service';
import { SettingService } from './settings/setting.service';
import { NotifyService } from './notify/notify.service';
import { MessageService } from './message/message.service';
import { LogService } from './log/log.service';
import { EafMultiTenancyService } from './multi-tenancy/eaf-multi-tenancy.service';
import { EafHttpConfiguration } from './eafHttpInterceptor';
import { EafUserConfigurationService } from './eaf-user-configuration.service';
import { TokenService } from './auth/token.service';
import { StorageService } from './utils/storage.service';

@NgModule({
    declarations: [
    ],

    providers: [
        EafSessionService,
        PermissionCheckerService,
        FeatureCheckerService,
        LocalizationService,
        SettingService,
        NotifyService,
        MessageService,
        LogService,
        EafMultiTenancyService,
        EafUserConfigurationService,
        EafHttpConfiguration,
        TokenService,
        StorageService
    ]
})
export class EafModule { }
