﻿define(function () {
    return {
        load: function (name, req, onload, config) {
            var url = eaf.appPath + 'api/EafServiceProxies/Get?name=' + name;
            req([url], function (value) {
                onload(value);
            });
        }
    };
});