var eaf = eaf || {};
(function ($) {

    if (!$) {
        return;
    }

    /* JQUERY ENHANCEMENTS ***************************************************/

    // eaf.ajax -> uses $.ajax ------------------------------------------------

    eaf.ajax = function (userOptions) {
        userOptions = userOptions || {};

        var options = $.extend(true, {}, eaf.ajax.defaultOpts, userOptions);
        var oldBeforeSendOption = options.beforeSend;		
        options.beforeSend = function(xhr) {
            if (oldBeforeSendOption) {
                 oldBeforeSendOption(xhr);
            }

            xhr.setRequestHeader("Pragma", "no-cache");
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.setRequestHeader("Expires", "Sat, 01 Jan 2000 00:00:00 GMT");
        };

        options.success = undefined;
        options.error = undefined;

        return $.Deferred(function ($dfd) {
            $.ajax(options)
                .done(function (data, textStatus, jqXHR) {
                    if (data.__eaf) {
                        eaf.ajax.handleResponse(data, userOptions, $dfd, jqXHR);
                    } else {
                        $dfd.resolve(data);
                        userOptions.success && userOptions.success(data);
                    }
                }).fail(function (jqXHR) {
                    if (jqXHR.responseJSON && jqXHR.responseJSON.__eaf) {
                        eaf.ajax.handleResponse(jqXHR.responseJSON, userOptions, $dfd, jqXHR);
                    } else {
                        eaf.ajax.handleNonEafErrorResponse(jqXHR, userOptions, $dfd);
                    }
                });
        });
    };

    $.extend(eaf.ajax, {
        defaultOpts: {
            dataType: 'json',
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        },

        defaultError: {
            message: 'An error has occurred!',
            details: 'Error detail not sent by server.'
        },

        defaultError401: {
            message: 'You are not authenticated!',
            details: 'You should be authenticated (sign in) in order to perform this operation.'
        },

        defaultError403: {
            message: 'You are not authorized!',
            details: 'You are not allowed to perform this operation.'
        },

        defaultError404: {
            message: 'Resource not found!',
            details: 'The resource requested could not found on the server.'
        },

        logError: function (error) {
            eaf.log.error(error);
        },

        showError: function (error) {
            if (error.details) {
                return eaf.message.error(error.details, error.message);
            } else {
                return eaf.message.error(error.message || eaf.ajax.defaultError.message);
            }
        },

        handleTargetUrl: function (targetUrl) {
            if (!targetUrl) {
                location.href = eaf.appPath;
            } else {
                location.href = targetUrl;
            }
        },

        handleNonEafErrorResponse: function (jqXHR, userOptions, $dfd) {
            if (userOptions.eafHandleError !== false) {
                switch (jqXHR.status) {
                    case 401:
                        eaf.ajax.handleUnAuthorizedRequest(
                            eaf.ajax.showError(eaf.ajax.defaultError401),
                            eaf.appPath
                        );
                        break;
                    case 403:
                        eaf.ajax.showError(eaf.ajax.defaultError403);
                        break;
                    case 404:
                        eaf.ajax.showError(eaf.ajax.defaultError404);
                        break;
                    default:
                        eaf.ajax.showError(eaf.ajax.defaultError);
                        break;
                }
            }

            $dfd.reject.apply(this, arguments);
            userOptions.error && userOptions.error.apply(this, arguments);
        },

        handleUnAuthorizedRequest: function (messagePromise, targetUrl) {
            if (messagePromise) {
                messagePromise.done(function () {
                    eaf.ajax.handleTargetUrl(targetUrl);
                });
            } else {
                eaf.ajax.handleTargetUrl(targetUrl);
            }
        },

        handleResponse: function (data, userOptions, $dfd, jqXHR) {
            if (data) {
                if (data.success === true) {
                    $dfd && $dfd.resolve(data.result, data, jqXHR);
                    userOptions.success && userOptions.success(data.result, data, jqXHR);

                    if (data.targetUrl) {
                        eaf.ajax.handleTargetUrl(data.targetUrl);
                    }
                } else if (data.success === false) {
                    var messagePromise = null;

                    if (data.error) {
                        if (userOptions.eafHandleError !== false) {
                            messagePromise = eaf.ajax.showError(data.error);
                        }
                    } else {
                        data.error = eaf.ajax.defaultError;
                    }

                    eaf.ajax.logError(data.error);

                    $dfd && $dfd.reject(data.error, jqXHR);
                    userOptions.error && userOptions.error(data.error, jqXHR);

                    if (jqXHR.status === 401 && userOptions.eafHandleError !== false) {
                        eaf.ajax.handleUnAuthorizedRequest(messagePromise, data.targetUrl);
                    }
                } else { //not wrapped result
                    $dfd && $dfd.resolve(data, null, jqXHR);
                    userOptions.success && userOptions.success(data, null, jqXHR);
                }
            } else { //no data sent to back
                $dfd && $dfd.resolve(jqXHR);
                userOptions.success && userOptions.success(jqXHR);
            }
        },

        blockUI: function (options) {
            if (options.blockUI) {
                if (options.blockUI === true) { //block whole page
                    eaf.ui.setBusy();
                } else { //block an element
                    eaf.ui.setBusy(options.blockUI);
                }
            }
        },

        unblockUI: function (options) {
            if (options.blockUI) {
                if (options.blockUI === true) { //unblock whole page
                    eaf.ui.clearBusy();
                } else { //unblock an element
                    eaf.ui.clearBusy(options.blockUI);
                }
            }
        },

        ajaxSendHandler: function (event, request, settings) {
            var token = eaf.security.antiForgery.getToken();
            if (!token) {
                return;
            }

            if (!eaf.security.antiForgery.shouldSendToken(settings)) {
                return;
            }

            if (!settings.headers || settings.headers[eaf.security.antiForgery.tokenHeaderName] === undefined) {
                request.setRequestHeader(eaf.security.antiForgery.tokenHeaderName, token);
            }
        }
    });

    $(document).ajaxSend(function (event, request, settings) {
        return eaf.ajax.ajaxSendHandler(event, request, settings);
    });

    /* JQUERY PLUGIN ENHANCEMENTS ********************************************/

    /* jQuery Form Plugin 
     * http://www.malsup.com/jquery/form/
     */

    // eafAjaxForm -> uses ajaxForm ------------------------------------------

    if ($.fn.ajaxForm) {
        $.fn.eafAjaxForm = function (userOptions) {
            userOptions = userOptions || {};

            var options = $.extend({}, $.fn.eafAjaxForm.defaults, userOptions);

            options.beforeSubmit = function () {
                eaf.ajax.blockUI(options);
                userOptions.beforeSubmit && userOptions.beforeSubmit.apply(this, arguments);
            };

            options.success = function (data) {
                eaf.ajax.handleResponse(data, userOptions);
            };

            //TODO: Error?

            options.complete = function () {
                eaf.ajax.unblockUI(options);
                userOptions.complete && userOptions.complete.apply(this, arguments);
            };

            return this.ajaxForm(options);
        };

        $.fn.eafAjaxForm.defaults = {
            method: 'POST'
        };
    }

    eaf.event.on('eaf.dynamicScriptsInitialized', function () {
        eaf.ajax.defaultError.message = eaf.localization.eaf('DefaultError');
        eaf.ajax.defaultError.details = eaf.localization.eaf('DefaultErrorDetail');
        eaf.ajax.defaultError401.message = eaf.localization.eaf('DefaultError401');
        eaf.ajax.defaultError401.details = eaf.localization.eaf('DefaultErrorDetail401');
        eaf.ajax.defaultError403.message = eaf.localization.eaf('DefaultError403');
        eaf.ajax.defaultError403.details = eaf.localization.eaf('DefaultErrorDetail403');
        eaf.ajax.defaultError404.message = eaf.localization.eaf('DefaultError404');
        eaf.ajax.defaultError404.details = eaf.localization.eaf('DefaultErrorDetail404');
    });

})(jQuery);
