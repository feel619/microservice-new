const urlParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let urlRegionId = '', urlAni = '', urlDuration = '', CMECodeList = [], backUrl = '', filterAni = '',
    selected_log_id = '';

if (urlParams.regionId != null) {
    urlRegionId = urlParams.regionId;
    localStorage.setItem("region_id", urlRegionId);
} else if (localStorage.getItem("region_id")) {
    urlRegionId = localStorage.getItem("region_id");
} else {
    urlRegionId = $("select#admin_region_box>option:eq(0)").val();
}
$("#admin_region_box").val(urlRegionId);

if (urlParams.ani !== null) {
    urlAni = urlParams.ani;
    $('#fx_ani').val(urlAni);
}

if (urlParams.duration !== null) {
    urlDuration = urlParams.duration;
    $('#fx_duration').val(urlDuration);
}

if (urlParams.backUrl !== null) {
    backUrl = urlParams.backUrl;
}

if (urlParams.filterAni) {
    filterAni = urlParams.filterAni;
}

let filters = {
        searchList: [
            {"field": "region_id", "operator": "is", "value": urlRegionId},
            {"field": "ani_number", "operator": "is", "value": urlAni},
            {"field": "status", "operator": "is", "value": ""},
            {"field": "x15_cca", "operator": "is", "value": ""},
            {
                "field": "sub_status",
                "operator": "is",
                "value": ["'NOT_REGISTERED'", "'ESTABLISH_FAIL'", "'TIMEOUT'", "'9999'"]
            },
            {"field": "alert_type", "operator": "is", "value": "both"},
            {"field": "duration", "operator": "is", "value": urlDuration},
        ]
    },
    columns = [
        {data: 'ani_number', orderable: false, "width": "4%"},
        {data: 'index', orderable: false, "width": "3%"},
        {data: 'status_code', orderable: false, "width": "3%"},
        {data: 'start_time', orderable: false, "width": "10%"},
        {data: 'end_time', orderable: false, "width": "10%"},
        {data: 'IP', orderable: false, "width": "5%"},
        {data: 'sub_status_code', orderable: false, "width": "10%"},
        {data: 'id', orderable: false, "width": "15%"},
        {data: 'description', orderable: false, "width": "35%"}
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (ani_number, type, full) {
                if (ani_number != null) {
                    let ani_html = '<span style="cursor: pointer;color: #0b7ec4;" onclick="openMessageLogsModal(\'' + full.logs_id + '\')">';
                    ani_html += full.manually_set_start_time ? ani_number + '<i class="ml-1 fa fa-info-circle text-info" title="Call start time is estimated, and not actual"></i>' : ani_number;
                    ani_html += '</span>';
                    return ani_html;
                } else {
                    return '';
                }
            }
        }, // Ani number
        {
            "targets": [1],
            render: function (index, type, full) {
                return index != null ? index : '';
            }
        }, // Index
        {
            "targets": [2],
            render: function (status_code, type, full) {
                if (full['type'] === 'event_log') {
                    return status_code != null ? status_code : '';
                } else {
                    if (full['cf_status'] === '1') {
                        if (full['type'] === 'primary' || full['type'] === 'secondary') {
                            return '9999';
                        } else {
                            return status_code;
                        }
                    } else {
                        return '';
                    }
                }
            }
        }, // Call box status
        {
            "targets": [3],
            render: function (data, type, full) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles',
                    dateTime = full['start_time'];
                return dateTime != null ? convertUTCToTimezone(dateTime, null, timezone) : '';
            }
        }, // Start time
        {
            "targets": [4],
            render: function (data, type, full) {
                if (full['type'] === 'event_log') {
                    let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles',
                        dateTime = full['end_time'];
                    return dateTime != null ? convertUTCToTimezone(dateTime, null, timezone) : '';
                } else {
                    return '';
                }
            }
        }, // End time
        {
            "targets": [5],
            render: function (ip, type, full) {
                if (ip != null) {
                    if (full['status_code'] === 'VOICE') {
                        return ip;
                    } else if (full['status_code'] === 'TTY') {
                        if (ip.includes('52.42.223.34')) {
                            return 'IP-TTY-KBC-TEST';
                        } else if (ip.includes('35.155.190.209')) {
                            return 'IP-TTY-KBCT-STG';
                        } else if (ip.includes('44.235.232.32')) {
                            return 'IP-TTY-KBCT-PROD';
                        } else if (ip.includes('131.226.248.168')) {
                            return 'IP-TTY-X15';
                        } else {
                            return ip;
                        }
                    } else {
                        return ip.includes('131.226.248.168') ? 'X15' : 'KBC'
                    }
                } else {
                    return '';
                }
            }
        }, // IP
        {
            "targets": [6],
            render: function (sub_status_code, type, full) {
                if (full['type'] === 'event_log') {
                    return full['status_name'] != null ? full['status_name'] : '';
                } else {
                    let status_name = full['status_name'],
                        tooltip = full['tooltip'] != null ? status_name + ' - ' + full['tooltip'] : '',
                        status_html = '',
                        extra_color = full['ftc_clear_on'] === 'actual_ftc' ? 'callBoxStatusListRed' : 'callBoxStatusListGray',
                        actual_color = 'callBoxStatusList' + full['color'];

                    if (sub_status_code === '9999') {
                        status_name = full['status_name'] + ' (FTC)'
                    }
                    if (sub_status_code === '0002') {
                        status_name = messageTTYAlarm[full['tty_status_code']]
                    }

                    if (full['type'] === 'primary') {
                        tooltip = 'Primary FTC - ' + ftcToolTip['primary'];
                        status_html = '<div title="' + tooltip + '" class="' + extra_color + '">Primary FTC</div>';
                    } else if (full['type'] === 'secondary') {
                        tooltip = 'Secondary FTC - ' + ftcToolTip['secondary'];
                        status_html = '<div title="' + tooltip + '" class="' + extra_color + '">Secondary FTC</div>';
                    } else if (full['type'] === 'clear') {
                        if (full['ftc_clear_on'] != null) {
                            if (full['ftc_clear_on'] === 'actual_ftc') {
                                status_html = '<div title="' + tooltip + '" class="' + extra_color + '">Report generation FTC</div>';
                            } else {
                                let sub_status = full['ftc_clear_on'] === 'secondary' ? 'Secondary Report - Clear' : 'Clear FTC';
                                status_html = '<div class="d-block ' + extra_color + '">' + sub_status + '</div>';
                                full['sub_status'].forEach(function (value, key) {
                                    if (value['type'] !== 'event_log') {
                                        status_html += '<div title="' + value['status_name'] + ' - ' + value['tooltip'] + '" class="callBoxStatusList' + value['color'] + '">' + value['status_name'] + '</div>';
                                    }
                                });
                            }
                        } else {
                            status_html = '<div title="' + tooltip + '" class="d-block ' + actual_color + '">' + status_name + '</div>';
                        }
                    } else {
                        status_html = '<div title="' + tooltip + '" class="d-block ' + actual_color + '">' + status_name + '</div>';
                    }
                    return full.cf_status === '1' ? status_html : 'Inactive';
                }
            }
        }, // Sub status with color and tooltip
        {
            "targets": [7],
            render: function (alarm_started_at, type, full) {
                if (full['type'] === 'event_log') {
                    return full['indication'] != null ? CMECode(full['indication']) : '';
                } else {
                    let htmlIndication = '';
                    if (full.status_code === '9999' && full['cf_status'] === '1' && full.indication != null) {
                        let conditionRSSI = ((full.indication.rssi_level === 'callBoxStatusListYellow' || full.indication.rssi_level === 'callBoxStatusListRed') ? 'Low' : '');
                        let conditionECIO = ((full.indication.ecio_level === 'callBoxStatusListYellow' || full.indication.ecio_level === 'callBoxStatusListRed') ? 'Low' : '');
                        htmlIndication += '<div  class="d-block" >Tech "' + (full.indication.call_box_network !== null ? full.indication.call_box_network : "") + '",APN="' + (full.indication.apn !== null ? full.indication.apn : "") + '", FW Rel "' + (full.indication.filename !== null ? full.indication.filename : "") + '"</div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.battery_alarm === 1 ? "Low Battery" : "") + '</div>';
                        if (full.indication.rssi !== null) htmlIndication += '<div  class="d-block" ><span  class="' + full.indication.rssi_level + '" >' + (full.indication.rssi !== '' ? conditionRSSI + " RSSI " + full.indication.rssi : "") + '</span>,';
                        if (full.indication.ecio !== null) htmlIndication += '<span class="' + full.indication.ecio_level + ' ml-1" >' + (full.indication.ecio !== '' ? conditionECIO + " EC/IO " + full.indication.ecio : "") + '</span></div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.tilt_alarm === 1 ? "Pole Tilt" : "") + '</div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.inner_door_alarm === 1 ? "Technician Visit" : "") + '</div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.programming_alarm === 1 ? "Programming Call" : "") + '</div>';
                        return htmlIndication;
                    } else {
                        return htmlIndication;
                    }
                }
            }
        }, // indication
        {
            "targets": [8],
            render: function (description, type, full) {
                let isTestCallBox = (full['is_test']) ? '<b>TEST CALL BOX — Alert not included in overall Knightscope Alerts statistics</b>' : '';
                if (full['cf_status'] === '1') {
                    let call_box = '';
                    description = description != null ? description : '';
                    call_box += '<div class="text-cvs-wrap">';
                    call_box += '<div class="">' + isTestCallBox + ' ' + description + '</div>';
                    call_box += '</div>';
                    return call_box;
                } else {
                    return isTestCallBox + ' ' + description;
                }
            }
        } // Description
    ],
    order = [],
    dataHighTable = callCaseAlertDataTable('call_box_high_status_table', 'liveMessage/tableListWithEventLog', filters, columns, loadMoreData, columnDefs, order);

getAlertList();

getCMECodeList();

$('#fx_status').multiselect({nonSelectedText: 'All'});

function ReloadCallBoxHighStatusTable() {
    let type = [];
    let regionCode = $("#admin_region_box").find('option:selected').attr("data-code");
    let regionId = $("#admin_region_box").find('option:selected').val();
    filters.searchList[0]['value'] = regionId ? regionId : '';
    filters.searchList[1]['value'] = $('#fx_ani').val() ? $('#fx_ani').val() : "";
    filters.searchList[2]['value'] = $('#fx_status').val() ? $('#fx_status').val() : "";
    filters.searchList[3]['value'] = $('#fx_ip').val() ? $('#fx_ip').val() : "";
    filters.searchList[4]['value'] = $('#fx_alert_box').val() ? $('#fx_alert_box').val() : "";
    filters.searchList[6]['value'] = $('#fx_duration').val() ? $('#fx_duration').val() : "";

    $("#fx_alert_box option:selected").each(function () {
        var $this = $(this);
        if ($this.length) {
            type.push($this.attr('type'));
        }
    });

    if (type.includes('extra') && type.includes('alert')) {
        filters.searchList[5]['value'] = 'both';
    } else if (type.includes('extra')) {
        filters.searchList[5]['value'] = 'extra';
    } else if (type.includes('alert')) {
        filters.searchList[5]['value'] = 'alert';
    }

    $('#call_box_high_status_table').DataTable().ajax.reload();

    urlRegionId = regionId;
    urlRegionCode = regionCode;
    urlAni = filters.searchList[1]['value'];
    urlDuration = filters.searchList[6]['value'];

    if (backUrl !== '') {
        window.history.pushState(null, null, `?backUrl=callCount&regionId=${urlRegionId}&regionCode=${urlRegionCode}&ani=${urlAni}&duration=${urlDuration}&filterAni=${filterAni}`);
    }
}

function loadMoreData() {
    $('#btn-example-load-more').toggle(this.api().page.hasMore());
}

$('#btn-example-load-more').on('click', function () {
    $('#call_box_high_status_table').DataTable().page.loadMore();
});

$(document).on('change', '#admin_region_box', function (event) {
    let id = $(this).val();
    let regionCode = event.target.options[event.target.selectedIndex].dataset.code;
    if (id) {
        localStorage.setItem("region_id", id);
        localStorage.setItem("region_code", regionCode);
    } else {
        localStorage.setItem("region_id", '');
        localStorage.setItem("region_code", '');
    }
    ReloadCallBoxHighStatusTable();
});

$(document).on('change', '#fx_status, #fx_ip, #fx_alert_box, #fx_duration', function (event) {
    ReloadCallBoxHighStatusTable();
});

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadCallBoxHighStatusTable();
});

$('.resetFn').click(function () {
    $('#fx_ani').val('');
    $('#fx_alert_box').val('');
    $("#fx_status").multiselect("clearSelection");
    $('#fx_status').val('');
    ReloadCallBoxHighStatusTable();
});

$('.backBtn').click(function (e) {
    if (backUrl !== '') {
        window.location = `${_config.domain}callCount.html?regionCode=${urlRegionCode}&regionId=${urlRegionId}&duration=${urlDuration}&ani=${urlAni}&filterAni=${filterAni}`;
    } else {
        history.back();
    }
});


const openMessageLogsModal = (logs_id) => {
    selected_log_id = logs_id;
    logsTables.filtersMessageLogs.searchList[0]['value'] = selected_log_id ? selected_log_id : '';
    $('#messageLogsModal').modal('show');
    //$('#messageLogsModal').modal('hide');
    logsTables.messageLogsTable();
};
$('#messageLogsModal').on('hidden.bs.modal', function (e) {
    $('#call_box_log_table').dataTable().fnDestroy();
});

const logsTables = {
    filtersMessageLogs: {
        searchList: [
            {
                "field": "id", "operator": "is", "value": selected_log_id ? selected_log_id : ''
            }
        ]
    },
    columnsMessageLogs: [
        {data: 'time', orderable: false,},
        {data: 'remote_address', orderable: false, "className": 'ip-control-hover'},
        {data: 'remote_port', orderable: false,},
        {data: 'logs', orderable: false,},
    ],
    columnDefsMessageLogs: [
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
                let messagesHtml = '';
                messagesHtml += '<div class="">' + getFormattedMessages(full.type, data) + '</div>';
                return messagesHtml;
            }
        },
    ],
    orderMessageLogs: [],
    messageLogsTable: function () {
        callCaseAlertDataTable('call_box_log_table', 'liveMessage/tableListMessageLogByLogId', logsTables.filtersMessageLogs, logsTables.columnsMessageLogs, loadLogMoreData, logsTables.columnDefsMessageLogs, logsTables.orderMessageLogs, function (row, data, dataIndex) {
            if (data.id === selected_log_id) {
                //$(row).css("background-color", '#bbbb00');
                $(row).css("color", '#bbbb00');
                console.log(data," RA ",row)
                $('#messageLogRegionName').html(data.region_code);
                $('#messageLogAni').html(data.ani_number);
            }
            let remote_address = data.remote_address ? data.remote_address.replaceAll(".", "-") : '',
                remote_port = data.remote_port ? data.remote_port : '',
                className = 'ip-control-' + remote_address + '-' + remote_port;
            $(row).addClass(className + ' ip-reset-row');
            $(row).attr('remote_address', remote_address);
            $(row).attr('remote_port', remote_port);
        });
    },
    getFormattedMessages: function (type, message) {
        if (type === 'IN') {
            return '<i class="fa fa-long-arrow-down text-red font-weight-bold"></i> ' + message;
        } else if (type === 'OUT') {
            return '<i class="fa fa-long-arrow-up text-green font-weight-bold"></i> ' + message;
        } else {
            return message;
        }
    },
    reloadMessageLogsTable: function () {
        logsTables.filtersMessageLogs.searchList[0]['value'] = selected_log_id ? selected_log_id : '';
        //filtersMessageLogs.searchList[1]['value'] = selected_call_box_id ? selected_call_box_id : '';
        $('#call_box_log_table').DataTable().ajax.reload(null, false);
    }

};

function getFormattedMessages(type, message) {
    if (type === 'IN') {
        return '<i class="fa fa-long-arrow-down text-red font-weight-bold"></i> ' + message;
    } else if (type === 'OUT') {
        return '<i class="fa fa-long-arrow-up text-green font-weight-bold"></i> ' + message;
    } else {
        return message;
    }
}

function loadLogMoreData(settings) {
    $('#btn-message-log-load-more').toggle(this.api().page.hasMore());
}

$('#btn-message-log-load-more   ').on('click', function () {
    $('#call_box_log_table').DataTable().page.loadMore();
});
$(document).on('click', '#call_box_log_table tbody td.ip-control-hover', function (event) {
    let tr = $(this).closest('tr');
    $('.ip-reset-row').css('background-color', '');
    let className = '.ip-control-' + $(tr).attr('remote_address') + '-' + $(tr).attr('remote_port');
    $(className).css('background-color', '#b6ffb880');
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

const exportCSV = () => {
    const table = $('#call_box_high_status_table').DataTable();
    const reqData = JSON.parse(table.ajax.params());

    sendCaseCloudHTTPRequest("liveMessage/export", "POST", reqData, function (result) {
        if (result) {
            let resultData = result.data;
            let csvContent = 'ANI, Region, Status code, Time, Alert, Indication, Duration, CallInTime, Location\r\n';
            let exportData = [];
            resultData.forEach(function (rowArray) {

                let callBoxArray = rowArray;

                // Time
                callBoxArray['time'] = '';
                let timezone = rowArray['timezone'] !== null ? rowArray['timezone'] : 'America/Los_Angeles',
                    dateTime = '';
                if (rowArray['cf_status'] === '1') {
                    if (rowArray['type'] === 'primary') {
                        dateTime = rowArray['primary_ftc_time'] != null ? rowArray['primary_ftc_time'] : rowArray['message_updated_at'];
                    } else if (rowArray['type'] === 'secondary') {
                        dateTime = rowArray['secondary_ftc_time'] != null ? rowArray['secondary_ftc_time'] : rowArray['message_updated_at'];
                    } else {
                        dateTime = rowArray['message_time'] != null ? rowArray['message_time'] : rowArray['message_updated_at'];
                    }
                } else {
                    dateTime = rowArray['call_box_updated_at'] != null ? rowArray['call_box_updated_at'] : rowArray['call_box_created_at'];
                }
                callBoxArray['time'] = convertUTCToTimezone(dateTime, null, timezone);

                // Region
                callBoxArray['region'] = rowArray['region_code'] ? rowArray['region_code'] : '';

                // ANI
                callBoxArray['ani'] = rowArray['ani_number'];

                // Status code
                if (rowArray['cf_status'] === '1') {
                    if (rowArray['type'] === 'primary' || rowArray['type'] === 'secondary') {
                        callBoxArray['status_code'] = '9999';
                    } else {
                        callBoxArray['status_code'] = rowArray['status_code'];
                    }
                } else {
                    callBoxArray['status_code'] = '';
                }

                // Alert
                let status_name = rowArray['status_name'], status_html = '';

                if (rowArray['sub_status_code'] === '9999') {
                    status_name = rowArray['status_name'] + ' (FTC)'
                }
                if (rowArray['sub_status_code'] === '0002') {
                    status_name = messageTTYAlarm[rowArray['tty_status_code']]
                }

                if (rowArray['type'] === 'primary') {
                    status_html = 'Primary FTC';
                } else if (rowArray['type'] === 'secondary') {
                    status_html = 'Secondary FTC';
                } else if (rowArray['type'] === 'clear') {
                    if (rowArray['ftc_clear_on'] != null) {
                        if (rowArray['ftc_clear_on'] === 'actual_ftc') {
                            status_html = 'Report generation FTC';
                        } else {
                            let sub_status = rowArray['ftc_clear_on'] === 'secondary' ? 'Secondary Report - Clear' : 'Clear FTC';
                            status_html = sub_status + '\r\n';
                            rowArray['sub_status'].forEach(function (value, key) {
                                status_html += value['status_name'] + '\r\n';
                            });
                        }
                    }
                } else {
                    status_html = status_name;
                }
                callBoxArray['alert'] = rowArray['cf_status'] === '1' ? status_html : 'Inactive';

                // Indication
                let htmlIndication = '';
                if (rowArray['sub_status_code'] === '9999' && rowArray['cf_status'] === '1') {
                    let conditionRSSI = ((rowArray.indication.rssi_level === 'callBoxStatusListYellow' || rowArray.indication.rssi_level === 'callBoxStatusListRed') ? 'Low' : '');
                    let conditionECIO = ((rowArray.indication.ecio_level === 'callBoxStatusListYellow' || rowArray.indication.ecio_level === 'callBoxStatusListRed') ? 'Low' : '');
                    htmlIndication += 'Tech=' + (rowArray['indication'].rat !== null ? rowArray['indication'].rat : 'null') + ' APN=' + (rowArray['indication'].apn !== null ? rowArray['indication'].apn : 'null') + ' FW Rel=' + (rowArray['indication'].filename !== null ? rowArray['indication'].filename : 'null') + ' ';
                    htmlIndication += (rowArray['indication']['battery_alarm'] === 1 ? "Low Battery" : "") + ' ';
                    if (rowArray.indication.rssi !== null) htmlIndication += (rowArray.indication.rssi !== '' ? conditionRSSI + " RSSI " + rowArray.indication.rssi : "") + ', ';
                    if (rowArray.indication.ecio !== null) htmlIndication += (rowArray.indication.ecio !== '' ? conditionECIO + " EC/IO " + rowArray.indication.ecio : "");
                    htmlIndication += (rowArray['indication']['tilt_alarm'] === 1 ? "Pole Tilt" : "") + ' ';
                    htmlIndication += (rowArray['indication']['inner_door_alarm'] === 1 ? "Technician Visit" : "") + ' ';
                    htmlIndication += (rowArray['indication']['programming_alarm'] === 1 ? "Programming Call" : "") + ' ';
                    callBoxArray['indication'] = htmlIndication;
                } else {
                    callBoxArray['indication'] = htmlIndication;
                }

                // Duration
                let current_date = moment(new Date()), duration_html = '';
                if (rowArray['cf_status'] === '1') {
                    if (rowArray['type'] === 'primary') {
                        duration_html = getDuration(current_date, moment(rowArray['primary_ftc_time']));
                    } else if (rowArray['type'] === 'secondary') {
                        duration_html = getDuration(current_date, moment(rowArray['secondary_ftc_time']));
                    } else if (rowArray['type'] === 'clear') {
                        rowArray['sub_status'].forEach(function (value, key) {
                            if (rowArray['alarm_started_at'] != null) {
                                duration_html += getDuration(current_date, moment(rowArray['alarm_started_at'])) + '\r\n';
                            } else {
                                duration_html += '\r\n';
                            }
                        });
                    } else {
                        if (rowArray['alarm_started_at'] != null) {
                            duration_html = getDuration(current_date, moment(rowArray['alarm_started_at']));
                        }
                    }
                }
                callBoxArray['duration'] = duration_html;

                // Call in time
                if (rowArray['call_in_time'] != null) {
                    if (rowArray['timezone'] != null) {
                        let time = moment(moment().format('YYYY-MM-DD') + ' ' + rowArray['call_in_time']).format('YYYY-MM-DD HH:mm:ss');
                        callBoxArray['call_in_time'] = moment.utc(time, null).tz(rowArray['timezone']).format('hh:mm:ss A z');
                    } else {
                        callBoxArray['call_in_time'] = rowArray['call_in_time'];
                    }
                } else {
                    callBoxArray['call_in_time'] = '';
                }

                // Location
                callBoxArray['location'] = rowArray && true ? rowArray['description'] : '';
                let csvJson = _.pick(callBoxArray, 'ani', 'region', 'status_code', 'time', 'alert', 'indication', 'duration', 'call_in_time', 'location');

                let csvData = _.values(csvJson);
                let csvResponse = csvData.map(string => string === null ? '' : `\"${string}\"`);

                exportData.push(csvResponse);
            });
            let row = exportData.join("\n");
            csvContent += row + "\r\n";
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement('a');

            let current_date = moment(new Date()).format('DD-MM-YYYY-HH-mm-ss');
            let timestamp = new Date().getTime();
            let fileName = 'X15-Live-Message-' + current_date + '.csv';
            let Name = 'X15-Live-Message-' + timestamp;
            link.id = Name;
            link.target = '_blank';
            link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            document.querySelector('#' + Name).click();
        }
    });
};

function getAlertList() {
    sendCaseCloudHTTPRequest('aniMeta/list', "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let alert_box = '';

            alert_box += '<optgroup label="Call failure">';
            alert_box += `<option type="extra" selected value="'NOT_REGISTERED'">NOT_REGISTERED</option>`;
            alert_box += `<option type="extra" selected value="'ESTABLISH_FAIL'">ESTABLISH_FAIL</option>`;
            alert_box += `<option type="extra" selected value="'TIMEOUT'">TIMEOUT</option>`;
            alert_box += '</optgroup>';

            alert_box += '<optgroup label="Call success">';
            alert_box += `<option type="extra" value="'REMOTE_HANGUP'">REMOTE_HANGUP</option>`;
            alert_box += '</optgroup>';

            alert_box += '<optgroup label="Alert">';
            $.each(ResponseData, function (index, value) {
                const is_selected = value.name === '9999' ? 'selected' : '';
                if (value.name !== '9998') alert_box += `<option type="alert" ` + is_selected + ` value="'` + value.name + `'">` + value.meta_type + `</option>`;
            });
            alert_box += '</optgroup>';

            $('#fx_alert_box').html(alert_box).multiselect();
        }
    });
}

function getCMECodeList() {
    sendCaseCloudHTTPRequest('liveMessage/CMECodeList', "GET", "", function (result) {
        CMECodeList = result;
    });
}

/**
 * @return {string}
 */
function CMECode(data) {
    let result = '';
    if (data.includes('ERR#:')) {
        let temp = (data.replace('ERR#:', '')).trimStart().split(' ');
        $.each(temp, function (index, value) {
            let obj = CMECodeList.find(o => Number(o.code) === Number(value));
            if (obj) {
                result += `<span class="d-block">#${value}: ${obj['description']}</span>`;
            }
        });
        return result;
    } else {
        return data;
    }
}
