import { Component, Injector, ViewChild, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DynamicSettingsServiceProxy } from '@shared/service-proxies/service-proxies';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { CreateOrEditDynamicParametersModalComponent } from './create-or-edit-dynamic-parameters-modal.component';


@Component({
  selector: 'app-dynamic-parameters',
  templateUrl: './dynamic-parameters.component.html',
  styleUrls: ['./dynamic-parameters.component.css'],
  animations: [appModuleAnimation()]
})

export class DynamicParametersComponent extends AppComponentBase implements OnInit {

    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;
    @ViewChild('createOrEditDynamicParametersModal') createOrEditDynamicParametersModal: CreateOrEditDynamicParametersModalComponent;

    filters: {
        filterText: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _dynamicSettingsService: DynamicSettingsServiceProxy,
        private _activatedRoute: ActivatedRoute) {
        super(injector);
    }

  ngOnInit() {
    this.filters.filterText = this._activatedRoute.snapshot.queryParams['filterText'] || '';
  }

  reloadPage(): void {
    this.paginator.changePage(this.paginator.getPage());
  }

  createParameter(): void {
    this.createOrEditDynamicParametersModal.show();
  }

  getParameters(event?: LazyLoadEvent) {
    if (this.dataTableHelper.shouldResetPaging(event)) {
        this.paginator.changePage(0);
        return;
    }

    this.dataTableHelper.showLoadingIndicator();

    this._dynamicSettingsService.getAll(
        this.filters.filterText,
        this.dataTableHelper.getSorting(this.dataTable),
        this.dataTableHelper.getSkipCount(this.paginator, event),
        this.dataTableHelper.getMaxResultCount(this.paginator, event)
    ).pipe(finalize(() => this.dataTableHelper.hideLoadingIndicator()))
    .subscribe(result => {
        this.dataTableHelper.totalRecordsCount = result.totalCount;
        this.dataTableHelper.records = result.items;
        this.dataTableHelper.hideLoadingIndicator();
    });
  }
  editParameter(record : any){
    this.createOrEditDynamicParametersModal.show(record.name, record.value);
  }

  deleteParameter(record : any){
    this.dataTableHelper.showLoadingIndicator();
    this._dynamicSettingsService.delete(record.name, record.value)
    .pipe(finalize(() => this.dataTableHelper.hideLoadingIndicator()))
    .subscribe(result => this.getParameters(null))
  }
}
