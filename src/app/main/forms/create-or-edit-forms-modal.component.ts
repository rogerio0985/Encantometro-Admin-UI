import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { AirportDto, AirportsServiceProxy, FormDto, FormsServiceProxy, LdapServiceProxy, QuizDto, QuizServiceProxy, TypeOfFormDto, UserLdapDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';
import * as moment from 'moment';

@Component({
    selector: 'createOrEditFormsModal',
    templateUrl: './create-or-edit-forms-modal.component.html'
})
export class CreateOrEditFormsModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();
    formDto: FormDto;

    dataTableHelperForms: DataTableHelper;

    active = false;
    saving = false;
    updated = false;
    selectedDateEnd: Date;
    ldapUsers: UserLdapDto[] = [];
    airportSelected: AirportDto;
    airports: AirportDto[] = [];
    typeOfForms: TypeOfFormDto[] = [];
    QuizArray: QuizDto[] = [];
    
    filterLdap: {
        name: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _formsServiceProxy: FormsServiceProxy,
        private _ldapServiceProxy: LdapServiceProxy,
        private _airportsServiceProxy: AirportsServiceProxy,
        private _quizServiceProxy: QuizServiceProxy,
    ) {
        super(injector);
        this.dataTableHelperForms = new DataTableHelper();
        this.airportSelected = new AirportDto();
    }

    ngOnInit(): void {
        this.formDto = null;
        this.filterLdap.name = '';
        this.selectedDateEnd = moment().toDate();

        this._formsServiceProxy.getTypeList()
            .subscribe(result => this.typeOfForms = result);

        this._quizServiceProxy.listQuizActived()
            .subscribe(result => this.QuizArray = result);
    }

    onShown(): void {
        this.active = true;
    }

    FindUsers(): void {
        this.dataTableHelperForms.showLoadingIndicator();
        this._ldapServiceProxy.getUsers(this.filterLdap.name)
            .pipe(finalize(() => this.dataTableHelperForms.hideLoadingIndicator()))
            .subscribe(result => this.ldapUsers = result);
    }

    close(): void {
        this.active = false;
        this.formDto = null;
        this.filterLdap.name = '';
        this.modal.hide();
    }

    SelectedLdapUser(ldapUser: UserLdapDto): void {
        this.formDto = new FormDto();
        this.formDto.typeOfForm = new TypeOfFormDto();
        this.formDto.quiz = new QuizDto();
        this.formDto.typeOfForm.id = 0;
        this.formDto.quiz.id = 0;
        this.formDto.collaborator = ldapUser.displayName;
        this.formDto.adLogin = ldapUser.samAccountName;
        this.formDto.email = ldapUser.mail;
        this.formDto.date = moment();
        this.formDto.dateEnd = moment().add(1, 'months');
        this.selectedDateEnd = moment().add(1, 'months').toDate();
        this.ldapUsers = [];
    }

    save(): void {
        this.dataTableHelperForms.showLoadingIndicator();
        this.saving = true;
        this.formDto.dateEnd = moment(this.selectedDateEnd);
        this.formDto.base = this.airportSelected.name;
        //Validar o preenchimendo
        if (this.formDto.collaborator == "" || this.formDto.collaborator == null
            || this.formDto.adLogin == "" || this.formDto.adLogin == null
            || this.formDto.email == "" || this.formDto.email == null
            || this.formDto.base == "" || this.formDto.base == null
            || this.formDto.typeOfForm == null || this.formDto.typeOfForm.id == null || this.formDto.typeOfForm.id == 0
            || this.formDto.quiz == null || this.formDto.quiz.id == null || this.formDto.quiz.id == 0) {
            this.dataTableHelperForms.hideLoadingIndicator();
            this.message.error("Favor preecnher todos os campos para criar o Formulário!");
            this.saving = false;
            return;
        }

        if(this.updated){
            this._formsServiceProxy.update(this.formDto)
            .pipe(finalize(() => 
            { 
                this.saving = false; 
                this.updated = false;
                this.dataTableHelperForms.hideLoadingIndicator(); 
            }))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
        }
        else{
            this._formsServiceProxy.create(this.formDto)
                .pipe(finalize(() => { this.saving = false; this.dataTableHelperForms.hideLoadingIndicator(); }))
                .subscribe(() => {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        }

    }

    search(event) {
        this._airportsServiceProxy.getAirports(event.query)
            .subscribe(result => this.airports = result);
    }

    Edit(item: FormDto): void{
        this.dataTableHelperForms.showLoadingIndicator();
        if (item) {
            this._formsServiceProxy.getById(item.id)
                .pipe(finalize(() => { this.dataTableHelperForms.hideLoadingIndicator(); }))
                .subscribe((result) => {
                    this.formDto = new FormDto();
                    this.formDto.typeOfForm = new TypeOfFormDto();
                    this.formDto.quiz = new QuizDto();
                    this.formDto.typeOfForm.id = 0;
                    this.formDto.quiz.id = 0;
                    this.formDto.collaborator = result.collaborator;
                    this.formDto.typeOfForm = result.typeOfForm;
                    this.formDto.quiz = result.quiz;
                    this.airportSelected.name = result.base;
                    this.formDto.base = result.base;
                    this.formDto.date = moment(result.date);
                    this.formDto.dateEnd = moment(result.dateEnd);
                    this.selectedDateEnd = moment(result.dateEnd).toDate();
                    this.formDto.adLogin = result.adLogin;
                    this.formDto.email = result.email;
                    this.formDto.id = result.id;
                    this.active = true;
                    this.modal.show();
                    this.updated = true;
                });
        }
    }

    //MODEL EVENTS
    show(): void {
        this.formDto = null;
        this.airportSelected = null;
        this.active = true;
        this.modal.show();
    }
   
}
