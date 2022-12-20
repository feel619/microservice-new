let controller = {};
var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.clientId
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
var cognitoUser = userPool.getCurrentUser();
let subUser = _config.subUser;
let regionList = {};
let ringTimeOut;
let enLargeMap = false;
let connectionId = localStorage.getItem('connectionId');

function renderMenu(file, renderId, user_type) {
    let admin = false;
    let admin_region_view = false;
    ((user_type === "region_admin" || user_type === "admin") ? admin_region_view = true : admin_region_view = false);
    ((user_type === "admin") ? admin = true : admin = false);
    let module = {
        'home': 'home',
        'replay': 'replay',
        'publisher': 'publisher',
        'admin': 'admin',
        'region': 'region',
        'callbox': 'callbox',
        'shortcut': 'shortcut',
        'group': 'group',
        'cbMessageLog': 'cbMessageLog',
        'caseAlertRealTime': 'caseAlertRealTime',
        'caseReports': 'caseReports',
        'trafficMonitor': 'trafficMonitor',
        'callCount': 'callCount',
        'systemAvailability': 'systemAvailability',
        'firmwareRepository': 'firmwareRepository',
        'callBoxCommanding': 'callBoxCommanding',
        'systemCodeConfiguration': 'systemCodeConfiguration',
        'caseHistory': 'caseHistory',//Knightscope Alerts History
        'caseSummary': 'caseSummary',//Call Summary
        'caseViewLog': 'caseViewLog',//View Log
        'subModule': 'admin|region|callbox|shortcut'
    };
    Mustache.Formatters = {
        /**
         * @return {string}
         */
        ActiveTab: function (str) {
            return (str.match(activeModule)) ? 'active' : '';
        },
    };
    fetch(file)
        .then((response) => response.text())
        .then((template) => {
            let rendered = Mustache.render(template, {
                admin: admin,
                admin_region_view: admin_region_view,
                module: module
            });
            $('#' + renderId).html(rendered).promise().done(function () {
                let names = cognitoUser.username + '<br>' + cognitoUser.storage.user_name;
                $("#auth_username").html(names);
                loadMobileMenu();
                GetUsers();
            });
        });
    //if (activeModule !== 'home') getLiveChatBox();
}

$(document).ready(function () {
    window.onload = function () {
        let subIdUser = sessionStorage.getItem("subIdUser");
        if (cognitoUser != null && subIdUser != null) {
            cognitoUser.getSession(function (err, session) {
                if (err) {
                    signOut();
                    return;
                }
                let subIdUser = cognitoUser.signInUserSession.idToken.payload.sub;
                localStorage.setItem("subIdUser", subIdUser);
                getConfigSettings();
                GetUserProfile(subIdUser);
            });
        } else {
            locateToLogin();
        }
    };
    $(document).on('click', '#auth_logout', function (event) {
        signOut();
    });
    let window_width = $(window).width(),
        window_height = window.innerHeight,
        header_height = $(".default-header").height(),
        header_height_static = $(".site-header.static").outerHeight(),
        fitscreen = window_height - header_height;

    $(".fullscreen").css("height", window_height);
    $(".fitscreen").css("height", fitscreen);
});

const loadMobileMenu = () => {
    //------- Superfist nav menu  js --------//
    $('.nav-menu').superfish({
        animation: {
            opacity: 'show'
        },
        speed: 400
    });

    //------- Mobile Nav  js --------//
    if ($('#nav-menu-container').length) {
        let $mobile_nav = $('#nav-menu-container').clone().prop({
            id: 'mobile-nav'
        });
        $mobile_nav.find('> ul').attr({
            'class': '',
            'id': ''
        });
        $('body').append($mobile_nav);
        $('.main-menu').prepend('<button type="button" id="mobile-nav-toggle"><i class="bx bx-menu"></i></button>');
        $('body').append('<div id="mobile-body-overly"></div>');
        $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-caret-down"></i>');

        $(document).on('click', '.menu-has-children i', function (e) {
            $(this).next().toggleClass('menu-item-active');
            $(this).nextAll('ul').eq(0).slideToggle();
            $(this).toggleClass("fa-caret-up fa-caret-down");
        });

        $(document).on('click', '#mobile-nav-toggle', function (e) {
            $('body').toggleClass('mobile-nav-active');
            $('#mobile-nav-toggle i').toggleClass('bx-x bx-menu');
            $('#mobile-body-overly').toggle();
        });

        $(document).on('click', function (e) {
            let container = $("#mobile-nav, #mobile-nav-toggle");
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                if ($('body').hasClass('mobile-nav-active')) {
                    $('body').removeClass('mobile-nav-active');
                    $('#mobile-nav-toggle i').toggleClass('bx-x bx-menu');
                    $('#mobile-body-overly').fadeOut();
                }
            }
        });
    } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
        $("#mobile-nav, #mobile-nav-toggle").hide();
    }

    //------- Smooth Scroll  js --------//
    $('.nav-menu a, #mobile-nav a, .scrollto').on('click', function () {
        if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
            let target = $(this.hash);
            if (target.length) {
                let top_space = 0;

                if ($('#header').length) {
                    top_space = $('#header').outerHeight();

                    if (!$('#header').hasClass('header-fixed')) {
                        top_space = top_space;
                    }
                }

                $('html, body').animate({
                    scrollTop: target.offset().top - top_space
                }, 1500, 'easeInOutExpo');

                if ($(this).parents('.nav-menu').length) {
                    $('.nav-menu .menu-active').removeClass('menu-active');
                    $(this).closest('li').addClass('menu-active');
                }

                if ($('body').hasClass('mobile-nav-active')) {
                    $('body').removeClass('mobile-nav-active');
                    $('#mobile-nav-toggle i').toggleClass('lnr-times lnr-bars');
                    $('#mobile-body-overly').fadeOut();
                }
                return false;
            }
        }
    });


    $('html, body').hide();
    if (window.location.hash) {
        setTimeout(function () {
            $('html, body').scrollTop(0).show();
            $('html, body').animate({
                scrollTop: $(window.location.hash).offset().top - 108
            }, 1000)
        }, 0);
    } else {
        $('html, body').show();
    }

    //------- Header Scroll Class  js --------//
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('#header').addClass('header-scrolled');
        } else {
            $('#header').removeClass('header-scrolled');
        }
    });
}

function sendHTTPRequest(api, method, data, callback, hideLoaderView = false) {
    if (!hideLoaderView) showLoader();
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        url = _config.apiURL + api;
        let settings = {
            "url": url.trim(),
            "method": method,
            "data": JSON.stringify(data),
            "headers": {
                "Authorization": "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            "crossDomain": true
        };
        $.ajax(settings).done(function (response) {
            hideloader();
            callback(response);
            //toastr.success(defaultLang[result], 'Success!');
        }).fail(function (response) {
            hideloader();
            if (response.responseJSON === undefined) {
                console.log(response, " responseJSON ");
                toastr.success('Success!', "it takes time please refresh after some time!");
                callback(response);
            }
            toastr.error(response.responseJSON.message);
            console.log("response", response.responseJSON.message);
        });
    });
}

function sendCaseCloudHTTPRequest(api, method, data, callback, hideLoaderView = false) {
    if (!hideLoaderView) showLoader();
    let url = _config.caseCloudAdminApiURL + api;
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let subIdUser = session.getIdToken().payload.sub;
        let jsonData = (method === 'GET') ? '' : JSON.stringify(data);
        let settings = {
            "url": url.trim(),
            "method": method,
            "data": jsonData,
            "headers": {
                "Authorization": "Bearer " + idToken,
                //    "sub": subIdUser,
                "Content-Type": "application/json"
            },
            "crossDomain": true
        };
        $.ajax(settings).done(function (response) {
            hideloader();
            callback(response);
        }).fail(function (response) {
            hideloader();
            toastr.error(response.responseJSON.message);
            if(response.status === 401) signOut();
        });
    });
}

function sendHTTPFormRequest(api, method, data, callback) {
    showLoader();
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let url = _config.apiURL + api;
        let settings = {
            "url": url,
            "method": method,
            "headers": {
                "Authorization": "Bearer " + idToken
            },
            //    "mimeType": "multipart/form-data",
            "cache": false,
            "contentType": false,
            "processData": false,
            "data": data,
            "crossDomain": true
        };
        $.ajax(settings).done(function (response) {
            hideloader();
            toastr.success('Success!', 'Success!');
            callback(response);
        }).fail(function (response) {
            hideloader();
            if (response.responseJSON === undefined) {
                console.log(response, " responseJSON ");
                toastr.success('Success!', "it takes time please refresh after some time!");
                callback(response);
            }
            toastr.error(response.responseJSON.message);
        });
    });
}


function sendCaseCloudFormRequest(api, method, data, callback) {
    showLoader();
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let url = _config.caseCloudAdminApiURL + api;
        let settings = {
            "url": url,
            "method": method,
            "headers": {
                "Authorization": "Bearer " + idToken
            },
            //"mimeType": "multipart/form-data",
            "cache": false,
            "contentType": false,
            "processData": false,
            "data": data,
            "crossDomain": true
        };
        $.ajax(settings).done(function (response) {
            hideloader();
            toastr.success('Success!', 'Success!');
            callback(response);
        }).fail(function (response) {
            hideloader();
            if (response.responseJSON === undefined) {
                console.log(response, " responseJSON ");
                toastr.success('Success!', "it takes time please refresh after some time!");
                callback(response);
            }
            toastr.error(response.responseJSON.message);
        });
    });
}

function callDataTable(element, api, filters, columns, drawCallBack, columnDefs, OrderDesAsc) {
    showLoader();
    let dataTable = $('#' + element);
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let url = _config.apiURL + api;
        return dataTable.DataTable({
            // fixedHeader: true,
            // "scrollX": true,
            processing: true,
            // serverSide: true,
            aaSorting: [[0, "desc"]],
            order: OrderDesAsc,
            ajax: {
                url: url,
                'method': "POST",
                headers: {
                    "Authorization": "Bearer " + idToken,
                },
                "crossDomain": true,
                beforeSend: function() {
                    cognitoUser.getSession(function (err, session) {
                        if (err) {
                            signOut();
                            return;
                        }
                        idToken = session.getIdToken().getJwtToken();
                    });
                },
                data: function (json) {
                    hideloader();
                    json = {...json, ...filters};
                    return JSON.stringify(json);
                },
                error: function (xhr, error, code) {
                    hideloader();
                    console.log(xhr);
                    console.log(code);
                    let subIdUser = cognitoUser.signInUserSession.idToken.payload.sub;
                    GetUserProfile(subIdUser);
                }
            },
            columns: columns,
            drawCallback: drawCallBack,
            columnDefs: columnDefs,
        });
    });
}

function callCaseCloudDataTable(element, api, filters, columns, drawCallBack, columnDefs, OrderDesAsc) {
    showLoader();
    let dataTable = $('#' + element);
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let url = _config.caseCloudAdminApiURL + api;
        return dataTable.DataTable({
            // fixedHeader: true,
            // "scrollX": true,
            responsive: true,
            processing: true,
            serverSide: true,
            searching: false,
            lengthChange: true,
            pageLength: 10,
            pagingType: 'full_numbers',
            aaSorting: [[0, "desc"]],
            order: OrderDesAsc,
            "dom": 'l<"toolbar_values float-right">frtip',
            "language": {
                "infoFiltered": ""
            },
            ajax: {
                url: url,
                "type": "POST",
                // 'method': "POST",
                headers: {
                    "Authorization": "Bearer " + idToken,
                    'Content-Type': 'application/json',
                },
                "crossDomain": true,
                contentType: "application/json",
                dataType: "json",
                beforeSend: function() {
                    cognitoUser.getSession(function (err, session) {
                        if (err) {
                            signOut();
                            return;
                        }
                        idToken = session.getIdToken().getJwtToken();
                    });
                },
                data: function (json) {
                    hideloader();
                    json = {...json, ...filters};
                    return JSON.stringify(json);
                },
                error: function (xhr, error, code) {
                    hideloader();
                    console.log(xhr);
                    console.log(code);
                }
            },
            columns: columns,
            drawCallback: drawCallBack,
            columnDefs: columnDefs,
        });
    });
}

function callCaseAlertDataTable(element, api, filters, columns, drawCallBack, columnDefs, OrderDesAsc, createdRow) {
    showLoader();
    let dataTable = $('#' + element);
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let url = _config.caseCloudAdminApiURL + api;
        return dataTable.DataTable({
            autoWidth: false,
            responsive: true,
            processing: true,
            serverSide: true,
            searching: false,
            pageLength: 50,
            lengthChange: true,
            pagingType: 'full_numbers',
            aaSorting: [[0, "desc"]],
            order: OrderDesAsc,
            dom: '<"toolbar_values float-right">t',
            language: {"infoFiltered": ""},
            bInfo: false,
            ajax: {
                url: url,
                type: "POST",
                headers: {
                    //"Authorization": "Bearer " + idToken,
                    'Content-Type': 'application/json'
                },
                crossDomain: true,
                contentType: "application/json",
                dataType: "json",
                async: false,
                beforeSend: function(xhr, settings) {
                    cognitoUser.getSession(function (err, session) {
                        if (err) {
                            signOut();
                            return;
                        }
                        let idToken = session.getIdToken().getJwtToken();
                        xhr.setRequestHeader("Authorization", "Bearer " + idToken);
                        console.log(idToken, " callCaseAlertDataTable SETToken ",settings.headers);
                        $.ajaxSetup({
                            headers: {
                                "Authorization": "Bearer " + idToken,
                            }
                        });
                        //settings.data = $.extend(settings.data, {isAjax: true});
                        settings.headers = {
                            "Authorization": "Bearer " + idToken,
                        };
                        console.log(" callCaseAlertDataTable headers ",settings.headers);
                        $.ajax($.extend(settings, {beforeSend: $.noop}));
                    });
                    console.log("callCaseAlertDataTable Add",xhr,settings);
                    return false;
                },
                data: function (json) {
                    json = {...json, ...filters};
                    return JSON.stringify(json);
                },
                error: function (xhr, error, code) {
                    console.log(xhr);
                    console.log(code);
                }
            },
            columns: columns,
            drawCallback: drawCallBack,
            columnDefs: columnDefs,
            createdRow: createdRow,
            rowsGroup: [
                'third:name',
                'fourth:name',
                'six:name',
                'eight:name',
                'nine:name'
            ]
        }).on('processing.dt', function (e, settings, processing) {
            console.log(processing," callCaseAlertDataTable processing  ");
            processing ? showLoader() : hideloader();
        });
    });
}

function callCaseCloudLogDataTable(element, api, filters, columns, drawCallBack, rawCallBack, columnDefs, OrderDesAsc) {
    showLoader();
    let dataTable = $('#' + element);
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let url = _config.caseCloudAdminApiURL + api;
        return dataTable.DataTable({
            //    "scrollY": "500px",
            //    "scrollCollapse": true,
            processing: true,
            serverSide: true,
            searching: false,
            lengthChange: false,
            pageLength: 50,
            pagingType: 'full_numbers',
            aaSorting: [[0, "desc"]],
            order: OrderDesAsc,
            ajax: {
                url: url,
                "type": "POST",
                headers: {
                    "Authorization": "Bearer " + idToken,
                    'Content-Type': 'application/json',
                },
                "crossDomain": true,
                contentType: "application/json",
                dataType: "json",
                beforeSend: function() {
                    cognitoUser.getSession(function (err, session) {
                        if (err) {
                            signOut();
                            return;
                        }
                        idToken = session.getIdToken().getJwtToken();
                    });
                },
                data: function (json) {
                    hideloader();
                    json = {...json, ...filters};
                    return JSON.stringify(json);
                },
                error: function (xhr, error, code) {
                    hideloader();
                }
            },
            columns: columns,
            drawCallback: drawCallBack,
            columnDefs: columnDefs,
            rowCallback: rawCallBack,
        });
    });
}

// Sweet Alert
function removeData(api, method, id, callback) {
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        let param = {};
        param['cf_status'] = '3';
        let url = _config.apiURL + api;
        Swal.fire({
            title: "Are you sure you want to delete this record?",
            text: "",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.value) {
                $.ajax({
                    type: method,
                    url: url + '?id=' + id,
                    headers: {
                        "Authorization": "Bearer " + idToken,
                    },
                    data: JSON.stringify(param),
                    crossDomain: true,
                    processData: false,
                    success: function (result) {
                        console.log(result);
                        return callback(result);
                    },
                    complete: function (xhr) {
                        console.log(xhr);
                    }
                });
                callback(true);
            } else {
                callback(false);
            }
        });
    });
}

//cognito user Delete
function removeCognitoUserData(api, method, data, callback) {
    cognitoUser.getSession(function (err, session) {
        if (err) {
            signOut();
            return;
        }
        let idToken = session.getIdToken().getJwtToken();
        url = _config.apiURL + api;
        Swal.fire({
            title: "Are you sure you want to delete this record?",
            text: "",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.value) {
                let settings = {
                    "url": url,
                    "method": method,
                    "data": JSON.stringify(data),
                    "headers": {
                        "Authorization": "Bearer " + idToken,
                        "Content-Type": "application/json"
                    },
                    "crossDomain": true
                };
                $.ajax(settings).done(function (response) {
                    callback(response);
                    //toastr.success(defaultLang[result], 'Success!');
                }).fail(function (response) {
                    toastr.error(response.responseJSON.message);
                    callback(false);
                });
            } else {
                callback(false);
            }
        });
    });
}

function GetUserProfile(id) {
    //id = '5b6e84e7-9bf4-4f1d-9742-5944752de793';
    sendCaseCloudHTTPRequest("users/getUser/" + id, "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            if (ResponseData.cf_status === '1') {
                let user_role = ResponseData.user_role;
                localStorage.setItem("user_name", ResponseData.name);
                localStorage.setItem("user_type", ResponseData.user_type);
                localStorage.setItem("user_role", user_role);
                localStorage.setItem("cf_status", ResponseData.cf_status);
                checkModulePermission(user_role,ResponseData);
            } else {
                signOut();
            }
        }
    });
}

function GetUsers() {
    sendCaseCloudHTTPRequest("users/getUserType/admin", "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let emails = [];
            $.each(ResponseData, function (resInd, resValue) {
                let emailVal = resValue['email'];
                emails.push(emailVal);
            });
            let mailToEmail = emails.toString();
            let formatBody = 'subject=Knightscope%20Cloud%20--%20category%20--%20issue%20title&body=Support%20Instructions:%0A%20%0A1.Please%20edit%20email%20Subject%20providing%20a%20selected%20category%20and%20issue%20title.%20%0A%20For%20example,%20%22Need%20new%20classification%20type%20%E2%80%94%20Non-emergence%20%E2%80%94%20%20Bicyclist%20assistance%22%0A%20Category:%0A%201.%20Urgent%20Issue%20Call%20box%20%0A%202.%20Urgent%20Issue%20%0A%203.%20User%20Help%0A%204.%20Feature%20request)%0A%0A------------------------------------------------------------------------------%0A2.Provide%20a%20detail%20description%20of%20the%20issue%20in%20the%20email%20text%0A%20%0AYour%20CASE%20Cloud%20Support%20Issue%20will%20be%20sent%20to%20a%20CASE%20Cloud%20Administrator%20to%20be%20resolved.';//Javascript XHR encode
            let mailto = 'mailto:' + mailToEmail + '?' + (formatBody);
            $("#mailTo").attr("href", mailto);
        }
    });
}

let regionAdmin = {};

function GetRegionList() {
    sendCaseCloudHTTPRequest('region/list', "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            regionAdmin = result.data;
            let region_box_html = '';
            if (activeModule === 'group') {
                region_box_html += '<option data-isAnnotation="none" data-code="None" data-name="None" value="" >None</option>';
            }
            if (activeModule !== 'caseAlertRealTime' && activeModule !== 'caseReports' && activeModule !== 'trafficMonitor' && activeModule !== 'firmwareRepository') {
                region_box_html = '<option value="" >All</option>';
            }
            $.each(ResponseData, function (index, value) {
                regionList[value.id] = value;
                region_box_html += '<option  data-isAnnotation="' + value.is_annotation + '" data-code="' + value.region_code + '" data-name="' + value.region_name + '" value="' + value.id + '" >' + value.region_name + '</option>';
            });
            $("#region_id").html(region_box_html);
            $("#admin_region_box").html(region_box_html);
            if (activeModule !== 'replay') onChangeSelect();
        }
    });
}

function onChangeSelect() {
    let selected_region = localStorage.getItem("region_id");
    selected_region = selected_region ? selected_region : $("select#admin_region_box>option:eq(0)").val();
    $("#admin_region_box").val(selected_region);
    $('#admin_region_box').trigger("change");
}

function signOut() {
    console.log("signOut");
    if (cognitoUser != null) {
        cognitoUser.signOut();
    }
    localStorage.clear();
    locateToLogin();
}

function locateToLogin() {
    window.location = _config.domain + "login.html";
}

function showLoader() {
    $('#main_loader').show();
}

function hideloader() {
    $('#main_loader').hide();
}

$('[data-toggle="tooltip"]').tooltip({
    boundary: 'window'
});

(function ($) {
    $.fn.inputFilter = function (inputFilter) {
        return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }
        });
    };
}(jQuery));

const getChatMessageByRoom = (pub_id) => {
    console.log(infoChat[pub_id], " getChatMessageByRoom ");
    sendHTTPRequest("chat?id=" + infoChat[pub_id].replayId, "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            renderChatCallBox('template/chat_message.mustache', 'chatView', {response: ResponseData}, () => {
            });
        }
    });
};

function renderChatCallBox(file, renderId, jsonData, callback) {
    Mustache.Formatters = {
        date: function (str) {
            let date = new Date(str);
            let hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
            let minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
            return (date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + ' ' + hours + ':' + minutes);
        },
        /**
         * @return {string}
         */
        IsUser: function (str) {
            let subIdUser = sessionStorage.getItem("subIdUser");
            if (connection_type === 'publisher') {
                return (str === subUser) ? 'right' : 'left';
            } else if (connection_type === 'replay') {
                return (str === subUser) ? 'left' : 'right';
            }
            return (str === subIdUser) ? 'right' : 'left';
        }
    };
    fetch(file)
        .then((response) => response.text())
        .then((template) => {
            let rendered = Mustache.render(template, jsonData);
            $('.' + renderId).append(rendered).promise().done(function () {
                bottomScrolling();
                callback();
            });
        });
}

const bottomScrolling = () => {
    let scrollHeight = $('#chatView')[0].scrollHeight;
    /* setTimeout(function(){
         $('#chatView').animate({
             scrollTop: $('#chatView')[0].scrollHeight}, 2000);
     }, 5000);*/
    $('#chatView').animate({
        scrollTop: $('#chatView')[0].scrollHeight
    }, 2000);
};

let audio = new Audio('vendors/sound/loginAudio.mp3');
let allowed_audio = false;

function AddPubAudio() {
    let audio = new Audio('vendors/sound/loginAudio.mp3');
    //if (allowed_audio == true) {
    audio.play();
    //}
}

let setTimer;
let audioInvite = new Audio('vendors/sound/mobile-phone.mp3');
const AddInviteAudio = (publisherData) => {
    let user_type = localStorage.getItem("user_type");
    //when role is viewer then play ring
    if (user_type === "viewer" && enLargeMap === false) {
        audioInvite.play();
        //AddMissCallAnnotate(publisherData);
    }
};
const stopInviteAudio = () => {
    console.log(setTimer, " setTimer ");
    audioInvite.pause();
    audioInvite.currentTime = 0;
    clearInterval(setTimer);
};

const AddMissCallAnnotate = (publisherData) => {
    console.log(publisherData, "publisherData")
    if (publisherData.replayId) {
        let resultData = {};
        resultData['callBox'] = publisherData.callBoxData;
        resultData['chatRoomId'] = publisherData.roomId;
        resultData['video_id'] = publisherData.replayId;
        resultData['classification_name'] = 'Missed Call';
        resultData['classification_id'] = '1';
        resultData['note'] = 'In-coming call not answered by available operation within 20 seconds. Call ring transferred to next available operator.';
        console.log(resultData);
        sendHTTPRequest("replay/annotate_create", "POST", resultData, function (result) {
            console.log(result, "AddMissCallAnnotated");
        }, true);
    }
};

const rotatingQueue = (publisherData) => {
    //sending rotation list same id ignore
    console.log(publisherData, " rotatingQueue ");
    let subIdUser = sessionStorage.getItem("subIdUser");
    let timeOut = publisherData.timeOut;
    clearTimeout(ringTimeOut);
    ringTimeOut = setTimeout(function () {
        let reqMsg = {
            "connection_type": 'RPIMessage',
            "message": 'CB_TTY_RING',
            "sub": subIdUser,
            "remoteAddress": publisherData.remoteAddress,
            "remotePort": publisherData.remotePort,
            "roomId": publisherData.roomId,
            "regionId": publisherData.regionId,
            "replayId": publisherData.replayId,
            "name": publisherData.name,
            "user_type": localStorage.getItem('user_type'),
            "reason": '',
            "RPI": "0"
        };
        chatMessage(reqMsg);
    }, timeOut);
};

const ICDCharMatch = (e) => {
    let regex = new RegExp("^[a-zA-Z0-9 !“$&‘(),-./:;?]+$");
    let str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if (regex.test(str)) {
        return true;
    }
    e.preventDefault();
    return false;
};

const alert_elem = document.querySelector('.alert_sound');

function permissionSound() {
    audio.play().then(() => {
        alert_elem.remove();
        console.log(" audio_remove permissionSound ");
        initIndex();
        resetAudio();
    }).catch(() => {
        alert_elem.addEventListener('click', ({target}) => {
            if (target.matches('button')) {
                const allowed = target.value === "1";
                if (allowed) {
                    audio.play().then(resetAudio);
                }
                alert_elem.remove();
            }
            initIndex();
        });
    });
}

function resetAudio() {
    audio.pause();
    allowed_audio = true;
    // audio.muted = false;
}

console.log("refresh refreshTimeout", new Date());
const refreshTimeout = setTimeout(function () {
    clearTimeout(refreshTimeout);
    console.log("refreshTimeoutIn::", new Date());
    location.reload();
}, 43200000);//43200000 12hour

const getLiveChatBox = () => {
    sendHTTPRequest("chat/live", "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            $.each(ResponseData, function (resInd, resValue) {
                let roomId = resValue.id;
                if (!resValue.isAccept) {
                    let roomViewers = resValue.viewers;
                    let countViewers = roomViewers.length;
                    let positionViewer = roomViewers.indexOf(connectionId);
                    let timeRotation = (positionViewer === -1 && countViewers === 0 || positionViewer === 0 && countViewers === 1) ? 1000 : (positionViewer === -1 && countViewers > 0) ? countViewers * 20000 : positionViewer * 20000;
                    console.log(roomViewers, "found at position", positionViewer, " countViewers", countViewers, " timeRotation", timeRotation);
                    resValue.inviteEvent['timeOut'] = timeRotation;//same viewer then add viewer position * 5
                    rotatingQueue(resValue.inviteEvent); //if viewer 1 then 5 so 5sec*2viewer = 10sec
                }
                if (activeModule === 'home' && runningPublisherId.indexOf(roomId) === -1) {
                    runningPublisherId.push(roomId);
                    let callBoxName = resValue.regionData.region_name + '-' + resValue.callBox.ani_number;
                    let phone = resValue.callBox.source_phone_number;
                    infoChat[roomId] = resValue.inviteEvent;
                    infoChat[roomId]['regionId'] = resValue.callBox.region_id;
                    infoChat[roomId]['name'] = callBoxName;
                    infoChat[roomId]['replayId'] = resValue.replayId;
                    infoChat[roomId]['countIndex'] = 0;
                    infoChat[roomId]['isAccept'] = resValue.isAccept;
                    const user_type = localStorage.getItem('user_type');
                    const observer = ['technician', 'project', 'observer'];
                    let isAccept = '';
                    if (observer.indexOf(user_type) > -1) {
                        isAccept = resValue.isAccept ? 'show' : 'hide';
                    }
                    renderChatCallBox('template/chat_call_box_view.mustache', 'bottom_chat_call_box_view', {
                        id: roomId,
                        callBoxName: callBoxName,
                        phone: phone,
                        bottomView: true,
                        user_type: user_type,
                        isAccept: isAccept,
                        onStatus: 'de-active'
                    }, () => {
                        infoChat[roomId]['countIndex'] = infoChat[roomId]['countIndex'] + 1;
                        if (infoChat[roomId]['countIndex'] === 2) {
                            let deadline = new Date(resValue.updatedAt);
                            initializeClock(roomId, deadline, resValue.isAccept);
                        }
                    });
                    renderChatCallBox('template/chat_call_box_view.mustache', 'side_bar_video_view', {
                        id: roomId,
                        callBoxName: callBoxName,
                        phone: phone,
                        bottomView: false,
                        user_type: user_type,
                        isAccept: isAccept,
                        onStatus: 'de-active'
                    }, () => {
                        infoChat[roomId]['countIndex'] = infoChat[roomId]['countIndex'] + 1;
                        if (infoChat[roomId]['countIndex'] === 2) {
                            let deadline = new Date(resValue.updatedAt);
                            initializeClock(roomId, deadline, resValue.isAccept);
                        }
                    });
                    $(".chat-list #pub_" + roomId).removeClass('video-hide');
                    $(".chat-list #pub_child_" + roomId).removeClass('video-hide');
                    resetPlayIcon(roomId);
                    markersPlay[roomId]['customInfo'] = 'chat';
                }
            });
        }
    });
};

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

const copyData = (containerId) => {
    let range = document.createRange();
    range.selectNode(containerId); //changed here
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    toastr.success('Copy', 'Success!');
};

$.fn.serializeControls = function() {
    var data = {};

    function buildInputObject(arr, val) {
        if (arr.length < 1)
            return val;
        var objkey = arr[0];
        if (objkey.slice(-1) == "]") {
            objkey = objkey.slice(0,-1);
        }
        var result = {};
        if (arr.length == 1) {
            result[objkey] = val;
        } else {
            arr.shift();
            var nestedVal = buildInputObject(arr,val);
            result[objkey] = nestedVal;
        }
        return result;
    }

    $.each(this.serializeArray(), function() {
        var val = this.value;
        var c = this.name.split("[");
        var a = buildInputObject(c, val);
        $.extend(true, data, a);
    });

    return data;
};

// convert utc time to another timezone
function convertUTCToTimezone(utcDt, utcDtFormat, timezone) {
    return moment.utc(utcDt, utcDtFormat).tz(timezone).format('MM-DD-YYYY HH:mm:ss z');
}
function createFirmwareFileName(firmware_family,firmware_rev,firmware_radio_handler_revision) {
    let radioHandler = ('0' + firmware_radio_handler_revision).slice(-3);
    return firmware_family+firmware_rev+radioHandler+'.hex';
}

const messageTTYAlarm = {
    '237': 'No TTY alarms',
    '227': 'TTY keyboard alarm',
    '233': 'TTY display alarm',
    '235': 'TTY light alarm',
    '236': 'TTY tray alarm',
    '231': 'TTY display alarm, TTY light alarms',
    '221': 'TTY keyboard, TTY display, and TTY light alarms',
    '223': 'No TTY alarms',
};
const ftcToolTip = {
    'primary': "When a Call Box does not check-in at it's primary check-in time.",
    'secondary': "When a Call Box does not check-in at it's secondary check-in time. A secondary check-in is only expected when the primary check-in fails."
};
const pluralize = (val, word, plural = word) => {
    const _pluralize = (num, word, plural = word) =>
        [1, -1].includes(Number(num)) ? word : plural;
    if (typeof val === 'object') return (num, word) => _pluralize(num, word, val[word]);
    return _pluralize(val, word, plural);
};

function getDuration(date1, date2) {

    let days = date1.diff(date2, 'days');
    date2.add(days, 'days');

    let hours = date1.diff(date2, 'hours');
    date2.add(hours, 'hours');

    let minutes = date1.diff(date2, 'minutes');
    date2.add(minutes, 'minutes');

    return (days + 'd ' + hours + 'hr ' + minutes + 'min ');
}

function getTimeZoneList() {
    return [
        "Africa/Abidjan",
        "Africa/Accra",
        "Africa/Addis_Ababa",
        "Africa/Algiers",
        "Africa/Asmara",
        "Africa/Asmera",
        "Africa/Bamako",
        "Africa/Bangui",
        "Africa/Banjul",
        "Africa/Bissau",
        "Africa/Blantyre",
        "Africa/Brazzaville",
        "Africa/Bujumbura",
        "Africa/Cairo",
        "Africa/Casablanca",
        "Africa/Ceuta",
        "Africa/Conakry",
        "Africa/Dakar",
        "Africa/Dar_es_Salaam",
        "Africa/Djibouti",
        "Africa/Douala",
        "Africa/El_Aaiun",
        "Africa/Freetown",
        "Africa/Gaborone",
        "Africa/Harare",
        "Africa/Johannesburg",
        "Africa/Juba",
        "Africa/Kampala",
        "Africa/Khartoum",
        "Africa/Kigali",
        "Africa/Kinshasa",
        "Africa/Lagos",
        "Africa/Libreville",
        "Africa/Lome",
        "Africa/Luanda",
        "Africa/Lubumbashi",
        "Africa/Lusaka",
        "Africa/Malabo",
        "Africa/Maputo",
        "Africa/Maseru",
        "Africa/Mbabane",
        "Africa/Mogadishu",
        "Africa/Monrovia",
        "Africa/Nairobi",
        "Africa/Ndjamena",
        "Africa/Niamey",
        "Africa/Nouakchott",
        "Africa/Ouagadougou",
        "Africa/Porto-Novo",
        "Africa/Sao_Tome",
        "Africa/Timbuktu",
        "Africa/Tripoli",
        "Africa/Tunis",
        "Africa/Windhoek",
        "America/Adak",
        "America/Anchorage",
        "America/Anguilla",
        "America/Antigua",
        "America/Araguaina",
        "America/Argentina/Buenos_Aires",
        "America/Argentina/Catamarca",
        "America/Argentina/ComodRivadavia",
        "America/Argentina/Cordoba",
        "America/Argentina/Jujuy",
        "America/Argentina/La_Rioja",
        "America/Argentina/Mendoza",
        "America/Argentina/Rio_Gallegos",
        "America/Argentina/Salta",
        "America/Argentina/San_Juan",
        "America/Argentina/San_Luis",
        "America/Argentina/Tucuman",
        "America/Argentina/Ushuaia",
        "America/Aruba",
        "America/Asuncion",
        "America/Atikokan",
        "America/Atka",
        "America/Bahia",
        "America/Bahia_Banderas",
        "America/Barbados",
        "America/Belem",
        "America/Belize",
        "America/Blanc-Sablon",
        "America/Boa_Vista",
        "America/Bogota",
        "America/Boise",
        "America/Buenos_Aires",
        "America/Cambridge_Bay",
        "America/Campo_Grande",
        "America/Cancun",
        "America/Caracas",
        "America/Catamarca",
        "America/Cayenne",
        "America/Cayman",
        "America/Chicago",
        "America/Chihuahua",
        "America/Coral_Harbour",
        "America/Cordoba",
        "America/Costa_Rica",
        "America/Creston",
        "America/Cuiaba",
        "America/Curacao",
        "America/Danmarkshavn",
        "America/Dawson",
        "America/Dawson_Creek",
        "America/Denver",
        "America/Detroit",
        "America/Dominica",
        "America/Edmonton",
        "America/Eirunepe",
        "America/El_Salvador",
        "America/Ensenada",
        "America/Fort_Nelson",
        "America/Fort_Wayne",
        "America/Fortaleza",
        "America/Glace_Bay",
        "America/Godthab",
        "America/Goose_Bay",
        "America/Grand_Turk",
        "America/Grenada",
        "America/Guadeloupe",
        "America/Guatemala",
        "America/Guayaquil",
        "America/Guyana",
        "America/Halifax",
        "America/Havana",
        "America/Hermosillo",
        "America/Indiana/Indianapolis",
        "America/Indiana/Knox",
        "America/Indiana/Marengo",
        "America/Indiana/Petersburg",
        "America/Indiana/Tell_City",
        "America/Indiana/Vevay",
        "America/Indiana/Vincennes",
        "America/Indiana/Winamac",
        "America/Indianapolis",
        "America/Inuvik",
        "America/Iqaluit",
        "America/Jamaica",
        "America/Jujuy",
        "America/Juneau",
        "America/Kentucky/Louisville",
        "America/Kentucky/Monticello",
        "America/Knox_IN",
        "America/Kralendijk",
        "America/La_Paz",
        "America/Lima",
        "America/Los_Angeles",
        "America/Louisville",
        "America/Lower_Princes",
        "America/Maceio",
        "America/Managua",
        "America/Manaus",
        "America/Marigot",
        "America/Martinique",
        "America/Matamoros",
        "America/Mazatlan",
        "America/Mendoza",
        "America/Menominee",
        "America/Merida",
        "America/Metlakatla",
        "America/Mexico_City",
        "America/Miquelon",
        "America/Moncton",
        "America/Monterrey",
        "America/Montevideo",
        "America/Montreal",
        "America/Montserrat",
        "America/Nassau",
        "America/New_York",
        "America/Nipigon",
        "America/Nome",
        "America/Noronha",
        "America/North_Dakota/Beulah",
        "America/North_Dakota/Center",
        "America/North_Dakota/New_Salem",
        "America/Ojinaga",
        "America/Panama",
        "America/Pangnirtung",
        "America/Paramaribo",
        "America/Phoenix",
        "America/Port-au-Prince",
        "America/Port_of_Spain",
        "America/Porto_Acre",
        "America/Porto_Velho",
        "America/Puerto_Rico",
        "America/Punta_Arenas",
        "America/Rainy_River",
        "America/Rankin_Inlet",
        "America/Recife",
        "America/Regina",
        "America/Resolute",
        "America/Rio_Branco",
        "America/Rosario",
        "America/Santa_Isabel",
        "America/Santarem",
        "America/Santiago",
        "America/Santo_Domingo",
        "America/Sao_Paulo",
        "America/Scoresbysund",
        "America/Shiprock",
        "America/Sitka",
        "America/St_Barthelemy",
        "America/St_Johns",
        "America/St_Kitts",
        "America/St_Lucia",
        "America/St_Thomas",
        "America/St_Vincent",
        "America/Swift_Current",
        "America/Tegucigalpa",
        "America/Thule",
        "America/Thunder_Bay",
        "America/Tijuana",
        "America/Toronto",
        "America/Tortola",
        "America/Vancouver",
        "America/Virgin",
        "America/Whitehorse",
        "America/Winnipeg",
        "America/Yakutat",
        "America/Yellowknife",
        "Antarctica/Casey",
        "Antarctica/Davis",
        "Antarctica/DumontDUrville",
        "Antarctica/Macquarie",
        "Antarctica/Mawson",
        "Antarctica/McMurdo",
        "Antarctica/Palmer",
        "Antarctica/Rothera",
        "Antarctica/South_Pole",
        "Antarctica/Syowa",
        "Antarctica/Troll",
        "Antarctica/Vostok",
        "Arctic/Longyearbyen",
        "Asia/Aden",
        "Asia/Almaty",
        "Asia/Amman",
        "Asia/Anadyr",
        "Asia/Aqtau",
        "Asia/Aqtobe",
        "Asia/Ashgabat",
        "Asia/Ashkhabad",
        "Asia/Atyrau",
        "Asia/Baghdad",
        "Asia/Bahrain",
        "Asia/Baku",
        "Asia/Bangkok",
        "Asia/Barnaul",
        "Asia/Beirut",
        "Asia/Bishkek",
        "Asia/Brunei",
        "Asia/Calcutta",
        "Asia/Chita",
        "Asia/Choibalsan",
        "Asia/Chongqing",
        "Asia/Chungking",
        "Asia/Colombo",
        "Asia/Dacca",
        "Asia/Damascus",
        "Asia/Dhaka",
        "Asia/Dili",
        "Asia/Dubai",
        "Asia/Dushanbe",
        "Asia/Famagusta",
        "Asia/Gaza",
        "Asia/Harbin",
        "Asia/Hebron",
        "Asia/Ho_Chi_Minh",
        "Asia/Hong_Kong",
        "Asia/Hovd",
        "Asia/Irkutsk",
        "Asia/Istanbul",
        "Asia/Jakarta",
        "Asia/Jayapura",
        "Asia/Jerusalem",
        "Asia/Kabul",
        "Asia/Kamchatka",
        "Asia/Karachi",
        "Asia/Kashgar",
        "Asia/Kathmandu",
        "Asia/Katmandu",
        "Asia/Khandyga",
        "Asia/Kolkata",
        "Asia/Krasnoyarsk",
        "Asia/Kuala_Lumpur",
        "Asia/Kuching",
        "Asia/Kuwait",
        "Asia/Macao",
        "Asia/Macau",
        "Asia/Magadan",
        "Asia/Makassar",
        "Asia/Manila",
        "Asia/Muscat",
        "Asia/Nicosia",
        "Asia/Novokuznetsk",
        "Asia/Novosibirsk",
        "Asia/Omsk",
        "Asia/Oral",
        "Asia/Phnom_Penh",
        "Asia/Pontianak",
        "Asia/Pyongyang",
        "Asia/Qatar",
        "Asia/Qyzylorda",
        "Asia/Rangoon",
        "Asia/Riyadh",
        "Asia/Saigon",
        "Asia/Sakhalin",
        "Asia/Samarkand",
        "Asia/Seoul",
        "Asia/Shanghai",
        "Asia/Singapore",
        "Asia/Srednekolymsk",
        "Asia/Taipei",
        "Asia/Tashkent",
        "Asia/Tbilisi",
        "Asia/Tehran",
        "Asia/Tel_Aviv",
        "Asia/Thimbu",
        "Asia/Thimphu",
        "Asia/Tokyo",
        "Asia/Tomsk",
        "Asia/Ujung_Pandang",
        "Asia/Ulaanbaatar",
        "Asia/Ulan_Bator",
        "Asia/Urumqi",
        "Asia/Ust-Nera",
        "Asia/Vientiane",
        "Asia/Vladivostok",
        "Asia/Yakutsk",
        "Asia/Yangon",
        "Asia/Yekaterinburg",
        "Asia/Yerevan",
        "Atlantic/Azores",
        "Atlantic/Bermuda",
        "Atlantic/Canary",
        "Atlantic/Cape_Verde",
        "Atlantic/Faeroe",
        "Atlantic/Faroe",
        "Atlantic/Jan_Mayen",
        "Atlantic/Madeira",
        "Atlantic/Reykjavik",
        "Atlantic/South_Georgia",
        "Atlantic/St_Helena",
        "Atlantic/Stanley",
        "Australia/ACT",
        "Australia/Adelaide",
        "Australia/Brisbane",
        "Australia/Broken_Hill",
        "Australia/Canberra",
        "Australia/Currie",
        "Australia/Darwin",
        "Australia/Eucla",
        "Australia/Hobart",
        "Australia/LHI",
        "Australia/Lindeman",
        "Australia/Lord_Howe",
        "Australia/Melbourne",
        "Australia/NSW",
        "Australia/North",
        "Australia/Perth",
        "Australia/Queensland",
        "Australia/South",
        "Australia/Sydney",
        "Australia/Tasmania",
        "Australia/Victoria",
        "Australia/West",
        "Australia/Yancowinna",
        "Brazil/Acre",
        "Brazil/DeNoronha",
        "Brazil/East",
        "Brazil/West",
        "CET",
        "CST6CDT",
        "Canada/Atlantic",
        "Canada/Central",
        "Canada/Eastern",
        "Canada/Mountain",
        "Canada/Newfoundland",
        "Canada/Pacific",
        "Canada/Saskatchewan",
        "Canada/Yukon",
        "Chile/Continental",
        "Chile/EasterIsland",
        "Cuba",
        "EET",
        "EST",
        "EST5EDT",
        "Egypt",
        "Eire",
        "Etc/GMT",
        "Etc/GMT+0",
        "Etc/GMT+1",
        "Etc/GMT+10",
        "Etc/GMT+11",
        "Etc/GMT+12",
        "Etc/GMT+2",
        "Etc/GMT+3",
        "Etc/GMT+4",
        "Etc/GMT+5",
        "Etc/GMT+6",
        "Etc/GMT+7",
        "Etc/GMT+8",
        "Etc/GMT+9",
        "Etc/GMT-0",
        "Etc/GMT-1",
        "Etc/GMT-10",
        "Etc/GMT-11",
        "Etc/GMT-12",
        "Etc/GMT-13",
        "Etc/GMT-14",
        "Etc/GMT-2",
        "Etc/GMT-3",
        "Etc/GMT-4",
        "Etc/GMT-5",
        "Etc/GMT-6",
        "Etc/GMT-7",
        "Etc/GMT-8",
        "Etc/GMT-9",
        "Etc/GMT0",
        "Etc/Greenwich",
        "Etc/UCT",
        "Etc/UTC",
        "Etc/Universal",
        "Etc/Zulu",
        "Europe/Amsterdam",
        "Europe/Andorra",
        "Europe/Astrakhan",
        "Europe/Athens",
        "Europe/Belfast",
        "Europe/Belgrade",
        "Europe/Berlin",
        "Europe/Bratislava",
        "Europe/Brussels",
        "Europe/Bucharest",
        "Europe/Budapest",
        "Europe/Busingen",
        "Europe/Chisinau",
        "Europe/Copenhagen",
        "Europe/Dublin",
        "Europe/Gibraltar",
        "Europe/Guernsey",
        "Europe/Helsinki",
        "Europe/Isle_of_Man",
        "Europe/Istanbul",
        "Europe/Jersey",
        "Europe/Kaliningrad",
        "Europe/Kiev",
        "Europe/Kirov",
        "Europe/Lisbon",
        "Europe/Ljubljana",
        "Europe/London",
        "Europe/Luxembourg",
        "Europe/Madrid",
        "Europe/Malta",
        "Europe/Mariehamn",
        "Europe/Minsk",
        "Europe/Monaco",
        "Europe/Moscow",
        "Europe/Nicosia",
        "Europe/Oslo",
        "Europe/Paris",
        "Europe/Podgorica",
        "Europe/Prague",
        "Europe/Riga",
        "Europe/Rome",
        "Europe/Samara",
        "Europe/San_Marino",
        "Europe/Sarajevo",
        "Europe/Saratov",
        "Europe/Simferopol",
        "Europe/Skopje",
        "Europe/Sofia",
        "Europe/Stockholm",
        "Europe/Tallinn",
        "Europe/Tirane",
        "Europe/Tiraspol",
        "Europe/Ulyanovsk",
        "Europe/Uzhgorod",
        "Europe/Vaduz",
        "Europe/Vatican",
        "Europe/Vienna",
        "Europe/Vilnius",
        "Europe/Volgograd",
        "Europe/Warsaw",
        "Europe/Zagreb",
        "Europe/Zaporozhye",
        "Europe/Zurich",
        "GB",
        "GB-Eire",
        "GMT",
        "GMT+0",
        "GMT-0",
        "GMT0",
        "Greenwich",
        "HST",
        "Hongkong",
        "Iceland",
        "Indian/Antananarivo",
        "Indian/Chagos",
        "Indian/Christmas",
        "Indian/Cocos",
        "Indian/Comoro",
        "Indian/Kerguelen",
        "Indian/Mahe",
        "Indian/Maldives",
        "Indian/Mauritius",
        "Indian/Mayotte",
        "Indian/Reunion",
        "Iran",
        "Israel",
        "Jamaica",
        "Japan",
        "Kwajalein",
        "Libya",
        "MET",
        "MST",
        "MST7MDT",
        "Mexico/BajaNorte",
        "Mexico/BajaSur",
        "Mexico/General",
        "NZ",
        "NZ-CHAT",
        "Navajo",
        "PRC",
        "PST8PDT",
        "Pacific/Apia",
        "Pacific/Auckland",
        "Pacific/Bougainville",
        "Pacific/Chatham",
        "Pacific/Chuuk",
        "Pacific/Easter",
        "Pacific/Efate",
        "Pacific/Enderbury",
        "Pacific/Fakaofo",
        "Pacific/Fiji",
        "Pacific/Funafuti",
        "Pacific/Galapagos",
        "Pacific/Gambier",
        "Pacific/Guadalcanal",
        "Pacific/Guam",
        "Pacific/Honolulu",
        "Pacific/Johnston",
        "Pacific/Kiritimati",
        "Pacific/Kosrae",
        "Pacific/Kwajalein",
        "Pacific/Majuro",
        "Pacific/Marquesas",
        "Pacific/Midway",
        "Pacific/Nauru",
        "Pacific/Niue",
        "Pacific/Norfolk",
        "Pacific/Noumea",
        "Pacific/Pago_Pago",
        "Pacific/Palau",
        "Pacific/Pitcairn",
        "Pacific/Pohnpei",
        "Pacific/Ponape",
        "Pacific/Port_Moresby",
        "Pacific/Rarotonga",
        "Pacific/Saipan",
        "Pacific/Samoa",
        "Pacific/Tahiti",
        "Pacific/Tarawa",
        "Pacific/Tongatapu",
        "Pacific/Truk",
        "Pacific/Wake",
        "Pacific/Wallis",
        "Pacific/Yap",
        "Poland",
        "Portugal",
        "ROC",
        "ROK",
        "Singapore",
        "Turkey",
        "UCT",
        "US/Alaska",
        "US/Aleutian",
        "US/Arizona",
        "US/Central",
        "US/East-Indiana",
        "US/Eastern",
        "US/Hawaii",
        "US/Indiana-Starke",
        "US/Michigan",
        "US/Mountain",
        "US/Pacific",
        "US/Pacific-New",
        "US/Samoa",
        "UTC",
        "Universal",
        "W-SU",
        "WET",
        "Zulu",
    ];
}
