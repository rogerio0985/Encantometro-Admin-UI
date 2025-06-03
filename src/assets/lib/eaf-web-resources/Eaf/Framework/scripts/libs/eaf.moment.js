var eaf = eaf || {};
(function () {
    if (!moment || !moment.tz) {
        return;
    }

    /* DEFAULTS *************************************************/

    eaf.timing = eaf.timing || {};

    /* FUNCTIONS **************************************************/

    eaf.timing.convertToUserTimezone = function (date) {
        var momentDate = moment(date);
        var targetDate = momentDate.clone().tz(eaf.timing.timeZoneInfo.iana.timeZoneId);
        return targetDate;
    };

})();