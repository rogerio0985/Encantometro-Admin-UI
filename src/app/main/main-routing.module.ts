import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { QuestionsComponent } from './questions/questions.component';
import { QuizzesComponent } from './quizzes/quizzes.component';
import { FormsComponent } from './forms/forms.component';
import { ServicesComponent } from './services/services.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                children: [
                    { path: 'forms', component: FormsComponent, data: { permission: 'Pages.Forms' } },
                    { path: 'dashboard', component: DashboardComponent, data: { permission: 'Pages.Dashboard' } },
                    { path: 'questions', component: QuestionsComponent, data: { permission: 'Pages.Questions' } },
                    { path: 'quizzes', component: QuizzesComponent, data: { permission: 'Pages.Quizzes' } },
                    { path: 'services', component: ServicesComponent, data: { permission: 'Pages.Forms.Type' } },
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class MainRoutingModule { }
