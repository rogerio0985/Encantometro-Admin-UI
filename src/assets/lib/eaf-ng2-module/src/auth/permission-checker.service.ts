///<reference path="../../../eaf-web-resources/eaf.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PermissionCheckerService {

    isGranted(permissionName: string): boolean {
        return eaf.auth.isGranted(permissionName);
    }

}
