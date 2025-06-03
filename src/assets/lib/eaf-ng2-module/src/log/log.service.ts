///<reference path="../../../eaf-web-resources/eaf.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LogService {

    debug(logObject?: any): void {
        eaf.log.debug(logObject);
    }

    info(logObject?: any): void {
        eaf.log.info(logObject);
    }

    warn(logObject?: any): void {
        eaf.log.warn(logObject);
    }

    error(logObject?: any): void {
        eaf.log.error(logObject);
    }

    fatal(logObject?: any): void {
        eaf.log.fatal(logObject);
    }

}
