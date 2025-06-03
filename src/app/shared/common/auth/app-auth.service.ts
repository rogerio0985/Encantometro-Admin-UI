import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { XmlHttpRequestHelper } from '@shared/helpers/XmlHttpRequestHelper';
import { StorageService } from '@eaf/utils/storage.service';

@Injectable()
export class AppAuthService {

    constructor(private storageService: StorageService) { }

    logout(reload?: boolean, returnUrl?: string): void {
        let customHeaders = {
            'Eaf.TenantId': eaf.multiTenancy.getTenantIdCookie(),
            'Authorization': 'Bearer ' + eaf.auth.getToken()
        };

        XmlHttpRequestHelper.ajax(
            'GET',
            AppConsts.remoteServiceBaseUrl + '/api/TokenAuth/LogOut',
            customHeaders,
            null,
            () => {

                this.storageService.Clear();
                eaf.auth.clearToken();
                this.storageService.setCookieValue(eaf.auth.tokenCookieName, undefined, undefined, eaf.appPath);
                this.storageService.setCookieValue(AppConsts.authorization.encrptedAuthTokenName, undefined, undefined, eaf.appPath);

                if (reload !== false) {
                    if (returnUrl) {
                        location.href = returnUrl;
                    } else {
                        location.href = '';
                    }
                }
            }
        );
    }
}
