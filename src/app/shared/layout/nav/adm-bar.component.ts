import { Component, Injector, OnInit } from '@angular/core'

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppNavigationService } from './app-navigation.service';
import { AppMenu } from './app-menu';

@Component({
    templateUrl: './adm-bar.component.html',
    selector: '[adm-bar]'
})
export class AdmBarComponent extends AppComponentBase implements OnInit {

    menu: AppMenu = null;
    showMenu: boolean = false;

    constructor(
        injector: Injector,
        private _appNavigationService: AppNavigationService
    ) {
        super(injector);
    }

    ngOnInit() {
        if (this.isGrantedAny("Pages.Administration.Maintenance", "Pages.Administration.AuditLogs", "Pages.Administration.Languages", "Pages.Administration")) {
            this.menu = this._appNavigationService.getAdminMenu();
            this.menu.items.forEach(element => {
                if (this.showMenuItem(element)) {
                    this.showMenu = true;
                    return;
                }
            });
        }
    }

    showMenuItem(menuItem): boolean {
        return this._appNavigationService.showMenuItem(menuItem);
    }
}
