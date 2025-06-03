import {  Component,  EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';

import { DynamicSettingsServiceProxy, SettingsDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'createOrEditDynamicParametersModal',
  templateUrl: './create-or-edit-dynamic-parameters-modal.component.html',
  styleUrls: ['./create-or-edit-dynamic-parameters-modal.component.css']
})
export class CreateOrEditDynamicParametersModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    settings: SettingsDto = new SettingsDto();


    getName() : string {
        return this.settings.name;
    }

    getValue() : string {
        return this.settings.value;
    }

    constructor(injector: Injector,
        private _dynamicSettingsService: DynamicSettingsServiceProxy) {
        super(injector);
    }

    show(name?: string, value?: string): void
    {
        this.settings.name = name;
        this.settings.value = value;
        this.modal.show();
    }

    save(): void {
        this._dynamicSettingsService.set(this.settings)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.closeEmit();
            });
    }

    closeEmit(): void {
        this.notify.success(this.l('SavedSuccessfully'));
        this.close();
        this.modalSave.emit(null);
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }
}
