import { PermissionCheckerService } from '@eaf/auth/permission-checker.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { Injector } from '@angular/core';
import { LocalizationService } from '@eaf/localization/localization.service';
import { Injectable } from '@angular/core';
import { AppMenu } from './app-menu';
import { AppMenuItem } from './app-menu-item';

@Injectable()
export class AppNavigationService {

    localization: LocalizationService;
    constructor(
        injector: Injector,
        private _permissionCheckerService: PermissionCheckerService,
        private _appSessionService: AppSessionService
    ) {
        this.localization = injector.get(LocalizationService);
    }

    getMenu(): AppMenu {
        return new AppMenu('MainMenu', 'MainMenu', [
            new AppMenuItem('Forms', 'Pages.Forms', 'fab fa-wpforms', '/app/main/forms'),
            new AppMenuItem('Quizzes', 'Pages.Quizzes.Create', 'far fa-question-circle', '/app/main/quizzes'),
            new AppMenuItem('TypeOfServices', 'Pages.Forms.Type.Create', 'fas fa-server', '/app/main/services'),
            new AppMenuItem('Questions', 'Pages.Questions.Create', 'fas fa-list', '/app/main/questions'),
        ]);
    }

    getAdminMenu(): AppMenu {
        return new AppMenu('AdminMenu', 'AdminMenu', [
            new AppMenuItem('Roles', 'Pages.Administration.Roles', 'flaticon-suitcase', '/app/admin/roles'),
            new AppMenuItem('Users', 'Pages.Administration.Users', 'flaticon-users', '/app/admin/users'),
            new AppMenuItem('Languages', 'Pages.Administration.Languages', 'flaticon-tabs', '/app/admin/languages'),
            new AppMenuItem('AuditLogs', 'Pages.Administration.AuditLogs', 'flaticon-folder-1', '/app/admin/auditLogs'),
            new AppMenuItem('VisualSettings', 'Pages.Administration.UiCustomization', 'flaticon-imac', '/app/admin/ui-customization'),
            new AppMenuItem('Maintenance', 'Pages.Administration.Maintenance', 'flaticon-lock', '/app/admin/maintenance'),
            new AppMenuItem('Settings', 'Pages.Administration.Settings', 'flaticon-settings', '/app/admin/settings'),
            new AppMenuItem('Parameters', 'Pages.Administration.Maintenance', 'flaticon-lock', '/app/admin/parameters'),
            new AppMenuItem('Jobs', 'Pages.Administration.HangfireDashboard', 'flaticon-line-graph', '/app/admin/hangfire'),
        ]);
    }

    checkChildMenuItemPermission(menuItem): boolean {

        for (let i = 0; i < menuItem.items.length; i++) {
            let subMenuItem = menuItem.items[i];

            if (subMenuItem.permissionName && this._permissionCheckerService.isGranted(subMenuItem.permissionName)) {
                return true;
            } else if (subMenuItem.items && subMenuItem.items.length) {
                return this.checkChildMenuItemPermission(subMenuItem);
            }
        }

        return false;
    }

    showMenuItem(menuItem: AppMenuItem): boolean {

        let hideMenuItem = false;

        if (menuItem.requiresAuthentication && !this._appSessionService.user) {
            hideMenuItem = true;
        }

        if (menuItem.permissionName && !this._permissionCheckerService.isGranted(menuItem.permissionName)) {
            hideMenuItem = true;
        }

        if (menuItem.hasFeatureDependency() && !menuItem.featureDependencySatisfied()) {
            hideMenuItem = true;
        }

        if (!hideMenuItem && menuItem.items && menuItem.items.length) {
            return this.checkChildMenuItemPermission(menuItem);
        }

        return !hideMenuItem;
    }
}
