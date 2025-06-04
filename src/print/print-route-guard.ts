import { PermissionCheckerService } from '@eaf/auth/permission-checker.service';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Router, RouterStateSnapshot } from '@angular/router';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { Data, Route } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class PrintRouteGuard implements CanActivate, CanActivateChild, CanLoad {

    constructor(
        private _permissionChecker: PermissionCheckerService,
        private _router: Router,
        private _sessionService: AppSessionService
    ) { }

    canActivateInternal(data: Data, state: RouterStateSnapshot): boolean {

        if (!this._sessionService.user) {
            return false;
        }

        if (!data || !data['permission']) {
            return true;
        }

        if (this._permissionChecker.isGranted(data['permission'])) {
            return true;
        }

        return true;
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivateInternal(route.data, state);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
        return this.canActivateInternal(route.data, null);
    }

}
