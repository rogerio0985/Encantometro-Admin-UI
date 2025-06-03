import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';
import {
    FormsServiceProxy,
    FormDto,
    AirportDto,
    AirportsServiceProxy,
    TypeOfFormDto
} from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { LazyLoadEvent, Paginator } from 'primeng/primeng';
import { Table } from 'primeng/table';
import { finalize } from 'rxjs/operators';
import { AppConsts } from '@shared/AppConsts';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { CreateOrEditFormsModalComponent } from './create-or-edit-forms-modal.component';

@Component({
    selector: 'app-forms',
    templateUrl: './forms.component.html',
    styleUrls: ['./forms.component.css'],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class FormsComponent extends AppComponentBase implements OnInit {

    @ViewChild('createOrEditFormsModal') createOrEditForms: CreateOrEditFormsModalComponent;
    @ViewChild('dataTableForms') dataTableForms: Table;
    @ViewChild('paginatorForms') paginatorForms: Paginator;
    dataTableHelperForms: DataTableHelper;
    
    selectedItens: number[] = [];
    airportSelected: AirportDto;
    airports: AirportDto[] = [];
    typeOfForms: TypeOfFormDto[] = [];
    buttonDisabled: boolean = true;

    filters: {
        collaborator: string,
        base: string,
        dateStart: Date | null,
        dateEnd: Date | null,
        typeId: number | null
    } = <any>{};

    constructor(
        injector: Injector,
        private _formsServiceProxy: FormsServiceProxy,
        private _fileDownloadService: FileDownloadService,
        private _airportsServiceProxy: AirportsServiceProxy,
    ) {
        super(injector);
        this.dataTableHelperForms = new DataTableHelper();
        this.airportSelected = new AirportDto();
        this.dataTableHelperForms.defaultRecordsCountPerPage = 100;
    }

    ngOnInit(): void {
        this.dataTableHelperForms.showLoadingIndicator();

        this._formsServiceProxy.getTypeList()
            .subscribe(result => this.typeOfForms = result);
 
        this.filters.typeId = 0;
        this.filters.dateStart = moment().subtract(6, 'months').toDate();
        this.filters.dateEnd = moment().add(84, 'months').toDate();
    }

    exportToExcel() {
        this.filters.base = this.airportSelected.name;
        this._formsServiceProxy.getToExcel(
            this.selectedItens
        ).subscribe(result => {
            this._fileDownloadService.downloadTempFile(result);
        });
    }

    getAll(event?: LazyLoadEvent) {
        this.dataTableHelperForms.showLoadingIndicator();
        this.selectedItens = [];
        if (this.dataTableHelperForms.shouldResetPaging(event)) {
            this.paginatorForms.changePage(0);
            this.dataTableHelperForms.hideLoadingIndicator();
            return;
        }
        this.filters.base = this.airportSelected.name;
        this.dataTableHelperForms.showLoadingIndicator();
        this._formsServiceProxy.getList(
            this.filters.collaborator,
            this.filters.base,
            moment(this.filters.dateStart),
            moment(this.filters.dateEnd),
            this.filters.typeId,
            this.dataTableHelperForms.getSorting(this.dataTableForms),
            this.dataTableHelperForms.getSkipCount(this.paginatorForms, event),
            this.dataTableHelperForms.getMaxResultCount(this.paginatorForms, event)
        )
            .pipe(finalize(() => this.dataTableHelperForms.hideLoadingIndicator()))
            .subscribe(result => {
                this.dataTableHelperForms.totalRecordsCount = result.totalCount;
                this.dataTableHelperForms.records = result.items;
            });
    }

    reloadPage(): void {
        this.getAll(null);
        this.paginatorForms.changePage(this.paginatorForms.getPage());
    }

    onCheckboxAll(e: any) {
        let self = this;
        this.selectedItens = [];
        if (e.target.checked) { 
            this.dataTableHelperForms.records.forEach(function (value) {
                if (value.enabled) { 
                    self.selectedItens.push(value.id);
                }
            });
        }

        this.buttonDisabled = !this.VerificarSeExisteQrCodeNaoGerado();
    }

    onCheckboxChange(e: any, id: number): void {
        if (e.target.checked) {
            this.selectedItens.push(id);
        } else {
            const index = this.selectedItens.findIndex(x => x === id);
            this.selectedItens.splice(index, 1);
        }
        
        this.buttonDisabled = !this.VerificarSeExisteQrCodeNaoGerado();
    }

    VerificarSeExisteQrCodeNaoGerado(){
        let self = this;
        let existeQrCodeNaoGerado = false;
        this.dataTableHelperForms.records.forEach(function (value) {
            const index = self.selectedItens.findIndex(x => x  === value.id);
            let item = self.dataTableHelperForms.records[index];
            if (item !== undefined && item.enabled) {
                if(!self.isQrCodeGerado(value.id) && existeQrCodeNaoGerado === false){
                    existeQrCodeNaoGerado = true;
                }
            }
        });
        return existeQrCodeNaoGerado;
    }

    isChecked(id: number): boolean {
        return this.selectedItens.findIndex(x => x === id) != -1;
    }

    ExibirBotaoExcluir(){
        let linhaSelecionado = (this.selectedItens == null || this.selectedItens.length <= 0);
        return linhaSelecionado || !this.buttonDisabled;
    }

    isQrCodeGerado(id: number){
        const index = this.dataTableHelperForms.records.findIndex(x => x.id === id);
        let item = this.dataTableHelperForms.records[index];
        return !item.enableCreateQrCode && item.enabled
    }

    Delete(id: number): void {
        this.message.confirm(
            this.l('DeleteWarningMessage'),
            this.l('AreYouSure'),
            (isConfirmed) => {
                if (isConfirmed) {
                    this._formsServiceProxy.delete(id)
                        .subscribe(() => {
                            this.reloadPage();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    PrintSelected(): void {
        window.open(AppConsts.appBaseUrl + "/print?ids=" + this.selectedItens.toString(), "_blank");
    }

    OpenQrCode(id: number): void {
        this._formsServiceProxy.getById(id)
            .subscribe(result => {
                let img = "<img alt='print' style='max-width: 250px;' src='data:image/png;base64," + result.qrCodeImage + "'><br/><br/>";
                if (this.isGrantedAny('Pages.Forms.Delete', 'Pages.Forms.Create'))
                    img = img + "<span><i>" + result.qrCodeUrl + "</i></span>";
                this.message.info(img, 'Qr Code', true);
            });
    }

    PrintQrCode(id: number): void {
        window.open(AppConsts.appBaseUrl + "/print?ids=" + id, "_blank");
    }

    History(id: number): void {
        this.message.error('NotImplementedException');
    }

    QrSelected(): void {
        let self = this;
        this.selectedItens.forEach(function (id) {
            const index = self.dataTableHelperForms.records.findIndex(x => x.id === id);
            let item = self.dataTableHelperForms.records[index];
            if (item.enableCreateQrCode && item.enabled) {
                self.dataTableHelperForms.showLoadingIndicator();
                self._formsServiceProxy.getUrl(
                    item.id,
                    item.collaborator,
                    item.base,
                    item.date,
                    item.typeOfForm.id,
                    item.quiz.id)
                    .pipe(finalize(() => self.dataTableHelperForms.hideLoadingIndicator()))
                    .subscribe(_ => {
                        self.reloadPage();
                    });
            }
        });
    }

    CreateQrCode(item: FormDto): void {
        this.dataTableHelperForms.showLoadingIndicator();
        this._formsServiceProxy.getUrl(
            item.id,
            item.collaborator,
            item.base,
            item.date,
            item.typeOfForm.id,
            item.quiz.id)
            .pipe(finalize(() => this.dataTableHelperForms.hideLoadingIndicator()))
            .subscribe(_ => {
                this.reloadPage();
                eaf.notify.success("QrCode gerado com sucesso", "QrCode");
            });
    }

    DeleteForms(): void {
        this.message.confirm(
            this.l('DeleteWarningMessage'),
            this.l('AreYouSure'),
            (isConfirmed) => {
                if (isConfirmed) {
                    let self = this;
                    this.selectedItens.forEach(function (id) {
                        const index = self.dataTableHelperForms.records.findIndex(x => x.id === id);
                        let item = self.dataTableHelperForms.records[index];
                        if (!item.enableCreateQrCode && item.enabled) {
                            self._formsServiceProxy.delete(id)
                                .subscribe(() => {
                                    self.reloadPage();
                                    self.notify.success(self.l('SuccessfullyDeleted'));
                                });
                        }
                    });
                }
            }
        );
    }

    CreateForms(): void {
        this.createOrEditForms.show();
    }

    search(event) {
        this._airportsServiceProxy.getAirports(event.query)
            .subscribe(result => this.airports = result);
    }
}


