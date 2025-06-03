import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';
import { QuizServiceProxy, SearchQuizDto } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent, Paginator } from 'primeng/primeng';
import { Table } from 'primeng/table';
import { CreateOrEditQuizzesModalComponent } from './create-or-edit-quizzes-modal.component';

@Component({
    templateUrl: './quizzes.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class QuizzesComponent extends AppComponentBase implements OnInit {

    @ViewChild('createOrEditQuizzesModal') createOrEditQuiz: CreateOrEditQuizzesModalComponent;
    @ViewChild('dataTableQuiz') dataTableQuiz: Table;
    @ViewChild('paginatorQuiz') paginatorQuiz: Paginator;
    searchQuiz : SearchQuizDto = new SearchQuizDto();
    dataTableHelperQuiz : DataTableHelper;
    searchFrom = new FormControl();

    filters: {
        description: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _quizzesServiceProxy: QuizServiceProxy
    ) {
        super(injector);
        this.dataTableHelperQuiz = new DataTableHelper();
    }

    ngOnInit(): void {
        this.searchFrom = new FormControl(this.searchQuiz);
    }

    getAll(event?: LazyLoadEvent) {
        this.dataTableHelperQuiz.showLoadingIndicator();
        if (this.dataTableHelperQuiz.shouldResetPaging(event)) {
            this.paginatorQuiz.changePage(0);
            this.dataTableHelperQuiz.hideLoadingIndicator();
            return;
        }

        this.dataTableHelperQuiz.showLoadingIndicator();
        this.searchQuiz.description = this.filters.description;
        this.searchQuiz.skipCount = this.dataTableHelperQuiz.getSkipCount(this.paginatorQuiz, event);
        this.searchQuiz.sorting = this.dataTableHelperQuiz.getSorting(this.dataTableQuiz);
        this.searchQuiz.maxResultCount = this.dataTableHelperQuiz.getMaxResultCount(this.paginatorQuiz, event);

        this._quizzesServiceProxy.listQuiz(
            this.searchQuiz
       ).subscribe(result => {
            console.log(result);
            this.dataTableHelperQuiz.totalRecordsCount = result.totalCount;
            this.dataTableHelperQuiz.records = result.items;
            this.dataTableHelperQuiz.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginatorQuiz.changePage(this.paginatorQuiz.getPage());
    }

    new(): void {
        this.createOrEditQuiz.show();
    }

    deleteQuestion(id: number): void {
        this.message.confirm(
            '',
            (isConfirmed) => {
                if (isConfirmed) {
                    this._quizzesServiceProxy.deleteQuiz(id)
                        .subscribe(() => {
                            this.reloadPage();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }
}
