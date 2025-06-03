import { AfterViewInit, Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LanguageServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { EditTextModalComponent } from './edit-text-modal.component';
import { finalize } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
    templateUrl: './language-texts.component.html',
    animations: [appModuleAnimation()]
})
export class LanguageTextsComponent extends AppComponentBase implements AfterViewInit, OnInit {

    @ViewChild('targetLanguageNameCombobox') targetLanguageNameCombobox: ElementRef;
    @ViewChild('baseLanguageNameCombobox') baseLanguageNameCombobox: ElementRef;
    @ViewChild('sourceNameCombobox') sourceNameCombobox: ElementRef;
    @ViewChild('targetValueFilterCombobox') targetValueFilterCombobox: ElementRef;
    @ViewChild('textsTable') textsTable: ElementRef;
    @ViewChild('editTextModal') editTextModal: EditTextModalComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    sourceNames: string[] = [];
    languages: eaf.localization.ILanguageInfo[] = [];
    targetLanguageName: string;
    sourceName: string;
    baseLanguageName: string;
    targetValueFilter: string;

    filters: {
        filterText: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy,
        private _router: Router,
        private _activatedRoute: ActivatedRoute
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.sourceNames = _.map(_.filter(eaf.localization.sources, source => source.type === 'MultiTenantLocalizationSource'), value => value.name);
        this.languages = eaf.localization.languages;
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.init();
        });
    }

    getLanguageTexts(event?: LazyLoadEvent) {
        if (!this.paginator || !this.dataTable || !this.sourceName) {
            return;
        }

        this.dataTableHelper.showLoadingIndicator();

        this._languageService.getLanguageTexts(
            this.baseLanguageName,
            this.filters.filterText,
            this.dataTableHelper.getMaxResultCount(this.paginator, event),
            this.dataTableHelper.getSkipCount(this.paginator, event),
            this.dataTableHelper.getSorting(this.dataTable),
            this.sourceName,
            this.targetLanguageName,
            this.targetValueFilter
        ).pipe(finalize(() => this.dataTableHelper.hideLoadingIndicator())).subscribe(result => {
            this.dataTableHelper.totalRecordsCount = result.totalCount;
            this.dataTableHelper.records = result.items;
            this.dataTableHelper.hideLoadingIndicator();
        });
    }

    init(): void {
        this._activatedRoute.params.subscribe((params: Params) => {
            this.baseLanguageName = params['baseLanguageName'] || eaf.localization.currentLanguage.name;
            this.targetLanguageName = params['name'];
            this.sourceName = params['sourceName'] || 'Encantometro';
            this.targetValueFilter = params['targetValueFilter'] || 'ALL';
            this.filters.filterText = params['filterText'] || '';

            this.reloadPage();
        });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    applyFilters(): void {
        this._router.navigate(['app/admin/languages', this.targetLanguageName, 'texts', {
            sourceName: this.sourceName,
            baseLanguageName: this.baseLanguageName,
            targetValueFilter: this.targetValueFilter,
            filterText: this.filters.filterText
        }]);

        if (this.paginator.getPage() !== 0) {
            this.paginator.changePage(0);

            return;
        }
    }

    truncateString(text): string {
        return eaf.utils.truncateStringWithPostfix(text, 32, '...');
    }

    refreshTextValueFromModal(): void {
        for (let i = 0; i < this.dataTableHelper.records.length; i++) {
            if (this.dataTableHelper.records[i].key === this.editTextModal.model.key) {
                this.dataTableHelper.records[i].targetValue = this.editTextModal.model.value;
                return;
            }
        }
    }
}
