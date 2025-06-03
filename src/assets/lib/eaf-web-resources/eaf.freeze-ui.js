var eaf = eaf || {};
(function () {

    eaf.ui.setBusy = function (element, text, freezeDelay) {
        FreezeUI({ element: element, text: text ? text : ' ', freezeDelay: freezeDelay });
    };

    eaf.ui.clearBusy = function (element, freezeDelay) {
        UnFreezeUI({ element: element,freezeDelay: freezeDelay });
    };

})();
