﻿import { Component, Injector, ViewChild } from '@angular/core';
import { EntityChangeDetailModalComponent } from './entity-change-detail-modal.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AuditLogServiceProxy, EntityChangeListDto } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';

export interface IEntityTypeHistoryModalOptions {
    entityTypeFullName: string;
    entityTypeDescription: string;
    entityId: string;
}

@Component({
    selector: 'entityTypeHistoryModal',
    templateUrl: './entity-type-history-modal.component.html'
})
export class EntityTypeHistoryModalComponent extends AppComponentBase {

    @ViewChild('entityChangeDetailModal') entityChangeDetailModal: EntityChangeDetailModalComponent;

    @ViewChild('modal') modal: ModalDirective;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    options: IEntityTypeHistoryModalOptions;
    isShown = false;
    isInitialized = false;
    filterText = '';
    tenantId?: number;
    entityHistoryEnabled: false;

    constructor(
        injector: Injector,
        private _auditLogService: AuditLogServiceProxy
    ) {
        super(injector);
    }

    show(options: IEntityTypeHistoryModalOptions): void {
        this.options = options;
        this.modal.show();
    }

    refreshTable(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    close(): void {
        this.modal.hide();
    }

    shown(): void {
        this.isShown = true;
        this.getRecordsIfNeeds(null);
    }

    getRecordsIfNeeds(event?: LazyLoadEvent): void {
        if (!this.isShown) {
            return;
        }

        this.getRecords(event);
        this.isInitialized = true;
    }

    getRecords(event?: LazyLoadEvent): void {
        this.dataTableHelper.showLoadingIndicator();

        this._auditLogService.getEntityTypeChanges(
            this.options.entityTypeFullName,
            this.options.entityId,
            this.dataTableHelper.getSorting(this.dataTable),
            this.dataTableHelper.getMaxResultCount(this.paginator, event),
            this.dataTableHelper.getSkipCount(this.paginator, event)
        ).pipe(finalize(() => this.dataTableHelper.hideLoadingIndicator())).subscribe(result => {
            this.dataTableHelper.totalRecordsCount = result.totalCount;
            this.dataTableHelper.records = result.items;
            this.dataTableHelper.hideLoadingIndicator();
        });
    }

    showEntityChangeDetails(record: EntityChangeListDto): void {
        this.entityChangeDetailModal.show(record);
    }
}
