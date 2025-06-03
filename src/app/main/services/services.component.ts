import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';
import { FormsServiceProxy, TypeOfFormDto } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent, Paginator } from 'primeng/primeng';
import { Table } from 'primeng/table';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './services.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class ServicesComponent extends AppComponentBase implements OnInit {

    @ViewChild('dataTableService') dataTableService: Table;
    @ViewChild('paginatorService') paginatorService: Paginator;
    dataTableHelperService: DataTableHelper;

    @ViewChild('createOrEditModal') modal: ModalDirective;
    active: boolean = false;
    saving: boolean = false;
    typeOfFormDto: TypeOfFormDto;

    filters: {
        description: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _formsServiceProxy: FormsServiceProxy
    ) {
        super(injector);
        this.dataTableHelperService = new DataTableHelper();
    }

    ngOnInit(): void {
        this.filters.description = "";
        this.typeOfFormDto = new TypeOfFormDto();
    }

    getAll(event?: LazyLoadEvent) {
        this.dataTableHelperService.showLoadingIndicator();
        if (this.dataTableHelperService.shouldResetPaging(event)) {
            this.paginatorService.changePage(0);
            this.dataTableHelperService.hideLoadingIndicator();
            return;
        }

        this.dataTableHelperService.showLoadingIndicator();
        this._formsServiceProxy.getListType(
            this.filters.description,
            this.dataTableHelperService.getSorting(this.dataTableService),
            this.dataTableHelperService.getSkipCount(this.paginatorService, event),
            this.dataTableHelperService.getMaxResultCount(this.paginatorService, event)
        ).subscribe(result => {
            console.log(result);
            this.dataTableHelperService.totalRecordsCount = result.totalCount;
            this.dataTableHelperService.records = result.items;
            this.dataTableHelperService.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginatorService.changePage(this.paginatorService.getPage());
    }

    EnableOrDisable(id: number) {
        this.dataTableHelperService.showLoadingIndicator();
        this._formsServiceProxy.enableOrDisableType(id)
            .subscribe(() => this.reloadPage());
    }

    show() {
        this.typeOfFormDto = new TypeOfFormDto();
        this.typeOfFormDto.name = "";
        this.typeOfFormDto.disabled = false;
        this.active = true;
        this.modal.show();
    }

    close() {
        this.active = false;
        this.modal.hide();
    }

    onShown() {
        this.typeOfFormDto.name = "";
        this.typeOfFormDto.disabled = false;
    }

    save() {
        this.saving = true;
        this.typeOfFormDto.disabled = false;
        this._formsServiceProxy.createOrUpdate(this.typeOfFormDto)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.getAll(null);
                this.close();
                this.notify.success(this.l('SavedSuccessfully'));
            });
    }

}
