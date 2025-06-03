import { NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { PrintComponent } from './print.component';
import { PrintRouteGuard } from './print-route-guard';


@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: PrintComponent,
                canActivate: [PrintRouteGuard]
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

    }


}
