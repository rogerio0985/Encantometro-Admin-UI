import { TokenService } from '@eaf/auth/token.service';
import { LogService } from '@eaf/log/log.service';
import { StorageService } from '@eaf/utils/storage.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AuthenticateModel, AuthenticateResultModel, TokenAuthServiceProxy, ExternalAuthenticateModel, ExternalAuthenticateResultModel, ExternalLoginProviderInfoModel, LoginValidateServiceProxy } from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { ScriptLoaderService } from '@shared/utils/script-loader.service';
import { UserAgentApplication, AuthResponse } from 'msal';

declare const gapi: any;

export class ExternalLoginProvider extends ExternalLoginProviderInfoModel {

    static readonly GOOGLE: string = 'Google';
    static readonly MICROSOFT: string = 'Microsoft';
    static readonly OPENID: string = 'OpenIdConnect';

    icon: string;
    initialized = false;

    constructor(providerInfo: ExternalLoginProviderInfoModel) {
        super();

        this.name = providerInfo.name;
        this.clientId = providerInfo.clientId;
        this.tenantId = providerInfo.tenantId;
        this.additionalParams = providerInfo.additionalParams;
        this.icon = providerInfo.name.toLowerCase();
    }
}

@Injectable()
export class LoginService {

    authenticateModel: AuthenticateModel;
    authenticateResult: AuthenticateResultModel;
    rememberMe: boolean;

    static readonly twoFactorRememberClientTokenName = 'TwoFactorRememberClientToken';

    MSAL: UserAgentApplication; // Microsoft API
    externalLoginProviders: ExternalLoginProvider[] = [];

    constructor(
        private _tokenAuthService: TokenAuthServiceProxy,
        private _router: Router,
        private _storageService: StorageService,
        private _tokenService: TokenService,
        private _logService: LogService,
        private oauthService: OAuthService,
        private _loginValidate: LoginValidateServiceProxy
    ) {
        this.clear();
    }

    authenticate(finallyCallback?: () => void, redirectUrl?: string, captchaResponse?: string): void {
        finallyCallback = finallyCallback || (() => { });

        this.authenticateModel.singleSignIn = UrlHelper.getSingleSignIn();
        this.authenticateModel.returnUrl = UrlHelper.getReturnUrl();
        this.authenticateModel.captchaResponse = captchaResponse;

        this._tokenAuthService
            .authenticate(this.authenticateModel)
            .pipe(finalize(finallyCallback))
            .subscribe((result: AuthenticateResultModel) => {
                this.processAuthenticateResult(result, redirectUrl);
            });
    }


    private processAuthenticateResult(authenticateResult: AuthenticateResultModel, redirectUrl?: string) {
        this.authenticateResult = authenticateResult;

        if (authenticateResult.shouldResetPassword) {
            // Password reset

            this._router.navigate(['account/reset-password'], {
                queryParams: {
                    userId: authenticateResult.userId,
                    tenantId: eaf.session.tenantId,
                    resetCode: authenticateResult.passwordResetCode
                }
            });

            this.clear();

        } else if (authenticateResult.accessToken) {
            // Successfully logged in
            if (authenticateResult.returnUrl && !redirectUrl) {
                redirectUrl = authenticateResult.returnUrl;
            }

            this.login(
                authenticateResult.accessToken,
                authenticateResult.encryptedAccessToken,
                authenticateResult.expireInSeconds,
                this.rememberMe,
                redirectUrl
            );

        } else {
            // Unexpected result!

            this._logService.warn('Unexpected authenticateResult!');
            this._router.navigate(['account/login']);

        }
    }

    private login(accessToken: string, encryptedAccessToken: string, expireInSeconds: number, rememberMe?: boolean, redirectUrl?: string): void {

        let tokenExpireDate = rememberMe ? (new Date(new Date().getTime() + 10000 * expireInSeconds)) : (new Date(new Date().getTime() + 1000 * expireInSeconds));

        this._tokenService.setToken(
            accessToken,
            tokenExpireDate
        );

        this._storageService.setCookieValue(
            AppConsts.authorization.encrptedAuthTokenName,
            encryptedAccessToken,
            tokenExpireDate,
            eaf.appPath
        );

        this._loginValidate.validate().subscribe(() => {
            if (redirectUrl) {
                location.href = redirectUrl;
            } else {
                let initialUrl = UrlHelper.initialUrl;

                if (initialUrl.indexOf('/account') > 0) {
                    initialUrl = AppConsts.appBaseUrl;
                }

                location.href = initialUrl;
            }
        });
    }

    private clear(): void {
        this.authenticateModel = new AuthenticateModel();
        this.authenticateModel.rememberClient = false;
        this.authenticateResult = null;
        this.rememberMe = false;
    }

    private initExternalLoginProviders(callback?: any) {
        this._tokenAuthService
            .getExternalAuthenticationProviders()
            .subscribe((providers: ExternalLoginProviderInfoModel[]) => {
                this.externalLoginProviders = _.map(
                    providers,
                    (p) => new ExternalLoginProvider(p)
                );
                if (callback) {
                    callback();
                }
            });
    }

    private ensureExternalLoginProviderInitialized(
        loginProvider: ExternalLoginProvider,
        callback: () => void
    ) {
        if (loginProvider.initialized) {
            callback();
            return;
        }

        if (loginProvider.name === ExternalLoginProvider.GOOGLE) {
            new ScriptLoaderService()
                .load('https://apis.google.com/js/api.js')
                .then(() => {
                    gapi.load('client:auth2', () => {
                        gapi.client
                            .init({
                                clientId: loginProvider.clientId,
                                scope: 'openid profile email',
                            })
                            .then(() => {
                                callback();
                            });
                    });
                });
        } else if (loginProvider.name === ExternalLoginProvider.MICROSOFT) {
            this.MSAL = new UserAgentApplication({
                auth: {
                    clientId: loginProvider.clientId,
                    redirectUri: AppConsts.appBaseUrl,
                },
            });
            if (loginProvider.tenantId !== undefined) {
                this.MSAL.authority = "https://login.microsoftonline.com/" + loginProvider.tenantId + "/";
            }
            callback();
        } else if (loginProvider.name === ExternalLoginProvider.OPENID) {
            const authConfig = this.getOpenIdConnectConfig(loginProvider);
            this.oauthService.configure(authConfig);
            this.oauthService.initImplicitFlow('openIdConnect=1');
        }
    }

    public openIdConnectLoginCallback(resp) {
        this.initExternalLoginProviders(() => {
            let openIdProvider = _.filter(this.externalLoginProviders, {
                name: 'OpenIdConnect',
            })[0];
            let authConfig = this.getOpenIdConnectConfig(openIdProvider);

            this.oauthService.configure(authConfig);
            this.oauthService.tryLogin().then(() => {
                let claims = this.oauthService.getIdentityClaims();

                const model = new ExternalAuthenticateModel();
                model.authProvider = ExternalLoginProvider.OPENID;
                model.providerAccessCode = this.oauthService.getIdToken();
                model.providerKey = claims['sub'];
                model.singleSignIn = UrlHelper.getSingleSignIn();
                model.returnUrl = UrlHelper.getReturnUrl();

                this._tokenAuthService
                    .externalAuthenticate(model)
                    .subscribe((result: ExternalAuthenticateResultModel) => {
                        if (result.waitingForActivation) {
                            eaf.message.info(
                                'You have successfully registered. Waiting for activation!'
                            );
                            return;
                        }

                        this.login(
                            result.accessToken,
                            result.encryptedAccessToken,
                            result.expireInSeconds,
                            this.rememberMe,
                            result.returnUrl
                        );
                    });
            });
        });
    }

    private googleLoginStatusChangeCallback(isSignedIn) {
        if (isSignedIn) {
            const model = new ExternalAuthenticateModel();
            model.authProvider = ExternalLoginProvider.GOOGLE;
            model.providerAccessCode = gapi.auth2
                .getAuthInstance()
                .currentUser.get()
                .getAuthResponse().access_token;
            model.providerKey = gapi.auth2
                .getAuthInstance()
                .currentUser.get()
                .getBasicProfile()
                .getId();
            model.singleSignIn = UrlHelper.getSingleSignIn();
            model.returnUrl = UrlHelper.getReturnUrl();

            this._tokenAuthService
                .externalAuthenticate(model)
                .subscribe((result: ExternalAuthenticateResultModel) => {
                    if (result.waitingForActivation) {
                        eaf.message.info(
                            'You have successfully registered. Waiting for activation!'
                        );
                        return;
                    }

                    this.login(
                        result.accessToken,
                        result.encryptedAccessToken,
                        result.expireInSeconds,
                        this.rememberMe,
                        result.returnUrl
                    );
                });
        }
    }

    private microsoftLoginCallback(response: AuthResponse) {
        const model = new ExternalAuthenticateModel();
        model.authProvider = ExternalLoginProvider.MICROSOFT;
        model.providerAccessCode = response.accessToken;
        model.providerKey = response.idToken.objectId;
        model.singleSignIn = UrlHelper.getSingleSignIn();
        model.returnUrl = UrlHelper.getReturnUrl();

        this._tokenAuthService
            .externalAuthenticate(model)
            .subscribe((result: ExternalAuthenticateResultModel) => {
                if (result.waitingForActivation) {
                    eaf.message.info(
                        'You have successfully registered. Waiting for activation!'
                    );
                    return;
                }
                this.login(
                    result.accessToken,
                    result.encryptedAccessToken,
                    result.expireInSeconds,
                    this.rememberMe,
                    result.returnUrl
                );
            });
    }

    init(): void {
        this.initExternalLoginProviders();
    }

    private getOpenIdConnectConfig(
        loginProvider: ExternalLoginProvider
    ): AuthConfig {
        let authConfig = new AuthConfig();
        authConfig.loginUrl = loginProvider.additionalParams['LoginUrl'];
        authConfig.issuer = loginProvider.additionalParams['Authority'];
        authConfig.skipIssuerCheck = loginProvider.additionalParams['ValidateIssuer'] === 'false';
        authConfig.clientId = loginProvider.clientId;
        authConfig.responseType = 'id_token';
        authConfig.redirectUri = window.location.origin + '/account/login';
        authConfig.scope = 'openid profile';
        authConfig.requestAccessToken = false;
        return authConfig;
    }

    externalAuthenticate(provider: ExternalLoginProvider): void {
        this.ensureExternalLoginProviderInitialized(provider, () => {
            if (provider.name === ExternalLoginProvider.GOOGLE) {
                gapi.auth2
                    .getAuthInstance()
                    .signIn()
                    .then(() => {
                        this.googleLoginStatusChangeCallback(
                            gapi.auth2.getAuthInstance().isSignedIn.get()
                        );
                    });
            } else if (provider.name === ExternalLoginProvider.MICROSOFT) {
                let scopes = ['user.read'];
                this.MSAL.loginPopup({
                    scopes: scopes,
                }).then((idTokenResponse: AuthResponse) => {
                    this.MSAL.acquireTokenSilent({ scopes: scopes })
                        .then((accessTokenResponse: AuthResponse) => {
                            this.microsoftLoginCallback(accessTokenResponse);
                        })
                        .catch((error) => {
                            eaf.log.error(error);
                            eaf.message.error(error);
                        });
                });
            }
        });
    }
}
