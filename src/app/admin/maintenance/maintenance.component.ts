import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CachingServiceProxy, EntityDtoOfString, WebLogServiceProxy } from '@shared/service-proxies/service-proxies';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './maintenance.component.html',
    animations: [appModuleAnimation()]
})
export class MaintenanceComponent extends AppComponentBase implements OnInit {

    loading = false;
    caches: any = null;
    logs: any = '';

    constructor(
        injector: Injector,
        private _cacheService: CachingServiceProxy,
        private _webLogService: WebLogServiceProxy,
        private _fileDownloadService: FileDownloadService) {
        super(injector);
    }

    getCaches(): void {
        const self = this;
        self.loading = true;
        self._cacheService.getAllCaches()
            .pipe(finalize(() => { self.loading = false; }))
            .subscribe((result) => {
                self.caches = result.items;
            });
    }

    clearCache(cacheName): void {
        const self = this;
        const input = new EntityDtoOfString();
        input.id = cacheName;

        self._cacheService.clearCache(input).subscribe(() => {
            self.notify.success(self.l('CacheSuccessfullyCleared'));
        });
    }

    clearAllCaches(): void {
        const self = this;
        self._cacheService.clearAllCaches().subscribe(() => {
            self.notify.success(self.l('AllCachesSuccessfullyCleared'));
        });
    }

    getWebLogs(): void {
        const self = this;
        self._webLogService.getLatestWebLogs().subscribe((result) => {
            self.logs = result.latestWebLogLines;
            self.fixWebLogsPanelHeight();
        });
    }

    downloadWebLogs = function () {
        const self = this;
        self._webLogService.downloadWebLogs().subscribe((result) => {
            self._fileDownloadService.downloadTempFile(result);
        });
    };

    getLogClass(log: string): string {

        if (log.includes('DEBUG') || log.includes('[DBG]')) {
            return 'label label-inline label-dark';
        }

        if (log.includes('INFO') || log.includes('[INF]')) {
            return 'label label-inline label-info';
        }

        if (log.includes('WARN') || log.includes('[WRN]')) {
            return 'label label-inline label-warning';
        }

        if (log.includes('ERROR') || log.includes('[ERR]')) {
            return 'label label-inline label-danger';
        }

        if (log.includes('FATAL')  || log.includes('[FAT]') || log.includes('[FTL]')) {
            return 'label label-inline label-danger';
        }

        return '';
    }

    getLogType(log: string): string {
        if (log.includes('DEBUG') || log.includes('[DBG]')) {
            return '';
        }

        if (log.includes('INFO') || log.includes('[INF]')) {
            return '';
        }

        if (log.includes('WARN') || log.includes('[WRN]')) {
            return '';
        }

        if (log.includes('ERROR') || log.includes('[ERR]')) {
            return '';
        }

        if (log.includes('FATAL')  || log.includes('[FAT]') || log.includes('[FTL]')) {
            return '';
        }

        return '';
    }

    getRawLogContent(log: string): string {
        let length = 50;
        return log.substring(0, Math.min(length,log.length));
    }

    fixWebLogsPanelHeight(): void {
        let panel = document.getElementsByClassName('full-height')[0];
        const windowHeight = document.body.clientHeight;
        const panelHeight = panel.clientHeight;
        const difference = windowHeight - panelHeight;
        const fixedHeight = panelHeight + difference;
        (panel as any).style.height = (fixedHeight - 420) + 'px';
    }

    onResize(event): void {
        this.fixWebLogsPanelHeight();
    }

    ngOnInit(): void {
        const self = this;
        self.getCaches();
        self.getWebLogs();
    }
}
