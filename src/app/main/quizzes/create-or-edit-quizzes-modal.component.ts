import { Component, ViewChild, Injector, Output, EventEmitter} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { QuestionDto, QuizDto, QuizItemDto, QuizServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataTableHelper } from '@shared/helpers/DataTableHelper';
import * as moment from 'moment';

@Component({
    selector: 'createOrEditQuizzesModal',
    templateUrl: './create-or-edit-quizzes-modal.component.html',
    styleUrls: ['./create-or-edit-quizzes-modal.component.css'],
})
export class CreateOrEditQuizzesModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();
    mainDataTableHelper: DataTableHelper;

    active = false;
    saving = false;

    addItem = false;
    quiz: QuizDto = new QuizDto();
    quizItem: QuizItemDto = new QuizItemDto();
    quizItemList: Array<QuizItemDto> = [];
    questionNoSelectedList : Array<QuestionDto> = [];
    validityStart: Date = new Date();
    validityEnd: Date = new Date();

    constructor(
        injector: Injector,
        private _quizServiceProxy: QuizServiceProxy
    ) {
        super(injector);
        this.mainDataTableHelper = new DataTableHelper();

    }

    show(questionId?: number): void {
        this.addItem=false;
        if (!questionId) {
            this.quiz = new QuizDto();
            this.active = true;
            this.modal.show();
        } else {
            this._quizServiceProxy.getQuizById(questionId)
                .subscribe(result => {
                    this.quiz = result;
                    this.validityStart = this.quiz.validityStart.toDate();
                    this.validityEnd = this.quiz.validityEnd.toDate();
                    this.active = true;
                    this.modal.show();
            });
        }
    }

    onShown(): void {
        this.getAllQuestions();
    }

    save(): void {
        this.saving = true;
        this.quiz.validityStart = moment(this.validityStart);
        this.quiz.validityEnd = moment(this.validityEnd);
        if (this.quiz.id > 0)
        {
            this._quizServiceProxy.updateQuiz(this.quiz)
            .pipe(finalize(() => { this.saving = false;}))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
        }
        else
        {
            this._quizServiceProxy.creatQuize(this.quiz)
            .pipe(finalize(() => { this.saving = false;}))
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

    saveItem(): void{}

    selectedItem(idQuestion : number): QuizItemDto[]{

        if (this.quiz.itens==undefined)
            this.quiz.itens = Array<QuizItemDto>();

        let question = this.questionNoSelectedList.find(p=>p.id==idQuestion);
        let quizItemDto = new QuizItemDto();
        quizItemDto.questionId = idQuestion;
        quizItemDto.question = question;
        quizItemDto.order = this.quiz.itens.length+1;
        this.quiz.itens.push(quizItemDto);
        this.questionNoSelectedList.splice(this.questionNoSelectedList.findIndex(p=>p.id==idQuestion), 1);
        return this.quiz.itens.sort(function(a, b) {
            return a.order - b.order;
        });
    }

    deSelectedItem(idQuestion: number): QuestionDto[] {
        let itemDto = this.quiz.itens.find(p=>p.questionId==idQuestion);
        this.questionNoSelectedList.push(itemDto.question);
        this.quiz.itens.splice(this.quiz.itens.findIndex(p=>p.questionId==idQuestion), 1);
        this.quiz.itens.forEach(function(value, index) { value.order = index+1; });
        return this.questionNoSelectedList;
    }

    deletarItem(): void{}

    getAllQuestions(): void{
        let self = this;
        self.questionNoSelectedList = [];
        self._quizServiceProxy.getAllQuestions().subscribe(result => {
            if (self.quiz!=undefined && self.quiz.itens!=undefined && self.quiz.itens.length > 0) {
                result.forEach(function(value) {
                    let itemSel = self.quiz.itens.find(p => p.questionId == value.id);
                    if (itemSel==null)
                        self.questionNoSelectedList.push(value);
                });
            }
            else
                self.questionNoSelectedList = result;
        });
    }

    disabledSave(): boolean {
        if (this.quiz.itens!=undefined)
            return (this.quiz.itens.length==0)
        else
            return true;
    }

    //returnNameQuestion(id:number): string {
    //    if (this.questionList!==undefined)
    //        return this.questionList.find(p=>p.id==id).labelBr;
    //    else
    //        return "";
   // }
}
