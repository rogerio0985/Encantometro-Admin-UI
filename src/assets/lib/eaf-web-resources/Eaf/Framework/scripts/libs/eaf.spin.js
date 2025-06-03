var eaf = eaf || {};
(function () {

    if (!$.fn.spin) {
        return;
    }

    eaf.libs = eaf.libs || {};

    eaf.libs.spinjs = {

        spinner_config: {
            lines: 11,
            length: 0,
            width: 10,
            radius: 20,
            corners: 1.0,
            trail: 60,
            speed: 1.2
        },

        //Config for busy indicator in element's inner element that has '.eaf-busy-indicator' class.
        spinner_config_inner_busy_indicator: {
            lines: 11,
            length: 0,
            width: 4,
            radius: 7,
            corners: 1.0,
            trail: 60,
            speed: 1.2
        }

    };

    eaf.ui.setBusy = function (elm, optionsOrPromise) {
        optionsOrPromise = optionsOrPromise || {};
        if (optionsOrPromise.always || optionsOrPromise['finally']) { //Check if it's promise
            optionsOrPromise = {
                promise: optionsOrPromise
            };
        }

        var options = $.extend({}, optionsOrPromise);

        if (!elm) {
            if (options.blockUI != false) {
                eaf.ui.block();
            }

            $('body').spin(eaf.libs.spinjs.spinner_config);
        } else {
            var $elm = $(elm);
            var $busyIndicator = $elm.find('.eaf-busy-indicator'); //TODO@Halil: What if  more than one element. What if there are nested elements?
            if ($busyIndicator.length) {
                $busyIndicator.spin(eaf.libs.spinjs.spinner_config_inner_busy_indicator);
            } else {
                if (options.blockUI != false) {
                    eaf.ui.block(elm);
                }

                $elm.spin(eaf.libs.spinjs.spinner_config);
            }
        }

        if (options.promise) { //Supports Q and jQuery.Deferred
            if (options.promise.always) {
                options.promise.always(function () {
                    eaf.ui.clearBusy(elm);
                });
            } else if (options.promise['finally']) {
                options.promise['finally'](function () {
                    eaf.ui.clearBusy(elm);
                });
            }
        }
    };

    eaf.ui.clearBusy = function (elm) {
        //TODO@Halil: Maybe better to do not call unblock if it's not blocked by setBusy
        if (!elm) {
            eaf.ui.unblock();
            $('body').spin(false);
        } else {
            var $elm = $(elm);
            var $busyIndicator = $elm.find('.eaf-busy-indicator');
            if ($busyIndicator.length) {
                $busyIndicator.spin(false);
            } else {
                eaf.ui.unblock(elm);
                $elm.spin(false);
            }
        }
    };

})();