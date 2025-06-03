import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CommonLookupServiceProxy, EntityDtoOfInt64, FindUsersInput, NameValueDto, TenantListDto, TenantServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { CreateTenantModalComponent } from './create-tenant-modal.component';
import { EditTenantModalComponent } from './edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenant-features-modal.component';
import { EntityTypeHistoryModalComponent } from '@app/shared/common/entityHistory/entity-type-history-modal.component';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './tenants.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class TenantsComponent extends AppComponentBase implements OnInit {

    @ViewChild('impersonateUserLookupModal') impersonateUserLookupModal: CommonLookupModalComponent;
    @ViewChild('createTenantModal') createTenantModal: CreateTenantModalComponent;
    @ViewChild('editTenantModal') editTenantModal: EditTenantModalComponent;
    @ViewChild('tenantFeaturesModal') tenantFeaturesModal: TenantFeaturesModalComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;
    @ViewChild('entityTypeHistoryModal') entityTypeHistoryModal: EntityTypeHistoryModalComponent;

    _entityTypeFullName = 'Eaf.Middleware.MultiTenancy.Tenant';
    entityHistoryEnabled = false;

    filters: {
        filterText: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _activatedRoute: ActivatedRoute,
        private _commonLookupService: CommonLookupServiceProxy,
        private _impersonationService: ImpersonationService
    ) {
        super(injector);
        
    }

    ngOnInit(): void {
        
        this.filters.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';
        
        this.setIsEntityHistoryEnabled();

        this.impersonateUserLookupModal.configure({
            title: this.l('SelectAUser'),
            dataSource: (skipCount: number, maxResultCount: number, filter: string, tenantId?: number) => {
                let input = new FindUsersInput();
                input.filter = filter;
                input.maxResultCount = maxResultCount;
                input.skipCount = skipCount;
                input.tenantId = tenantId;
                return this._commonLookupService.findUsers(input);
            }
        });
    }

    private setIsEntityHistoryEnabled(): void {
        let customSettings = (eaf as any).custom;
        this.entityHistoryEnabled = customSettings.EntityHistory && customSettings.EntityHistory.isEnabled && _.filter(customSettings.EntityHistory.enabledEntities, entityType => entityType === this._entityTypeFullName).length === 1;
    }

    getTenants(event?: LazyLoadEvent) {
        if (this.dataTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);

            return;
        }

        this.dataTableHelper.showLoadingIndicator();

        this._tenantService.getTenants(
            this.filters.filterText,
            this.dataTableHelper.getSorting(this.dataTable),
            this.dataTableHelper.getMaxResultCount(this.paginator, event),
            this.dataTableHelper.getSkipCount(this.paginator, event)
        ).pipe(finalize(() => this.dataTableHelper.hideLoadingIndicator()))
        .subscribe(result => {
            this.dataTableHelper.totalRecordsCount = result.totalCount;
            this.dataTableHelper.records = result.items;
            this.dataTableHelper.hideLoadingIndicator();
        });
    }

    showUserImpersonateLookUpModal(record: any): void {
        this.impersonateUserLookupModal.tenantId = record.id;
        this.impersonateUserLookupModal.show();
    }

    unlockUser(record: any): void {
        this._tenantService.unlockTenantAdmin(new EntityDtoOfInt64({ id: record.id })).subscribe(() => {
            this.notify.success(this.l('UnlockedTenandAdmin', record.name));
        });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    createTenant(): void {
        this.createTenantModal.show();
    }

    deleteTenant(tenant: TenantListDto): void {
        this.message.confirm(
            this.l('TenantDeleteWarningMessage', tenant.tenancyName),
            this.l('AreYouSure'),
            isConfirmed => {
                if (isConfirmed) {
                    this._tenantService.deleteTenant(tenant.id).subscribe(() => {
                        this.reloadPage();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }

    showHistory(tenant: TenantListDto): void {
        this.entityTypeHistoryModal.show({
            entityId: tenant.id.toString(),
            entityTypeFullName: this._entityTypeFullName,
            entityTypeDescription: tenant.tenancyName
        });
    }

    impersonateUser(item: NameValueDto): void {
        this._impersonationService
            .impersonate(
                parseInt(item.value),
                this.impersonateUserLookupModal.tenantId
            );
    }
}
