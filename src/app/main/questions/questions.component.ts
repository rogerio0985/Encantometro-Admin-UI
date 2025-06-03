import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';
import { QuestionDto, QuizServiceProxy, SearchQuestionDto } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent, Paginator } from 'primeng/primeng';
import { Table } from 'primeng/table';
import { CreateOrEditQuestionsModalComponent } from './create-or-edit-questions-modal.component';

@Component({
    templateUrl: './questions.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class QuestionsComponent extends AppComponentBase implements OnInit {

    @ViewChild('createOrEditQuestionModal') createOrEditQuestion: CreateOrEditQuestionsModalComponent;
    @ViewChild('dataTableQuestions') dataTableQuestions: Table;
    @ViewChild('paginatorQuestions') paginatorQuestions: Paginator;
    searchQuestion : SearchQuestionDto = new SearchQuestionDto();
    dataTableHelperQuestions : DataTableHelper;
    searchFrom = new FormControl();

    filters: {
        description: string
    } = <any>{};

    constructor(
        injector: Injector,
        private _questionsServiceProxy: QuizServiceProxy
    ) {
        super(injector);
        this.dataTableHelperQuestions = new DataTableHelper();
    }

    ngOnInit(): void {
        this.searchFrom = new FormControl(this.searchQuestion);
    }

    getAll(event?: LazyLoadEvent) {
        this.dataTableHelperQuestions.showLoadingIndicator();
        if (this.dataTableHelperQuestions.shouldResetPaging(event)) {
            this.paginatorQuestions.changePage(0);
            this.dataTableHelperQuestions.hideLoadingIndicator();
            return;
        }

        this.dataTableHelperQuestions.showLoadingIndicator();
        this.searchQuestion.description = this.filters.description;
        this.searchQuestion.skipCount = this.dataTableHelperQuestions.getSkipCount(this.paginatorQuestions, event);
        this.searchQuestion.sorting = this.dataTableHelperQuestions.getSorting(this.dataTableQuestions);
        this.searchQuestion.maxResultCount = this.dataTableHelperQuestions.getMaxResultCount(this.paginatorQuestions, event);

        this._questionsServiceProxy.listQuestions(
            this.searchQuestion
        ).subscribe(result => {
            this.dataTableHelperQuestions.totalRecordsCount = result.totalCount;
            this.dataTableHelperQuestions.records = result.items;
            this.dataTableHelperQuestions.hideLoadingIndicator();
        });
    }

    reloadPage(): void {
        this.paginatorQuestions.changePage(this.paginatorQuestions.getPage());
    }

    new(): void {
        this.createOrEditQuestion.show();
    }

    deleteQuestion(id: number): void {
        this.message.confirm(
            '',
            (isConfirmed) => {
                if (isConfirmed) {
                    this._questionsServiceProxy.deleteQuestion(id)
                        .subscribe(() => {
                            this.reloadPage();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }
}
