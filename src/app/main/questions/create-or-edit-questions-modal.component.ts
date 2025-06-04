import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { QuestionDto, QuestionItemDto, QuizServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { List } from 'lodash';

import { DataTableHelper } from '@shared/helpers/DataTableHelper';


@Component({
    selector: 'createOrEditQuestionsModal',
    templateUrl: './create-or-edit-questions-modal.component.html'
})
export class CreateOrEditQuestionsModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();
    mainDataTableHelper: DataTableHelper;

    active = false;
    saving = false;

    addItem = false;
    question: QuestionDto = new QuestionDto();
    questionItem: QuestionItemDto = new QuestionItemDto();
    questionItemList: Array<QuestionItemDto> = [];
    questionType: Array<any> = [
        { key: 0, value: "Text" },
        { key: 1, value: "Date" },
        { key: 2, value: "Number" },
        { key: 3, value: "Radio" },
        { key: 4, value: "Checkbox" },
        { key: 5, value: "Textarea" },
        { key: 6, value: "Dropdown" },
        { key: 7, value: "Star" },
    ];

    constructor(
        injector: Injector,
        private _quizServiceProxy: QuizServiceProxy
    ) {
        super(injector);
        this.mainDataTableHelper = new DataTableHelper();
    }

    show(questionId?: number): void {
        this.addItem = false;
        if (!questionId) {
            this.question = new QuestionDto();
            this.question.typeOf = 0;
            this.active = true;
            this.questionItem = new QuestionItemDto();
            this.questionItem.labelBr = this.questionItem.labelEs = this.questionItem.labelEn = "";
            this.modal.show();
        } else {
            this._quizServiceProxy.getQuestionById(questionId)
                .subscribe(result => {
                    this.question = result;
                    this.active = true;
                    this.modal.show();
                });
        }
    }

    onShown(): void {
        //document.getElementById('Number').focus();
    }

    save(): void {
        this.saving = true;
        if (this.question.id > 0) {
            this._quizServiceProxy.updateQuestion(this.question)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(() => {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        }
        else {
            this._quizServiceProxy.createQuestion(this.question)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(() => {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        }
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    inserirItem(): void {
        let questionItNew = new QuestionItemDto()
        questionItNew.labelBr = this.questionItem.labelBr;
        questionItNew.labelEs = this.questionItem.labelEs;
        questionItNew.labelEn = this.questionItem.labelEn;
        questionItNew.order = this.questionItem.order;
        this.addItem = true;
    }

    saveItem(): void {
        if (this.questionItem.id > 0) {
            let itemUpd = this.question.itens.findIndex(p => p.id == this.questionItem.id);
            this.question.itens[itemUpd] = this.questionItem;
        } else {
            if (this.question.itens == undefined)
                this.question.itens = [];

            this.question.itens.push(this.questionItem);
        }
        this.addItem = false;
        this.questionItem = new QuestionItemDto();
    }

    deletarItem(id: number): void {
        this.mainDataTableHelper.showLoadingIndicator();
        this._quizServiceProxy.deleteQuestionItem(id)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.question.itens = this.question.itens.filter(p => p.id != id);
                this.mainDataTableHelper.hideLoadingIndicator();
            });
    }

    editarItem(id: number): void {
        this.questionItem = this.question.itens.find(p => p.id == id);
        this.addItem = true;
    }

    orderByItens(itens: QuestionItemDto[]): QuestionItemDto[] {

        return itens.sort(function (a, b) {
            return a.order - b.order;
        });

        //this.question.itens = itens.sort(p=>p.order);
    }
}
