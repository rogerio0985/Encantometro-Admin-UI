import { EafModule } from '@eaf/eaf.module';
import * as ngCommon from '@angular/common';
import { NgModule, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './globalErrorHandler';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { ChatSignalrService } from '@app/shared/layout/chat/chat-signalr.service';
import { LoginAttemptsModalComponent } from '@app/shared/layout/login-attempts-modal.component';
import { ChangePasswordModalComponent } from '@app/shared/layout/profile/change-password-modal.component';
import { ChangeProfilePictureModalComponent } from '@app/shared/layout/profile/change-profile-picture-modal.component';
import { MySettingsModalComponent } from '@app/shared/layout/profile/my-settings-modal.component';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { FileUploadModule } from 'ng2-file-upload';
import { ModalModule, TabsModule, TooltipModule, BsDropdownModule } from 'ngx-bootstrap';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { FileUploadModule as PrimeNgFileUploadModule, PaginatorModule, ProgressBarModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { ImpersonationService } from './admin/users/impersonation.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DefaultLayoutComponent } from './shared/layout/themes/default/default-layout.component';
import { Theme4LayoutComponent } from './shared/layout/themes/theme4/theme4-layout.component';
import { Theme2LayoutComponent } from './shared/layout/themes/theme2/theme2-layout.component';
import { Theme3LayoutComponent } from './shared/layout/themes/theme3/theme3-layout.component';
import { AppCommonModule } from './shared/common/app-common.module';
import { SideBarMenuComponent } from './shared/layout/nav/side-bar-menu.component';
import { TopBarMenuComponent } from './shared/layout/nav/top-bar-menu.component';
import { TopBarComponent } from './shared/layout/topbar.component';
import { TitleBarComponent } from './shared/layout/titlebar.component';
import { DefaultBrandComponent } from './shared/layout/themes/default/default-brand.component';
import { Theme4BrandComponent } from './shared/layout/themes/theme4/theme4-brand.component';
import { Theme2BrandComponent } from './shared/layout/themes/theme2/theme2-brand.component';
import { Theme3BrandComponent } from './shared/layout/themes/theme3/theme3-brand.component';
import { UserNotificationHelper } from './shared/layout/notifications/UserNotificationHelper';
import { HeaderNotificationsComponent } from './shared/layout/notifications/header-notifications.component';
import { NotificationSettingsModalComponent } from './shared/layout/notifications/notification-settings-modal.component';
import { NotificationsComponent } from './shared/layout/notifications/notifications.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TextMaskModule } from 'angular2-text-mask';
import { ImageCropperModule } from 'ngx-image-cropper';
import { CookieService } from 'ngx-cookie-service';
import { NgxCaptchaModule } from 'ngx-captcha';
import { SwUpdate, ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';


// Metronic
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
    // suppressScrollX: true
};

import { CoreModule } from '@metronic/app/core/core.module';

import { LayoutConfigService } from '@metronic/app/core/services/layout-config.service';
import { UtilsService } from '@metronic/app/core/services/utils.service';
import { LayoutRefService } from '@metronic/app/core/services/layout-ref.service';
import { AdmBarComponent } from './shared/layout/nav/adm-bar.component';
import { AppConsts } from "shared/AppConsts";
import { ChatBarComponent } from './shared/layout/chat/chat-bar.component';
import { ChatFriendListItemComponent } from './shared/layout/chat/chat-friend-list-item.component';
import { ChatMessageComponent } from './shared/layout/chat/chat-message.component';

export const googleTagManager = () => AppConsts.googleTagManager;

@NgModule({
    declarations: [
        AppComponent,
        DefaultLayoutComponent,
        Theme4LayoutComponent,
        Theme2LayoutComponent,
        Theme3LayoutComponent,
        HeaderNotificationsComponent,
        SideBarMenuComponent,
        AdmBarComponent,
        TopBarMenuComponent,
        LoginAttemptsModalComponent,
        ChangePasswordModalComponent,
        ChangeProfilePictureModalComponent,
        MySettingsModalComponent,
        NotificationsComponent,
        NotificationSettingsModalComponent,
        TopBarComponent,
        TitleBarComponent,
        DefaultBrandComponent,
        Theme4BrandComponent,
        Theme2BrandComponent,
        Theme3BrandComponent,
        ChatBarComponent,
        ChatFriendListItemComponent,
        ChatMessageComponent,
    ],
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        TabsModule.forRoot(),
        BsDropdownModule.forRoot(),
        PopoverModule.forRoot(),
        FileUploadModule,
        EafModule,
        AppRoutingModule,
        UtilsModule,
        AppCommonModule.forRoot(),
        ServiceProxyModule,
        TableModule,
        PaginatorModule,
        PrimeNgFileUploadModule,
        ProgressBarModule,
        PerfectScrollbarModule,
        CoreModule,
        NgxChartsModule,
        TextMaskModule,
        ImageCropperModule,
        NgxCaptchaModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        ImpersonationService,
        UserNotificationHelper,
        ChatSignalrService,
        {
            provide: PERFECT_SCROLLBAR_CONFIG,
            useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
        },
        LayoutConfigService,
        UtilsService,
        LayoutRefService,
        CookieService,
        { provide: 'googleTagManagerId', useValue: googleTagManager() },
        { provide: ErrorHandler, useClass: GlobalErrorHandler }
    ]
})
export class AppModule {
    constructor(public updates: SwUpdate) {
        if (updates.isEnabled) {
            updates.activated.subscribe(event => {
                console.log('old version was', event.previous);
                console.log('new version is', event.current);
            });

            updates.available.subscribe(event => {
                console.log('current version is', event.current);
                console.log('available version is', event.available);
                updates.activateUpdate().then(() => this.updateApp());
            });
        }
    }

    updateApp() {
        document.location.reload();
        console.log("The app is updating right now");
    }

}
