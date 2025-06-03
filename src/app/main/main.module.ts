import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CountoModule } from 'angular2-counto';
import { ModalModule, TabsModule, TooltipModule, BsDropdownModule, PopoverModule } from 'ngx-bootstrap';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainRoutingModule } from './main-routing.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { BsDatepickerModule, BsDatepickerConfig, BsDaterangepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { NgxBootstrapDatePickerConfigService } from 'assets/lib/ngx-bootstrap/ngx-bootstrap-datepicker-config.service';
import { AirplanesComponent } from './airplanes/airplanes.component';
import { CreateOrEditAirplaneModalComponent } from './airplanes/create-or-edit-airplane-modal.component';
import { FileUploadModule, TreeModule, DragDropModule, ContextMenuModule, PaginatorModule, AutoCompleteModule, EditorModule, InputMaskModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { TextMaskModule } from 'angular2-text-mask';
import { ImageCropperModule } from 'ngx-image-cropper';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgxMaskModule } from 'ngx-mask';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { QuestionsComponent } from './questions/questions.component';
import { CreateOrEditQuestionsModalComponent } from './questions/create-or-edit-questions-modal.component';
import { QuizzesComponent } from './quizzes/quizzes.component';
import { CreateOrEditQuizzesModalComponent } from './quizzes/create-or-edit-quizzes-modal.component';
import { FormsComponent } from './forms/forms.component';
import { ServicesComponent } from './services/services.component';
import { CreateOrEditFormsModalComponent } from './forms/create-or-edit-forms-modal.component';

NgxBootstrapDatePickerConfigService.registerNgxBootstrapDatePickerLocales();

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        FileUploadModule,
        ModalModule.forRoot(),
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        PopoverModule.forRoot(),
        BsDropdownModule.forRoot(),
        BsDatepickerModule.forRoot(),
        TimepickerModule.forRoot(),
        NgMultiSelectDropDownModule.forRoot(),
        NgxMaskModule.forRoot(),
        MainRoutingModule,
        UtilsModule,
        AppCommonModule,
        TableModule,
        TreeModule,
        DragDropModule,
        ContextMenuModule,
        PaginatorModule,
        AutoCompleteModule,
        EditorModule,
        InputMaskModule,
        NgxChartsModule,
        CountoModule,
        TextMaskModule,
        ImageCropperModule,
        AngularEditorModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory,
        }),
    ],
    declarations: [
        DashboardComponent,
        AirplanesComponent,
        CreateOrEditAirplaneModalComponent,
        QuestionsComponent,
        CreateOrEditQuestionsModalComponent,
        QuizzesComponent,
        CreateOrEditQuizzesModalComponent,
        FormsComponent,
        CreateOrEditFormsModalComponent,
        ServicesComponent,
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerConfig },
        { provide: BsDaterangepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDaterangepickerConfig },
        { provide: BsLocaleService, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerLocale }
    ]
})
export class MainModule { }
