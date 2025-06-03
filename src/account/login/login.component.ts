import { EafSessionService } from '@eaf/session/eaf-session.service';
import { Component, Injector, Input, OnInit } from '@angular/core';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SessionServiceProxy, UpdateUserSignInTokenOutput, TenantListDto, AccountServiceProxy } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from 'shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from './login.service';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './login.component.html',
    animations: [accountModuleAnimation()]
})
export class LoginComponent extends AppComponentBase implements OnInit {

    submitting = false;
    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    recaptchaSiteKey: string = AppConsts.recaptchaSiteKey;

    tenants: TenantListDto[] = [];
    selectedTenant: TenantListDto;

    @Input() isloginADMMicrosoft = true;

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _sessionService: EafSessionService,
        private _accountService: AccountServiceProxy,
        private _sessionAppService: SessionServiceProxy,
        private _reCaptchaV3Service: ReCaptchaV3Service
    ) {
        super(injector);
    }

    ngOnInit(): void {

        if (this.isMultiTenancyEnabled) {
            eaf.multiTenancy.setTenantIdCookie(null);

            this._accountService.getAllTenants().subscribe((result) => {
                this.tenants = result;
                eaf.ui.clearBusy();
            });
        }
        else {
            eaf.ui.clearBusy();
        }

        if (this._sessionService.userId > 0 && UrlHelper.getReturnUrl() && UrlHelper.getSingleSignIn()) {
            this._sessionAppService.updateUserSignInToken()
                .subscribe((result: UpdateUserSignInTokenOutput) => {
                    const initialReturnUrl = UrlHelper.getReturnUrl();
                    const returnUrl = initialReturnUrl + (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                        'accessToken=' + result.signInToken +
                        '&userId=' + result.encodedUserId +
                        '&tenantId=' + result.encodedTenantId;

                    location.href = returnUrl;
                });
        }
        this.handleExternalLoginCallbacks();
        this.loginService.init();
    }

    handleExternalLoginCallbacks(): void {
        let state = UrlHelper.getQueryParametersUsingHash().state;
        let parameters = UrlHelper.getQueryParameters();
        this.submitting = true;
        let adToken = parameters['token'];

        if(state && state.indexOf('openIdConnect') >= 0 || parameters['openIdConnect'] !== undefined ){
            this.loginService.openIdConnectLoginCallback({});
        }
    }

    login(): void {

        let recaptchaCallback = (token: string) => {
            this.submitting = true;
            this.loginService.authenticate( () => { this.submitting = false; }, null, token );
        };

        if (this.useCaptcha) {
            this._reCaptchaV3Service.execute(this.recaptchaSiteKey, 'login', (token) => {
                recaptchaCallback(token);
            });
        } else {
            recaptchaCallback(null);
        }
    }

    selectTenant(tenant: TenantListDto): void {
        this.selectedTenant = tenant;
        eaf.multiTenancy.setTenantIdCookie(this.selectedTenant.id);
    }

    selectHost(): void {
        this.selectedTenant = undefined;
        eaf.multiTenancy.setTenantIdCookie(null);
    }

    truncateStringWithPostfix(name: string): string {
        return eaf.utils.truncateStringWithPostfix(name, 30);
    }

    get useCaptcha(): boolean {
        return this.setting.getBoolean('App.UserManagement.UseCaptchaOnLogin');
    }

    externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    toggleLoginADM(){
        this.isloginADMMicrosoft = !this.isloginADMMicrosoft;
    }
}
