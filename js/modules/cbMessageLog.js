var defaultTimeZone = "America/Los_Angeles";
moment.tz.setDefault(defaultTimeZone);
var startDate = moment().format('YYYY-MM-DD h:mm A');
$('#fx_created_at').daterangepicker({
    autoUpdateInput: false,
    drops: 'auto',
    timePicker: true,
    timePicker24Hour: true,
    locale: {
        cancelLabel: 'Clear',
        format: 'YYYY-MM-DD hh:mm A'
    },
    startDate: startDate,
    //minDate: currentTime,
    maxDate: new Date()
});
$('#fx_created_at').on('apply.daterangepicker', function (ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD hh:mm A') + ' - ' + picker.endDate.format('YYYY-MM-DD hh:mm A'));
    ReloadCallBoxStatusTable();
});
$('#fx_created_at').on('cancel.daterangepicker', function (ev, picker) {
    $(this).val('');
    ReloadCallBoxStatusTable();
});
let filters = {
        searchList: [
            {"field": "region_code", "operator": "is", "value": ""},
            {"field": "ani_number", "operator": "is", "value": ""},
            {"field": "logs", "operator": "contains", "value": ""},
            {"field": "is_unexpected", "operator": "is", "value": $('#unexpected_switch').is(":checked") ? '1' : '0'},
            {"field": "time", "operator": "date_range", "from_value": "", "to_value": ""}
        ]
    },
    columns = [
        {data: 'time', orderable: false,},
        {data: 'remote_address', orderable: false, "className": 'ip-control-hover'},
        {data: 'remote_port', orderable: false,},
        {data: 'region_ani', orderable: false,},
        {data: 'logs', orderable: false,},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                let dateTime = full.time;
                return convertUTCToTimezone(dateTime, null, 'America/Los_Angeles');
            }
        },
        {
            "targets": [3],
            render: function (data, type, full, meta) {
                let messages = full.TM;
                let messagesHtml = '';
                if (messages !== null) {
                    messagesHtml += '<div>' + messages.region + '-' + messages.ani + '</div>';
                } else if (full.region_code !== '' && full.ani_number !== '') {
                    messagesHtml += '<div>' + full.region_code + '-' + full.ani_number + '</div>';
                } else {
                    messagesHtml += '<div class=""></div>';
                }
                return messagesHtml;
            }
        },
        {
            "targets": [4],
            render: function (data, type, full, meta) {
                let messages = full.TM;
                let messagesHtml = '';
                if (messages !== null) {
                    messagesHtml += '<div style="cursor: pointer;" class="dt-control" id="' + messages.id + '">' + getFormattedMessages(full.type, data) + '</div>';
                } else {
                    messagesHtml += '<div class="">' + getFormattedMessages(full.type, data) + '</div>';
                }
                return messagesHtml;
            }
        },
    ],
    order = [],
    dataTable = callCaseCloudLogDataTable('call_box_log_table', 'messageLogs/listing', filters, columns, '', function (row, data) {
        let remote_address = data.remote_address ? data.remote_address.replaceAll(".", "-") : '',
            remote_port = data.remote_port ? data.remote_port : '',
            className = 'ip-control-' + remote_address + '-' + remote_port;
        $(row).addClass(className + ' ip-reset-row');
        $(row).attr('remote_address', remote_address);
        $(row).attr('remote_port', remote_port);
    }, columnDefs, order);

function getFormattedMessages(type, message) {
    if (type === 'IN') {
        return '<i class="fa fa-long-arrow-down text-red font-weight-bold"></i> ' + message;
    } else if (type === 'OUT') {
        return '<i class="fa fa-long-arrow-up text-green font-weight-bold"></i> ' + message;
    } else {
        return message;
    }
}

function ReloadCallBoxStatusTable() {
    let region = $("#fx_region_id").find('option:selected').attr("data-code"),
        ani = $("#fx_call_box_id").find('option:selected').attr("data-ani"),
        createdAt = $('#fx_created_at').val().split(' - '),
        start = createdAt[0] ? moment.tz(createdAt[0], "YYYY-MM-DD h:mm:ss A", 'America/Los_Angeles').utc().format("YYYY-MM-DD h:mm:ss A") : "",
        end = createdAt[1] ? moment.tz(createdAt[1], "YYYY-MM-DD h:mm:ss A", 'America/Los_Angeles').utc().format("YYYY-MM-DD h:mm:ss A") : "",
        search = $('#fx_search').val();

    filters.searchList[0]['value'] = region ? region : '';
    filters.searchList[1]['value'] = ani ? ani : '';
    filters.searchList[2]['value'] = search;
    filters.searchList[3]['value'] = $('#unexpected_switch').is(":checked") ? '1' : '0';
    filters.searchList[4]['from_value'] = start;
    filters.searchList[4]['to_value'] = end;

    $('#call_box_log_table').DataTable().ajax.reload();
}

$('#call_box_log_table tbody').on('click', 'td.ip-control-hover', function () {
    let tr = $(this).closest('tr');
    $('.ip-reset-row').css('background-color', '');
    let className = '.ip-control-' + $(tr).attr('remote_address') + '-' + $(tr).attr('remote_port');
    $(className).css('background-color', '#b6ffb880');
});

function sendLiveLogMessage(data) {
    if ($("input[name='status_switch']:checked").val() === '1') {
        console.log("updateLiveLogMessageResponseData", data, filters.searchList);
        data.forEach(function (response) {
            let remote_address = response.remote_address ? response.remote_address.replaceAll(".", "-") : '',
                remote_port = response.remote_port ? response.remote_port : '',
                className = 'ip-control-' + remote_address + '-' + remote_port + ' ip-reset-row',
                region = (response.TM != null ? response.TM.region + '-' + response.TM.ani : ''),
                clickClass = response['TM'] != null ? 'dt-control-new' : '',
                html = '<tr role="row" class="' + className + '" remote_address="' + remote_address + '" remote_port="' + remote_port + '">' +
                    '<td class="sorting_1">' + convertUTCToTimezone(response.time, null, defaultTimeZone) + '</td>' +
                    '<td class=" ip-control-hover">' + response.remote_address + '</td>' +
                    '<td>' + response.remote_port + '</td>' +
                    '<td>' + region + '</td>' +
                    '<td><div class="' + clickClass + '">' + getFormattedMessages(response.type, response.logs) + '</div></td>' +
                    '</tr>';

            if (response['sub_type'] === 'rpi') {
                html += '<tr style="display: none"><td colspan="5">' + format(response) + '</td></tr>';
            }

            $('#call_box_log_table').prepend(html);
        });

        $('#call_box_log_table tbody').on('click', 'div.dt-control-new', function () {
            $(this).closest('tr').next().toggle();
        });
    }
    /*if (filters.searchList[0]['value'] === '' && filters.searchList[1]['value'] === '' &&
        filters.searchList[2]['value'] === '' && filters.searchList[3]['value'] === '' &&
        filters.searchList[4]['from_value'] === '' && filters.searchList[4]['to_value'] === '') {
    }*/
}

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadCallBoxStatusTable();
});

$('.resetFn').click(function () {
    let play_pause = $("input[name='status_switch']:checked").val();
    $("#fx_region_id").val('').trigger("change");
    $("#fx_call_box_id").val('').trigger("change");
    $('#search-call-box-status-value')[0].reset();
    $('#unexpected_switch').attr('checked', false);
    $(".status_switch").val([play_pause]);
    ReloadCallBoxStatusTable();
});

function checkModulePermission() {
    let user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
    getRegionList();
    getCallBoxList();
}

const exportCSV = () => {
    let table = $('#call_box_log_table').DataTable();
    let order = table.order();
    const reqData = {
        "searchList": filters.searchList,
        "order": [
            {
                "column": order[0][0] ? order[0][0] : order[0],
                "dir": order[0][1] ? order[0][1] : order[1]
            }
        ],
    };
    sendCaseCloudHTTPRequest("messageLogs/export", "POST", reqData, function (result) {
        if (result) {
            let resultData = result.data;
            let csvContent = '"time","logs"\r\n';
            let exportData = [];
            resultData.forEach(function (rowArray) {
                let csvJson = _.omit(rowArray, ['messages']);
                let csvData = _.values(csvJson);
                let csvResponse = csvData.map(string => string === null ? '' : `\"${string}\"`);
                exportData.push(csvResponse);
                console.log(exportData);
            });
            let row = exportData.join("\n");
            csvContent += row + "\r\n";
            let encodedUri = encodeURIComponent(csvContent);
            let link = document.createElement('a');
            link.id = 'download-csv';
            link.setAttribute('href', 'data:text/csv,' + encodedUri);
            link.setAttribute('download', 'X15-Live-Messages.csv');
            document.body.appendChild(link);
            document.querySelector('#download-csv').click();
            // console.log(reqData, "filters.reqData");
            // window.open(encodedUri);
        }
    });
};

function format(messageResponse) {
    let logInfoHtml = '';
    let messageData = messageResponse.TM;
    if (messageData) {
        logInfoHtml += '<div class="row">' +
            '<div class="col-lg-4">' +
            '<table cellpadding="5" cellspacing="0" border="0" style="width: 100%;">' +
            '<tr>' +
            '<td style="width: 35%;">original message:</td>' +
            '<td style="word-break: break-all;white-space: normal;">' + messageData.original_message + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>region:</td>' +
            '<td>' + messageData.region + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.signal_dbm ? "alert-show" : "d-none") + '">' +
            '<td>signal dbm:</td>' +
            '<td>' + messageData.signal_dbm + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.rssi ? "alert-show" : "d-none") + '">' +
            '<td>rssi:</td>' +
            '<td>' + messageData.rssi + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.cb_cam ? "alert-show" : "d-none") + '">' +
            '<td>cb cam:</td>' +
            '<td>' + messageData.cb_cam + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.cb_vid ? "alert-show" : "d-none") + '">' +
            '<td>cb vid:</td>' +
            '<td>' + messageData.cb_vid + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.own_ip ? "alert-show" : "d-none") + '">' +
            '<td>own ip:</td>' +
            '<td>' + messageData.own_ip + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.temp_c ? "alert-show" : "d-none") + '">' +
            '<td>temp c:</td>' +
            '<td>' + messageData.temp_c + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.sig_qual ? "alert-show" : "d-none") + '">' +
            '<td>sig qual:</td>' +
            '<td>' + messageData.sig_qual + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.sig_pwr ? "alert-show" : "d-none") + '">' +
            '<td>sig pwr:</td>' +
            '<td>' + messageData.sig_pwr + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.time ? "alert-show" : "d-none") + '">' +
            '<td>time:</td>' +
            '<td>' + messageData.time + '</td>' +
            '</tr>' +
            '<tr >' +
            '<td>ani:</td>' +
            '<td><a href="callbox.html?ani=' + messageData.ani + '&region=' + messageData.region + '" >' + messageData.ani + '</a></td>' +
            '</tr>' +
            '<tr class="' + (messageData.battery_voltage ? "alert-show" : "d-none") + '">' +
            '<td>battery voltage:</td>' +
            '<td>' + messageData.battery_voltage + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.signal_dbm ? "alert-show" : "d-none") + '">' +
            '<td>signal dbm:</td>' +
            '<td>' + messageData.signal_dbm + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.tty_status ? "alert-show" : "d-none") + '">' +
            '<td>tty status octal:</td>' +
            '<td>' + messageData.tty_status + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.tty_status_code ? "alert-show" : "d-none") + '">' +
            '<td>tty status:</td>' +
            '<td>' + messageTTYAlarm[messageData.tty_status_code] + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.status_code ? "alert-show" : "d-none") + '">' +
            '<td>status code:</td>' +
            '<td>' + messageData.status_code + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.lat ? "alert-show" : "d-none") + '">' +
            '<td>lat:</td>' +
            '<td>' + messageData.lat + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.long ? "alert-show" : "d-none") + '">' +
            '<td>long:</td>' +
            '<td>' + messageData.long + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.phone ? "alert-show" : "d-none") + '">' +
            '<td>phone:</td>' +
            '<td>' + messageData.phone + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.tty_rev ? "alert-show" : "d-none") + '">' +
            '<td>tty rev:</td>' +
            '<td>' + messageData.tty_rev + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.mcu ? "alert-show" : "d-none") + '">' +
            '<td>mcu:</td>' +
            '<td>' + messageData.mcu + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.apn ? "alert-show" : "d-none") + '">' +
            '<td>apn:</td>' +
            '<td>' + messageData.apn + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.rat ? "alert-show" : "d-none") + '">' +
            '<td>rat:</td>' +
            '<td>' + messageData.rat + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>status:</td>' +
            '<td>';
        messageData.TMD.forEach(function (value, key) {
            let aniMetaData = value.TAMD;
            logInfoHtml += '<div class="">' + aniMetaData.meta_type + '</div>';
        });
        logInfoHtml += '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.call_count ? "alert-show" : "d-none") + '">' +
            '<td>call count:</td>' +
            '<td>' + messageData.call_count + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.call_sec ? "alert-show" : "d-none") + '">' +
            '<td>call sec:</td>' +
            '<td>' + messageData.call_sec + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.call_min ? "alert-show" : "d-none") + '">' +
            '<td>call min:</td>' +
            '<td>' + messageData.call_min + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.signal_rssi ? "alert-show" : "d-none") + '">' +
            '<td>signal rssi:</td>' +
            '<td>' + messageData.signal_rssi + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.system_configuration ? "alert-show" : "d-none") + '">' +
            '<td>system configuration:</td>' +
            '<td>' + messageData.system_configuration + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.configuration_first ? "alert-show" : "d-none") + '">' +
            '<td>configuration first:</td>' +
            '<td>' + messageData.configuration_first + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.configuration_second ? "alert-show" : "d-none") + '">' +
            '<td>configuration second:</td>' +
            '<td>' + messageData.configuration_second + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.firmware_rev ? "alert-show" : "d-none") + '">' +
            '<td>firmware rev:</td>' +
            '<td>' + messageData.firmware_rev + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.radio_handler_rev ? "alert-show" : "d-none") + '">' +
            '<td>radio handler rev:</td>' +
            '<td>' + messageData.radio_handler_rev + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.radio_type ? "alert-show" : "d-none") + '">' +
            '<td>radio type:</td>' +
            '<td>' + messageData.radio_type + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.aurora_boot_rev ? "alert-show" : "d-none") + '">' +
            '<td>aurora boot rev:</td>' +
            '<td>' + messageData.aurora_boot_rev + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.aurora_dsp_rev ? "alert-show" : "d-none") + '">' +
            '<td>aurora dsp rev:</td>' +
            '<td>' + messageData.aurora_dsp_rev + '</td>' +
            '</tr>' +
            '</table>' +
            '</div>' +
            '</div>';
    }

    return logInfoHtml;
}

$('#call_box_log_table tbody').on('click', 'div.dt-control', function () {
    let tr = $(this).closest('tr');
    let table = $('#call_box_log_table').DataTable();
    let row = table.row(tr);
    if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
    } else {
        row.child(format(row.data())).show();
        tr.addClass('shown');
    }
});

function getRegionList() {
    sendCaseCloudHTTPRequest('region/list', "GET", "", function (result) {
        if (result.data) {
            let region_box_html = '<option></option>';
            $.each(result.data, function (index, value) {
                region_box_html += '<option data-code="' + value.region_code + '" value="' + value.id + '" >' + value.region_name + '</option>';
            });
            $("#fx_region_id").html(region_box_html).select2({placeholder: "All", allowClear: true});
            let selected_region = localStorage.getItem("region_id");
            console.log(selected_region, " onChangeSelectRegion ");
            if (selected_region) {
                $("#fx_region_id").val(selected_region);
                $('#fx_region_id').trigger("change");
            }
        }
    });
}

function getCallBoxList(region_id = '') {
    if (region_id === '') {
        $("#fx_call_box_id").html('').select2({placeholder: "All", allowClear: true});
    } else {
        sendCaseCloudHTTPRequest("callBox/getCallBoxByRegion/" + region_id, 'GET', "", function (result) {
            if (result.data) {
                result.data.sort((a, b) => (a.ani_number > b.ani_number ? 1 : -1));
                let call_box_html = '<option></option>';
                $.each(result.data, function (index, value) {
                    call_box_html += '<option data-ani="' + value.ani_number + '" value="' + value.id + '" >' + value.ani_number + '</option>';
                });
                $("#fx_call_box_id").html(call_box_html).select2({placeholder: "All", allowClear: true});
            }
        });
    }
}

$(document).on('change', '#fx_region_id', function (event) {
    let id = $(this).val(),
        regionCode = $(this).find(':selected').data('code');
    localStorage.setItem("region_id", id === undefined ? '' : id);
    localStorage.setItem("region_code", regionCode === undefined ? '' : regionCode);
    getCallBoxList(id);
    ReloadCallBoxStatusTable();
});

$(document).on('change', '#fx_call_box_id', function (event) {
    ReloadCallBoxStatusTable();
});

$('#unexpected_switch').change(() => {
    ReloadCallBoxStatusTable();
});
