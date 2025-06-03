import {
     UserNotificationState,
} from '@shared/service-proxies/service-proxies';

export class AppTimezoneScope {
    static Application: number = 1;
    static Tenant: number = 2;
    static User: number = 4;
    static All: number = 7;
}

export class AppUserNotificationState {
    static Unread: number = UserNotificationState.Unread;
    static Read: number = UserNotificationState.Read;
}


