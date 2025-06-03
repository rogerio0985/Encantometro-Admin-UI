import { Component, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { AuditLogDetailModalComponent } from '@app/admin/audit-logs/audit-log-detail-modal.component';
import { EntityChangeDetailModalComponent } from '@app/shared/common/entityHistory/entity-change-detail-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AuditLogListDto, AuditLogServiceProxy, EntityChangeListDto, NameValueDto } from '@shared/service-proxies/service-proxies';
import { FileDownloadService } from '@shared/utils/file-download.service';
import * as moment from 'moment';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';

@Component({
    templateUrl: './audit-logs.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class AuditLogsComponent extends AppComponentBase {

    @ViewChild('auditLogDetailModal') auditLogDetailModal: AuditLogDetailModalComponent;
    @ViewChild('entityChangeDetailModal') entityChangeDetailModal: EntityChangeDetailModalComponent;
    @ViewChild('dataTableAuditLogs') dataTableAuditLogs: Table;
    @ViewChild('dataTableEntityChanges') dataTableEntityChanges: Table;
    @ViewChild('paginatorAuditLogs') paginatorAuditLogs: Paginator;
    @ViewChild('paginatorEntityChanges') paginatorEntityChanges: Paginator;

    //Filters
    public dateRange: Date[] = [moment().startOf('day').toDate(), moment().endOf('day').toDate()];

    public usernameAuditLog: string;
    public usernameEntityChange: string;
    public serviceName: string;
    public methodName: string;
    public browserInfo: string;
    public hasException: boolean = undefined;
    public minExecutionDuration: number;
    public maxExecutionDuration: number;
    public entityTypeFullName: string;
    public objectTypes: NameValueDto[];

    dataTableHelperAuditLogs = new DataTableHelper();
    dataTableHelperEntityChanges = new DataTableHelper();

    constructor(
        injector: Injector,
        private _auditLogService: AuditLogServiceProxy,
        private _fileDownloadService: FileDownloadService
    ) {
        super(injector);
    }

    showAuditLogDetails(record: AuditLogListDto): void {
        this.auditLogDetailModal.show(record);
    }

    showEntityChangeDetails(record: EntityChangeListDto): void {
        this.entityChangeDetailModal.show(record);
    }

    getAuditLogs(event?: LazyLoadEvent) {
        if (this.dataTableHelperAuditLogs.shouldResetPaging(event)) {
            this.paginatorAuditLogs.changePage(0);

            return;
        }

        this.dataTableHelperAuditLogs.showLoadingIndicator();

        this._auditLogService.getAuditLogs(
            this.browserInfo,
            moment(this.dateRange[1]),
            this.hasException,
            this.maxExecutionDuration,
            this.methodName,
            this.minExecutionDuration,
            this.serviceName,
            moment(this.dateRange[0]),
            this.usernameAuditLog,
            this.dataTableHelperAuditLogs.getSorting(this.dataTableAuditLogs),
            this.dataTableHelperAuditLogs.getMaxResultCount(this.paginatorAuditLogs, event),
            this.dataTableHelperAuditLogs.getSkipCount(this.paginatorAuditLogs, event)
        ).subscribe((result) => {
            this.dataTableHelperAuditLogs.totalRecordsCount = result.totalCount;
            this.dataTableHelperAuditLogs.records = result.items;
            this.dataTableHelperAuditLogs.hideLoadingIndicator();
        });
    }

    getEntityChanges(event?: LazyLoadEvent) {
        this._auditLogService.getEntityHistoryObjectTypes()
            .subscribe((result) => {
                this.objectTypes = result;
            });

        if (this.dataTableHelperEntityChanges.shouldResetPaging(event)) {
            this.paginatorEntityChanges.changePage(0);

            return;
        }

        this.dataTableHelperEntityChanges.showLoadingIndicator();

        this._auditLogService.getEntityChanges(
            moment(this.dateRange[1]),
            this.entityTypeFullName,
            moment(this.dateRange[0]),
            this.usernameEntityChange,
            this.dataTableHelperEntityChanges.getSorting(this.dataTableEntityChanges),
            this.dataTableHelperEntityChanges.getMaxResultCount(this.paginatorEntityChanges, event),
            this.dataTableHelperEntityChanges.getSkipCount(this.paginatorEntityChanges, event)
        ).subscribe((result) => {
            this.dataTableHelperEntityChanges.totalRecordsCount = result.totalCount;
            this.dataTableHelperEntityChanges.records = result.items;
            this.dataTableHelperEntityChanges.hideLoadingIndicator();
        });
    }

    exportToExcel(): void {
        const self = this;
        self._auditLogService.getAuditLogsToExcel(
            this.browserInfo,
            moment(this.dateRange[1]),
            this.hasException,
            this.maxExecutionDuration,
            this.methodName,
            this.minExecutionDuration,
            this.serviceName,
            moment(this.dateRange[0]),
            this.usernameAuditLog,
            undefined,
            1,
            0)
            .subscribe(result => {
                self._fileDownloadService.downloadTempFile(result);
            });


        self._auditLogService.getEntityChangesToExcel(
            moment(this.dateRange[1]),
            this.entityTypeFullName,
            moment(this.dateRange[0]),
            this.usernameEntityChange,
            undefined,
            1,
            0)
            .subscribe(result => {
                self._fileDownloadService.downloadTempFile(result);
            });
    }

    truncateStringWithPostfix(text: string, length: number): string {
        return eaf.utils.truncateStringWithPostfix(text, length);
    }
}
