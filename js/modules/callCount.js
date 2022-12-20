const urlParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let urlRegionCode = urlParams.regionCode;
let urlRegionId = '';
let duration = '';
let durationSelectionDay = '';
let urlAni = '';
let filterAni = '';

if (urlParams.regionId != null) {
    urlRegionId = urlParams.regionId;
    localStorage.setItem("region_id", urlRegionId);
} else if (localStorage.getItem("region_id")) {
    urlRegionId = localStorage.getItem("region_id");
} else {
    urlRegionId = $("select#event_ani_region_box>option:eq(1)").val();
}

filterAni = urlParams.filterAni;
if (filterAni === 'check') {
    urlAni = urlParams.ani;
    $('#fx_ani').val(urlAni);
}

GetEventRegionList();

getDuration(urlParams.duration);

let filters = {
        searchList: [
            {"field": "region_id", "operator": "is", "value": ''},
            {"field": "start_date", "operator": "is", "value": duration},
        ]
    },
    columns = [
        {data: 'region_name', orderable: false, "width": "10%",},
        {data: 'createdAt', orderable: false, "width": "10%",},
        {data: 'call_box-count', orderable: false, "width": "10%",},
        {data: 'data_voice_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_voice_success', orderable: true, "width": "5%"},
        {data: 'data_voice_fail', orderable: true, "width": "5%"},
        {data: 'data_tty_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_tty_success', orderable: true, "width": "5%"},
        {data: 'data_tty_fail', orderable: true, "width": "5%"},
        {data: 'data_cca_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_cca_success', orderable: true, "width": "5%"},
        {data: 'data_cca_fail', orderable: true, "width": "5%"},
        {data: 'data_x15_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_x15_success', orderable: true, "width": "5%"},
        {data: 'data_x15_fail', orderable: true, "width": "5%"},
        {data: 'ftc_count', orderable: true, "width": "10%",},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (region_name, type, full) {
                return '<a class="nav-link text-primary active" data-toggle="tooltip" title="' + region_name + '"  onclick="viewCaseAlert(\'' + full['region_code'] + '\',\'' + full['region_id'] + '\')"><i class="fa fa-eye "></i> &nbsp;' + region_name + '</a> ';
            }
        }, // Region code
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let timezone = full.timezone !== null ? full.timezone : 'America/Los_Angeles';
                let dateTime = full.createdAt ? full.createdAt : full.createdAt;
                return convertUTCToTimezone(dateTime, null, timezone);
            }
        },
        {
            "targets": [2],
            render: function (data, type, full) {
                // return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
                return '-'
            }
        },
        {
            "targets": [3],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [4],
            render: function (data, type, full) {
                return data + ' / ' + full['data_voice_total'];
            }
        },
        {
            "targets": [5],
            render: function (data, type, full) {
                return data + ' / ' + full['data_voice_total'];
            }
        },
        {
            "targets": [6],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [7],
            render: function (data, type, full) {
                return data + ' / ' + full['data_tty_total'];
            }
        },
        {
            "targets": [8],
            render: function (data, type, full) {
                return data + ' / ' + full['data_tty_total'];
            }
        },
        {
            "targets": [9],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [10],
            render: function (data, type, full) {
                return data + ' / ' + full['data_cca_total'];
            }
        },
        {
            "targets": [11],
            render: function (data, type, full) {
                return data + ' / ' + full['data_cca_total'];
            }
        },
        {
            "targets": [12],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [13],
            render: function (data, type, full) {
                return data + ' / ' + full['data_x15_total'];
            }
        },
        {
            "targets": [14],
            render: function (data, type, full) {
                return data + ' / ' + full['data_x15_total'];
            }
        },

    ],
    order = [15, 'desc'],
    dataHighTable = callCaseAlertDataTable('event_log_count_region_table', 'liveMessage/tableListWithEventCount', filters, columns, loadMoreData, columnDefs, order);

function ReloadCallBoxHighStatusTable() {
    filters.searchList[0]['value'] = '';
    filters.searchList[1]['value'] = duration;
    $('#event_log_count_region_table').DataTable().ajax.reload();
}

function loadMoreData(settings) {
    //$('#btn-example-load-more').toggle(this.api().page.hasMore());
}

$('#btn-example-load-more').on('click', function () {
    $('#event_log_count_region_table').DataTable().page.loadMore();
});

$(document).on('click', '.duration', function (e) {
    $('.duration').removeClass('active');
    $(this).addClass('active');
    getDuration($(this).attr('data-name'));
    if ($('.f-add:visible').length === 1) {
        ReloadEventLogANITable();
    } else {
        ReloadCallBoxHighStatusTable();
    }
});

$('.status_table tbody').on('click', 'td.dt-control', function () {
    let tr = $(this).closest('tr');
    let tableId = $(this).closest('table').attr('id');
    let table = $('#' + tableId).DataTable();
    let row = table.row(tr);
    if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
    } else {
        row.child(format(row.data())).show();
        tr.addClass('shown');
    }
});

let eventAniFilters = {
        searchList: [
            {"field": "region_id", "operator": "is", "value": urlRegionId},
            {"field": "start_date", "operator": "is", "value": duration},
            {"field": "ani", "operator": "is", "value": urlAni},
            {"field": "type", "operator": "is", "value": ''},
            {"field": "region_code", "operator": "is", "value": ''},
        ]
    },
    eventAniColumns = [
        {data: 'region_name', orderable: false, "width": "10%",},
        {data: 'ani_number', orderable: false, "width": "5%",},
        {data: 'data_voice_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_voice_success', orderable: true, "width": "5%"},
        {data: 'data_voice_fail', orderable: true, "width": "5%"},
        {data: 'data_tty_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_tty_success', orderable: true, "width": "5%"},
        {data: 'data_tty_fail', orderable: true, "width": "5%"},
        {data: 'data_cca_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_cca_success', orderable: true, "width": "5%"},
        {data: 'data_cca_fail', orderable: true, "width": "5%"},
        {data: 'data_x15_rate', className: "text-right", orderable: true, "width": "5%"},
        {data: 'data_x15_success', orderable: true, "width": "5%"},
        {data: 'data_x15_fail', orderable: true, "width": "5%"},
        {data: 'ftc_count', orderable: true, "width": "10%",},
    ],
    eventAniColumnDefs = [
        {
            "targets": [0],
            render: function (region_name, type, full) {
                return region_name;
            }
        },
        {
            "targets": [1],
            render: function (data, type, full) {
                let edit_html = '';
                let redirect_url = `?backUrl=callCount&regionId=${full['region_id']}&regionCode=${full['region_name']}&ani=${full['ani_number']}&duration=${durationSelectionDay}&filterAni=${filterAni}`;
                edit_html += '<a data-toggle="tooltip" title="Edit" class="text-primary"  href="callbox.html?id=' + full['call_box_id'] + '" ><i class="fa fa-edit"></i></a>';
                edit_html += '<a data-toggle="tooltip" title="Traffic Monitor" class="text-primary active"  href="trafficMonitor.html' + redirect_url + '"`>&nbsp;' + data + '&nbsp;<i class="fa fa-eye"></i></a>';
                return edit_html;
            }
        },
        {
            "targets": [2],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [3],
            render: function (data, type, full) {
                return data + ' / ' + full['data_voice_total'];
            }
        },
        {
            "targets": [4],
            render: function (data, type, full) {
                return data + ' / ' + full['data_voice_total'];
            }
        },
        {
            "targets": [5],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [6],
            render: function (data, type, full) {
                return data + ' / ' + full['data_tty_total'];
            }
        },
        {
            "targets": [7],
            render: function (data, type, full) {
                return data + ' / ' + full['data_tty_total'];
            }
        },
        {
            "targets": [8],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [9],
            render: function (data, type, full) {
                return data + ' / ' + full['data_cca_total'];
            }
        },
        {
            "targets": [10],
            render: function (data, type, full) {
                return data + ' / ' + full['data_cca_total'];
            }
        },
        {
            "targets": [11],
            render: function (data, type, full) {
                return (data !== null && data !== '') ? parseFloat(data).toFixed(2) : '';
            }
        },
        {
            "targets": [12],
            render: function (data, type, full) {
                return data + ' / ' + full['data_x15_total'];
            }
        },
        {
            "targets": [13],
            render: function (data, type, full) {
                return data + ' / ' + full['data_x15_total'];
            }
        },
    ],
    eventAniOrder = [14, 'desc'],
    eventAniDataHighTable = callCaseAlertDataTable('event_log_count_ani_table', 'liveMessage/tableListWithEventANICount', eventAniFilters, eventAniColumns, loadAniMoreData, eventAniColumnDefs, eventAniOrder);

function ReloadEventLogANITable() {
    eventAniFilters.searchList[0]['value'] = urlRegionId;
    eventAniFilters.searchList[1]['value'] = duration;
    eventAniFilters.searchList[2]['value'] = $('#fx_ani').val() ? $('#fx_ani').val() : "";
    eventAniFilters.searchList[3]['value'] = $('#fx_alert_box').val() ? $('#fx_alert_box').val() : "";
    filterAni = $('#fx_ani').val() !== '' ? 'check' : '';
    $('#regionName').html(urlRegionCode);
    $('#event_log_count_ani_table').DataTable().ajax.reload();
    window.history.pushState(null, null, `?regionId=${urlRegionId}&regionCode=${urlRegionCode}&ani=${urlAni}&duration=${durationSelectionDay}&filterAni=${filterAni}`);
}

function loadAniMoreData(settings) {
    let timezone = settings.json !== null ? settings.json.timezone : 'America/Los_Angeles';
    let dateTime = settings.json ? settings.json.eventLogDate : new Date();
    let createdAt = convertUTCToTimezone(dateTime, null, timezone);
    $('#regionTime').html(createdAt);
}

$(document).on('change', '#event_ani_region_box', function (event) {
    let id = $(this).val();
    if (event.target.selectedIndex >= 0 && urlRegionId) {
        let regionCode = event.target.options[event.target.selectedIndex].dataset.code;
        urlRegionId = id;
        urlRegionCode = regionCode;
        if (id) {
            localStorage.setItem("region_id", id);
            localStorage.setItem("region_code", regionCode);
        } else {
            localStorage.setItem("region_id", '');
            localStorage.setItem("region_code", '');
        }
        ReloadEventLogANITable();
    }
});

function GetEventRegionList() {
    sendCaseCloudHTTPRequest('liveMessage/event/region', "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let region_box_html = '<option value="" >All</option>';
            $.each(ResponseData, function (index, value) {
                region_box_html += '<option  data-code="' + value.region_code + '" data-name="' + value.region_name + '" value="' + value.id + '" >' + value.region_name + '</option>';
            });
            $("#event_ani_region_box").html(region_box_html);
            $("#event_ani_region_box").val(urlRegionId);
        }
    });
}

function viewCaseAlert(regionCode, region_id) {
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
    localStorage.setItem("region_id", region_id);
    localStorage.setItem("region_code", regionCode);
    urlRegionCode = regionCode;
    urlRegionId = region_id;
    $("#event_ani_region_box").val(region_id);
    window.history.pushState(null, null, `?regionId=${region_id}&regionCode=${regionCode}&ani=${urlAni}&duration=${durationSelectionDay}&filterAni=${filterAni}`);
    ReloadEventLogANITable();
}

if (urlRegionCode !== null && urlRegionId !== null) {
    localStorage.setItem("region_id", urlRegionId);
    localStorage.setItem("region_code", urlRegionCode);
    viewCaseAlert(urlRegionCode, urlRegionId);
}

$("#search-event-ani-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadEventLogANITable();
});

function checkModulePermission() {
    let user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
    GetRegionList();
}

$('.cancelBtn, .backBtn').click(function (e) {
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
    window.history.pushState(null, null, window.location.pathname);
    ReloadCallBoxHighStatusTable();
    $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
});

function getDuration(data) {
    durationSelectionDay = data;
    if (data === 'one_day') {
        duration = '1 day';
    } else if (data === 'three_day') {
        duration = '3 day';
    } else if (data === 'one_month') {
        duration = '1 month';
    } else if (data === 'one_week') {
        duration = '7 Day';
    } else if (data === 'three_month') {
        duration = '3 month';
    } else if (data === 'one_year') {
        duration = '12 month';
    } else {
        duration = '1 month';
        durationSelectionDay = 'one_month';
    }

    $('.duration').removeClass('active');
    $('.' + durationSelectionDay).addClass('active');
}
