import { Directive, ElementRef, Input, SimpleChanges, OnChanges } from '@angular/core';

@Directive({
    selector: '[busyIf]'
})
export class BusyIfDirective implements OnChanges {

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.busyIf) {
            this.refreshState(changes.busyIf.currentValue);
        }
    }

    @Input() set busyIf(isBusy: boolean) {
        this.refreshState(isBusy);
    }

    constructor(
        private _element: ElementRef
    ) { }

    refreshState(isBusy: boolean): void {
        if (isBusy === undefined) {
            return;
        }

        if (isBusy) {
            eaf.ui.setBusy(this._element.nativeElement);
        } else {
            eaf.ui.clearBusy(this._element.nativeElement);
        }
    }
}
