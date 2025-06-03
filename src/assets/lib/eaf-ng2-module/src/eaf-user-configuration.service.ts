import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare let jQuery: any;
declare let eaf: any;

@Injectable({
    providedIn: 'root'
})
export class EafUserConfigurationService {

    constructor(
        private _http: HttpClient
    ) { }

    initialize(): void {
        this._http.get('/EafUserConfiguration/GetAll')
            .subscribe(result => {
                jQuery.extend(true, eaf, JSON.parse(JSON.stringify(result)));
            });
    }
}
