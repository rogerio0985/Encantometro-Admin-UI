﻿import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import * as localForage from 'localforage';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor(private cookieService: CookieService) { }

    public setValue(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
        this.cookieService.set(key, JSON.stringify(value), new Date(new Date().getTime() + 86400000), "/", '', true, "Lax");
    }

    public getValue(key: string): any {
        let value = localStorage.getItem(key);
        if (value == '' || value === undefined || value == null)
            value = this.cookieService.get(key);
        if (value == '' || value === undefined || value == null)
            return null;
        return JSON.parse(value);
    }

    public removeValue(key: string): void {
        localStorage.removeItem(key);
        this.cookieService.delete(key);
    }

    public getCookieValue(key: string): string {
        let value = localStorage.getItem(key);
        if (value === '' || value === null || value === undefined)
            value = this.cookieService.get(key);
        if (localForage && (value === '' || value === null || value === undefined)) {
            localForage.getItem<string>(key).then(l => value = l);
        }
        return value;
    }

    public setCookieValue(key: string, value: string, expireDate?: Date, path?: string, domain?: string): void {
        localStorage.setItem(key, value);
        this.cookieService.set(key, value, expireDate, path, domain, true, "Lax");
        if (localForage) {
            localForage.setItem(key, value);
        }
    }

    public deleteCookie(key: string, path?: string): void {
        this.cookieService.delete(key, path);
        localStorage.removeItem(key);
        if (localForage) {
            localForage.removeItem(key);
        }
    }

    public Clear() {
        localStorage.clear();
        this.cookieService.deleteAll();
        if (localForage) {
            localForage.clear();
        }
    }

}
