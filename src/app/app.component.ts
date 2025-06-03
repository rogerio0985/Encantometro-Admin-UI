import { AfterViewInit, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from 'shared/common/app-component-base';
import { SignalRHelper } from 'shared/helpers/SignalRHelper';
import { LoginAttemptsModalComponent } from '@app/shared/layout/login-attempts-modal.component';
import { ChangePasswordModalComponent } from '@app/shared/layout/profile/change-password-modal.component';
import { ChangeProfilePictureModalComponent } from '@app/shared/layout/profile/change-profile-picture-modal.component';
import { MySettingsModalComponent } from '@app/shared/layout/profile/my-settings-modal.component';
import { NotificationSettingsModalComponent } from '@app/shared/layout/notifications/notification-settings-modal.component';
import { UserNotificationHelper } from '@app/shared/layout/notifications/UserNotificationHelper';
import { AppAuthenticationService } from '@shared/common/auth/app-authentication-service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatSignalrService } from 'app/shared/layout/chat/chat-signalr.service';
import { StorageService } from '@eaf/utils/storage.service';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { ChatBarComponent } from './shared/layout/chat/chat-bar.component';
import { CommonLookupModalComponent } from './shared/common/lookup/common-lookup-modal.component';


declare let gtag: Function;

@Component({
    templateUrl: './app.component.html'
})
export class AppComponent extends AppComponentBase implements OnInit, AfterViewInit {

    theme: string;
    chatConnected = false;

    @ViewChild('loginAttemptsModal') loginAttemptsModal: LoginAttemptsModalComponent;
    @ViewChild('changePasswordModal') changePasswordModal: ChangePasswordModalComponent;
    @ViewChild('changeProfilePictureModal') changeProfilePictureModal: ChangeProfilePictureModalComponent;
    @ViewChild('mySettingsModal') mySettingsModal: MySettingsModalComponent;
    @ViewChild('notificationSettingsModal') notificationSettingsModal: NotificationSettingsModalComponent;
    @ViewChild('chatBarComponent') chatBarComponent: ChatBarComponent;
    @ViewChild('userLookupModal') userLookupModal: CommonLookupModalComponent;

    public constructor(
        injector: Injector,
        private _chatSignalrService: ChatSignalrService,
        private _userNotificationHelper: UserNotificationHelper,
        private _appAuthenticationService: AppAuthenticationService,
        private _storageService: StorageService,
        private router: Router,
        private gtmService: GoogleTagManagerService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._userNotificationHelper.settingsModal = this.notificationSettingsModal;
        this.theme = eaf.setting.get('App.UiManagement.Theme').toLocaleLowerCase();

        this.registerModalOpenEvents();

        if (this.appSession.application) {
            SignalRHelper.init(this._storageService);
            SignalRHelper.initSignalR(() => { this._chatSignalrService.init(); });
        }
        this.setUpAnalytics();
        this.setUpTagManager();
    }

    ngAfterViewInit(): void {
        eaf.signalr.autoConnect = false;
        this._appAuthenticationService.init();
    }

    setUpAnalytics(): void {
        if (AppConsts.googleAnalytics !== undefined) {
            this.router.events.pipe(filter(event => event instanceof NavigationEnd))
                .subscribe((event: NavigationEnd) => {
                    gtag('config', AppConsts.googleAnalytics, { page_path: event.urlAfterRedirects });
                    gtag('set', 'page', event.urlAfterRedirects);
                    gtag('send', 'pageview');
                });
        }
    }

    setUpTagManager(): void {
        if (AppConsts.googleTagManager !== undefined) {
            this.router.events.forEach(item => {
                if (item instanceof NavigationEnd) {
                    const gtmTag = {
                        event: 'page',
                        pageName: item.url
                    };
                    this.gtmService.pushTag(gtmTag);
                }
            });
        }
    }

    registerModalOpenEvents(): void {
        eaf.event.on('app.show.loginAttemptsModal', () => {
            this.loginAttemptsModal.show();
        });

        eaf.event.on('app.show.changePasswordModal', () => {
            this.changePasswordModal.show();
        });

        eaf.event.on('app.show.changeProfilePictureModal', () => {
            this.changeProfilePictureModal.show();
        });

        eaf.event.on('app.show.mySettingsModal', () => {
            this.mySettingsModal.show();
        });
        eaf.event.on('app.chat.connected', () => {
            this.chatConnected = true;
        });
    }

    onMySettingsModalSaved(): void {
        eaf.event.trigger('app.onMySettingsModalSaved');
    }
}
