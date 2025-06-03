import { EafModule } from '@eaf/eaf.module';
import * as ngCommon from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { CommonModule } from '@shared/common/common.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccountRoutingModule } from './print-routing.module';
import { PrintComponent } from './print.component';
import { PrintRouteGuard } from './print-route-guard';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        ModalModule.forRoot(),
        EafModule,
        CommonModule,
        UtilsModule,
        ServiceProxyModule,
        AccountRoutingModule,
    ],
    declarations: [
        PrintComponent,
    ],
    providers: [
        PrintRouteGuard
    ]
})
export class PrintModule {

}
