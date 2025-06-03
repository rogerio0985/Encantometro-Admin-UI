import { Component, Injector, OnInit, ViewEncapsulation, NgZone } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { NotificationServiceProxy, UserNotification, UserNotificationState } from '@shared/service-proxies/service-proxies';
import { IFormattedUserNotification, UserNotificationHelper } from './UserNotificationHelper';
import * as _ from 'lodash';
import * as Push from 'push.js'; // if using ES6
import { environment } from 'environments/environment';

@Component({
    templateUrl: './header-notifications.component.html',
    selector: '[headerNotifications]',
    encapsulation: ViewEncapsulation.None
})
export class HeaderNotificationsComponent extends AppComponentBase implements OnInit {

    notifications: IFormattedUserNotification[] = [];
    unreadUserNotification: UserNotification[] = [];
    unreadNotificationCount = 0;

    constructor(
        injector: Injector,
        private _notificationService: NotificationServiceProxy,
        private _userNotificationHelper: UserNotificationHelper,
        public _zone: NgZone
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.registerToEvents();
        this.loadNotifications();
    }

    loadNotifications(): void {
        let self = this;
        this._notificationService.getUserNotifications(undefined, 3, 0)
        .subscribe(result => {
            self.unreadNotificationCount = result.unreadCount;
            self.notifications = [];
            
            _.forEach(result.items, (item: UserNotification) => {
                self.notifications.push(self._userNotificationHelper.format(<any>item));
                if(item.state == UserNotificationState.Unread) {
                    self.unreadUserNotification.push(item);
                }
            });

            _.forEach(self.unreadUserNotification, (item: UserNotification) =>{
                self._zone.run(() => {
                    self._userNotificationHelper.show(<any>item);
                }); 
            });
        });
    }

    registerToEvents() {
        let self = this;
        if(environment.production){
            Push.default.config({serviceWorker: './ngsw-worker.js'});
        }
        function onNotificationReceived(userNotification) {
            self._userNotificationHelper.show(userNotification);
            self.loadNotifications();
        }

        eaf.event.on('eaf.notifications.received', userNotification => {
            self._zone.run(() => {
                onNotificationReceived(userNotification);
            });
        });

        function onNotificationsRefresh() {
            self.loadNotifications();
        }

        eaf.event.on('app.notifications.refresh', () => {
            self._zone.run(() => {
                onNotificationsRefresh();
            });
        });

        function onNotificationsRead(userNotificationId) {
            for (let i = 0; i < self.notifications.length; i++) {
                if (self.notifications[i].userNotificationId === userNotificationId) {
                    self.notifications[i].state = 'READ';
                    self.notifications[i].isUnread = false;
                }
            }

            self.unreadNotificationCount -= 1;
        }

        eaf.event.on('app.notifications.read', userNotificationId => {
            self._zone.run(() => {
                onNotificationsRead(userNotificationId);
            });
        });
    }

    setAllNotificationsAsRead(): void {
        this._userNotificationHelper.setAllAsRead();
    }

    openNotificationSettingsModal(): void {
        this._userNotificationHelper.openSettingsModal();
    }

    setNotificationAsRead(userNotification: IFormattedUserNotification): void {
        if (userNotification.state !== 'READ') {
            this._userNotificationHelper.setAsRead(userNotification.userNotificationId);
        }
    }

    gotoUrl(url): void {
        if (url) {
            location.href = url;
        }
    }
}
