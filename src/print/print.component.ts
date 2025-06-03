import {
    Component,
    Injector,
    OnInit,
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as _ from 'lodash';

import {
    FormsServiceProxy,
    PrintDto
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-print',
    templateUrl: './print.component.html',
    styleUrls: ['./print.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class PrintComponent extends AppComponentBase implements OnInit {
    private viewContainerRef: ViewContainerRef;
    ids: number[] = [];
    pageItens: PrintDto[][] = [];

    public constructor(
        injector: Injector,
        private _route: ActivatedRoute,
        private _formsServiceProxy: FormsServiceProxy,
        viewContainerRef: ViewContainerRef,
    ) {
        super(injector);
        this.viewContainerRef = viewContainerRef;
    }

    ngOnInit() {
        let value = this._route.snapshot.queryParams["ids"];
        if (value != null && value !== undefined) {
            this.ids = value.split(",").map((v) => parseInt(v));
        }

        if (this.ids.length <= 0)
            window.close();

        //Carregar os dados do QrCode um Array com todos os items para imprimir
        let pageId = -1;
        let pageItemId = 0;
        this._formsServiceProxy.getPrintByIds(this.ids)
            .subscribe(result => {
                //Não achei como converter um Array[item] com varios itens em uma Matrix [pagina][item]
                //Tem de colocar dois itens por pagima
                result.forEach((value, index) => {
                    if (index == 0 || pageItemId == 1) {
                        pageId++;
                        pageItemId = 0;
                        this.pageItens[pageId] = [];
                        this.pageItens[pageId][pageItemId] = value;
                    } else {
                        pageItemId++;
                        this.pageItens[pageId][pageItemId] = value;
                    }
                });
                setTimeout(() => {
                    window.print();
                }, 3000);
            });
    }
}
