﻿import { Injector, Component, ViewEncapsulation, Inject } from '@angular/core';

import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

import { DOCUMENT } from '@angular/common';

@Component({
    templateUrl: './theme4-brand.component.html',
    selector: 'theme4-brand',
    encapsulation: ViewEncapsulation.None
})
export class Theme4BrandComponent extends AppComponentBase {

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
