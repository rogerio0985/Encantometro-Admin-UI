import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AccountComponent } from './account.component';
import { AccountRouteGuard } from './account-route-guard';
import { ConfirmEmailComponent } from './email-activation/confirm-email.component';
import { EmailActivationComponent } from './email-activation/email-activation.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './password/forgot-password.component';
import { ResetPasswordComponent } from './password/reset-password.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AccountComponent,
                children: [
                    { path: '', redirectTo: 'login' },
                    { path: 'login', component: LoginComponent, canActivate: [AccountRouteGuard] },
                    { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [AccountRouteGuard] },
                    { path: 'reset-password', component: ResetPasswordComponent, canActivate: [AccountRouteGuard] },
                    { path: 'email-activation', component: EmailActivationComponent, canActivate: [AccountRouteGuard] },
                    { path: 'confirm-email', component: ConfirmEmailComponent, canActivate: [AccountRouteGuard] }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class AccountRoutingModule {
    constructor(
        private router: Router,
        private _uiCustomizationService: AppUiCustomizationService
    ) {
        router.events.subscribe((event: NavigationEnd) => {
            setTimeout(() => {
                this.toggleBodyCssClass(event.url);
            }, 0);
        });
    }

    toggleBodyCssClass(url: string): void {
        if (!url) {
            this.setAccountModuleBodyClassInternal();
            return;
        }

        if (url.indexOf('/account/') >= 0) {
            this.setAccountModuleBodyClassInternal();
        } else {
            document.body.className = this._uiCustomizationService.getAppModuleBodyClass();
        }
    }

    setAccountModuleBodyClassInternal(): void {
        let currentBodyClass = document.body.className;

        let classesToRemember = '';

        if (currentBodyClass.indexOf('swal2-toast-shown') >= 0) {
            classesToRemember += ' swal2-toast-shown';
        }

        document.body.className = this._uiCustomizationService.getAccountModuleBodyClass() + ' ' + classesToRemember;
    }
}
