import { Injector, Component, ViewEncapsulation, Inject, OnInit } from '@angular/core';

import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { DOCUMENT } from '@angular/common';

@Component({
    templateUrl: './default-brand.component.html',
    selector: 'default-brand',
    encapsulation: ViewEncapsulation.None
})
export class DefaultBrandComponent extends AppComponentBase {
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    defaultLogo = AppConsts.appBaseUrl + '/assets/common/images/gol/gol-logo-on-' + this.currentTheme.baseSettings.header.headerSkin + '.svg';

    constructor(
        injector: Injector,
        @Inject(DOCUMENT) private document: Document
    ) {
        super(injector);
    }

    clickTopbarToggle(): void {
        this.document.body.classList.toggle('m-topbar--on');
    }
}
