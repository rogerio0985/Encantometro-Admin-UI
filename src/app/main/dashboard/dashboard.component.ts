import { AfterViewInit, Component, Injector, ViewEncapsulation, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { curveBasis } from 'd3-shape';

import * as _ from 'lodash';
declare let d3, Datamap: any;


@Component({
    templateUrl: './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends AppComponentBase{

    constructor(
        injector: Injector,
        
    ) {
        super(injector);
    }
}
