let selected_call_box_id = '';
let report_time = '';

let filters = {
        legend: '1',
        searchList: [
            {
                "field": "region_id", "operator": "is",
                "value":  localStorage.getItem("region_id") ?  localStorage.getItem("region_id") : ""
            },
            {"field": "ani", "operator": "is", "value": ""},
            {
                "field": "$TCAR.TLMD.TMD.TAMD.name$", "operator": "is",
                "value": ""
            },
            {
                "field": "region", "operator": "is",
                "value": localStorage.getItem("region_code") ? localStorage.getItem("region_code") : ""
            },
            {"field": "report_time", "operator": "is", "value": report_time},
        ]
    },
    columns = [
        {"className": 'dt-control', "orderable": false, "data": null, "defaultContent": '', "width": "5%",},
        {data: 'createdAt', orderable: true, "width": "10%",},
        {data: 'region', orderable: true, "width": "5%",},
        {data: 'ani', orderable: true, "width": "5%",},
        {data: 'status_code', orderable: false, "width": "5%",},
        {data: 'call_box_status', orderable: true, "width": "15%",},
        {data: 'duration', orderable: true, "width": "15%",},
        {data: 'call_box', orderable: false, "width": "35%",},
        {data: 'action', orderable: false, "width": "5%",},
    ],
    columnDefs = [
        {
            "targets": [0],
            "createdCell": function (td, cellData, rowData, row, col) {
                if (rowData.TCAR && rowData.TCAR.status_code === '9999' && rowData.cf_status === '1') {
                    $(td).removeClass('dt-control');
                }
            }
        },
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                console.log('full', full);
                if (full.TCAR && full.cf_status === '1') {
                    let dateTime = '';
                    let timezone = full.TRD ? (full.TRD.timezone !== null ? full.TRD.timezone : 'America/Los_Angeles') : 'America/Los_Angeles';
                    if (full.TCAR.status_code !== '9999') {
                        dateTime = full.TCAR.TLMD ? full.TCAR.TLMD.updatedAt : full.createdAt;
                    } else {
                        dateTime = full.TCAR.report_generated_at;
                    }
                    return convertUTCToTimezone(dateTime, null, timezone);

                } else {
                    let dateTime = full.updatedAt ? full.updatedAt : full.createdAt;
                    let timezone = full.TRD ? (full.TRD.timezone !== null ? full.TRD.timezone : 'America/Los_Angeles') : 'America/Los_Angeles';
                    return convertUTCToTimezone(dateTime, null, timezone);
                }
            }
        },
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                if (full.TCAR)
                    return full.TCAR.TLMD.region ? full.TCAR.TLMD.region : '';
                else
                    return full.TRD ? full.TRD.region_code : '';
            }
        },
        {
            "targets": [3],
            render: function (data, type, full, meta) {
                if (full.TCAR)
                    return full.TCAR.TLMD.ani;
                else
                    return full.ani_number;
            }
        },
        {
            "targets": [4],
            render: function (data, type, full, meta) {
                if (full.TCAR)
                    return full.TCAR.TLMD.status_code;
                else
                    return '';
            }
        },
        {
            "targets": [5],
            render: function (data, type, full, meta) {
                if (full.TCAR && full.cf_status === '1') {
                    let call_box = '';
                    let messages_data = full.TCAR.TLMD.TMD;
                    if (messages_data.length > 0) {
                        let legendList = [];
                        //if (full.ani_number === '1080') console.log(messages_data, "ARRAY_AGG");
                        $.each(messages_data, function (resInd, resValue) {
                            if (resValue.TAMD) {
                                let aniMetaInfo = resValue.TAMI;
                                let aniMetaData = resValue.TAMD;
                                let statusName = aniMetaData.meta_type;
                                let legend = aniMetaInfo.legend;
                                if (aniMetaData.name === '9999') {
                                    statusName = aniMetaData.meta_type + ' (FTC)'
                                }
                                if (aniMetaData.name === '0002') {
                                    statusName = messageTTYAlarm[full.TCAR.TLMD.tty_status_code]
                                }
                                legendList.push(legend);
                                console.log(legendList.indexOf('3'), "legendList.indexOf('3')");
                                let color = (aniMetaInfo.color === 'Yellow' ? 'callBoxStatusListYellow' :
                                    (aniMetaInfo.color === 'Red') ? 'callBoxStatusListRed' :
                                        (aniMetaInfo.color === 'LightBlue') ? 'callBoxStatusListLightBlue' :
                                            (aniMetaInfo.color === 'Blue') ? 'callBoxStatusListBlue' : '');
                                if (legendList.indexOf('3') < 1) call_box += '<div title="'+ statusName + ' - ' + aniMetaData.tooltip +'" class="' + color + '"  >' + statusName + '</div>';
                            }
                        });
                    }
                    call_box += '</div>';
                    return call_box;
                } else {
                    return 'Inactive';
                }
            }
        },
        {
            "targets": [6],
            render: function (data, type, full, meta) {
                if (full.TCAR && full.cf_status === '1') {
                    let call_box = '';
                    let messages_data = full.TCAR.TLMD.TMD;
                    call_box += '<div class="region_list text-cvs-wrap">';
                    if (messages_data.length > 0) {
                        let legendList = [];
                        $.each(messages_data, function (resInd, resValue) {
                            if (resValue) {
                                if (resValue.TAMD) {
                                    let aniMetaInfo = resValue.TAMI;
                                    let legend = aniMetaInfo.legend;
                                    legendList.push(legend);
                                }
                                if (resValue.alarm_started_at) {
                                    let current_date = moment(full.reportTime);
                                    let last_date = moment(resValue.alarm_started_at);
                                    let diff_duration = getDuration(current_date, last_date);
                                    if (legendList.indexOf('3') < 1 && resValue.meta_status !== '1000') call_box += '<div  class="d-block" >' + diff_duration + '</div>';
                                } else {
                                    call_box += '<div class="d-block" ></div>';
                                }
                            }
                        });
                    }
                    call_box += '</div>';
                    return call_box;
                } else {
                    return '';
                }
            }
        },
        {
            "targets": [7],
            render: function (data, type, full, meta) {
                if (full.TCAR && full.cf_status === '1') {
                    let call_box = '';
                    let description = full.description ? full.description : '';
                    call_box += '<div class="text-cvs-wrap">';
                    call_box += '<div class="">' + description + '</div>';
                    call_box += '</div>';
                    return call_box;
                } else {
                    return full.description;
                }
            }
        },
        {
            "targets": [8],
            render: function (data, type, full, meta) {
                let regionCode = full.TRD ? full.TRD.region_code : '';
                let edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="view" class="btn white-color btn-sm btn-primary" onclick="viewCaseAlert(\'' + full.ani_number + '\',\'' + regionCode + '\',\'' + full.id + '\')"><i class="fa fa-eye"></i></a>';
                edit_html += '<a data-toggle="tooltip" title="edit" class="btn ml-1 white-color btn-sm btn-primary"  href="callbox.html?id=' + full.id + '&ani=' + full.ani_number + '"><i class="fa fa-edit"></i></a>';
                return edit_html;
            }
        }
    ],
    order = [],
    dataHighTable = callCaseAlertDataTable('call_box_high_status_table', 'liveMessage/report/tableList', filters, columns, loadMoreData, columnDefs, order);

getAlertList();

function ReloadCallBoxHighStatusTable() {
    let regionCode = $("#admin_region_box").find('option:selected').attr("data-code");
    let regionId = $("#admin_region_box").find('option:selected').val();
    filters.searchList[0]['value'] = regionId ? regionId : '';
    filters.searchList[3]['value'] = regionCode ? regionCode : '';
    filters.searchList[1]['value'] = $('#fx_ani').val() ? $('#fx_ani').val() : "";
    filters.searchList[2]['value'] = $('#fx_alert_box').val() ? $('#fx_alert_box').val() : "";
    $('#call_box_high_status_table').DataTable().ajax.reload();
}

function loadMoreData() {
    $('#btn-example-load-more').toggle(this.api().page.hasMore());
}

$('#btn-example-load-more').on('click', function () {
    $('#call_box_high_status_table').DataTable().page.loadMore();
});

$('#call_box_high_status_table').on('draw.dt', function () {
    countingAlarms();
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

$(document).on('change', '#fx_alert_box', function (event) {
    ReloadCallBoxHighStatusTable();
});

const countingAlarms = () => {
    let rowsData = $('#call_box_high_status_table').DataTable().ajax.json();
    $('#regionName').html(filters.searchList[3]['value'] ? filters.searchList[3]['value'] : 'All');
    $('#callBoxStatusListTotal,#callBoxStatusListBlueTotal,#callBoxStatusListRedTotal,#callBoxStatusListYellowTotal,#AlertStatisticsRed,#AlertStatisticsVoiceAlarm,#AlertStatisticsFrontDoorAlarm,#AStotalBatteryAlarm,#AStotalFrontPanelLampAlarm,#AStotalSolarAlarm,#AStotalReportCall,#AStotalInnerDoorAlarm,#AStotalBaggedTest,#AStotalProgrammingCall,#AStotalTiltAlarm,#AStotalControllerBITAlarm,#AStotalAuthorizedEntry,#AStotalExcessiveReorders').html('');
    let totalAlarm = rowsData.callBoxData;
    console.log('totalAlarm', totalAlarm);
    let totalInactive = rowsData.callBoxDataInActive;
    console.log('totalInactive', totalInactive);
    let TotalCallBoxes = totalAlarm + totalInactive;
    console.log('TotalCallBoxes', TotalCallBoxes);

    report_time = rowsData['reportTime'];
    console.log('report_time', report_time, moment(report_time).format('YYYY-MM-DD hh:mm:ss A'));
    if (report_time !== null) {
        $('.alert_status_div').removeClass('d-none');
        const message_date_time_PST = moment(report_time).tz("America/Los_Angeles").format('YYYY-MM-DD hh:mm:ss A');
        $('#realTime').html(message_date_time_PST + ' PST');
    } else {
        $('.alert_status_div').addClass('d-none');
    }

    // let totalAlarm = parseInt(rowsData.alarmCounting[0]['TotalCount']);
    let totalBlueAlarm = parseInt(rowsData.alarmCounting[0]['BlueColor']);
    let totalLightBlueAlarm = parseInt(rowsData.alarmCounting[0]['LightBlueColor']);
    let totalRedAlarm = parseInt(rowsData.alarmCounting[0]['RedColor']);
    let totalYellowAlarm = parseInt(rowsData.alarmCounting[0]['YellowColor']);
    let totalFailedToCheckin = parseInt(rowsData.alarmCounting[0]['FailToCheckIn']);
    let totalVoiceAlarm = parseInt(rowsData.alarmCounting[0]['VoiceAlarm']);
    let totalFrontDoorAlarm = parseInt(rowsData.alarmCounting[0]['FrontDoorAlarm']);
    let totalBatteryAlarm = parseInt(rowsData.alarmCounting[0]['BatteryAlarm']);
    let totalFrontPanelLampAlarm = parseInt(rowsData.alarmCounting[0]['FrontPanelLampAlarm']);
    let totalSolarAlarm = parseInt(rowsData.alarmCounting[0]['SolarAlarm']);
    let totalReportCall = parseInt(rowsData.alarmCounting[0]['ReportCall']);
    let totalInnerDoorAlarm = parseInt(rowsData.alarmCounting[0]['InnerDoorAlarm']);
    let totalBaggedTest = parseInt(rowsData.alarmCounting[0]['BaggedTest']);
    let totalProgrammingCall = parseInt(rowsData.alarmCounting[0]['ProgrammingCall']);
    let totalTiltAlarm = parseInt(rowsData.alarmCounting[0]['TiltAlarm']);
    let totalControllerBITAlarm = parseInt(rowsData.alarmCounting[0]['ControllerBITAlarm']);
    let totalAuthorizedEntry = parseInt(rowsData.alarmCounting[0]['AuthorizedEntry']);
    let totalExcessiveReorders = parseInt(rowsData.alarmCounting[0]['ExcessiveReorders']);

    let percentageRed = isNaN((totalRedAlarm * 100 / totalAlarm)) ? 0 : (totalRedAlarm * 100 / totalAlarm).toFixed(2);
    let percentageYellow = isNaN((totalYellowAlarm * 100 / totalAlarm)) ? 0 : (totalYellowAlarm * 100 / totalAlarm).toFixed(2);
    let percentageBlue = isNaN((totalBlueAlarm * 100 / totalAlarm)) ? 0 : (totalBlueAlarm * 100 / totalAlarm).toFixed(2);
    let percentageLightBlue = isNaN((totalLightBlueAlarm * 100 / totalAlarm)) ? 0 : (totalLightBlueAlarm * 100 / totalAlarm).toFixed(2);
    let percentageFailed = isNaN((totalInactive * 100 / TotalCallBoxes)) ? 0 : (totalInactive * 100 / TotalCallBoxes).toFixed(2);
    let percentageAlertStatisticsRed = isNaN((totalFailedToCheckin * 100 / totalAlarm)) ? 0 : (totalFailedToCheckin * 100 / totalAlarm).toFixed(2);
    // AS = Alert Statistics
    let percentageASVoiceAlarm = isNaN((totalVoiceAlarm * 100 / totalAlarm)) ? 0 : (totalVoiceAlarm * 100 / totalAlarm).toFixed(2);
    let percentageASFrontDoorAlarm = isNaN((totalFrontDoorAlarm * 100 / totalAlarm)) ? 0 : (totalFrontDoorAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalBatteryAlarm = isNaN((totalBatteryAlarm * 100 / totalAlarm)) ? 0 : (totalBatteryAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalFrontPanelLampAlarm = isNaN((totalFrontPanelLampAlarm * 100 / totalAlarm)) ? 0 : (totalFrontPanelLampAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalSolarAlarm = isNaN((totalSolarAlarm * 100 / totalAlarm)) ? 0 : (totalSolarAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalReportCall = isNaN((totalReportCall * 100 / totalAlarm)) ? 0 : (totalReportCall * 100 / totalAlarm).toFixed(2);
    let percentageAStotalInnerDoorAlarm = isNaN((totalInnerDoorAlarm * 100 / totalAlarm)) ? 0 : (totalInnerDoorAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalBaggedTest = isNaN((totalBaggedTest * 100 / totalAlarm)) ? 0 : (totalBaggedTest * 100 / totalAlarm).toFixed(2);
    let percentageAStotalProgrammingCall = isNaN((totalProgrammingCall * 100 / totalAlarm)) ? 0 : (totalProgrammingCall * 100 / totalAlarm).toFixed(2);
    let percentageAStotalTiltAlarm = isNaN((totalTiltAlarm * 100 / totalAlarm)) ? 0 : (totalTiltAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalControllerBITAlarm = isNaN((totalControllerBITAlarm * 100 / totalAlarm)) ? 0 : (totalControllerBITAlarm * 100 / totalAlarm).toFixed(2);
    let percentageAStotalAuthorizedEntry = isNaN((totalAuthorizedEntry * 100 / totalAlarm)) ? 0 : (totalAuthorizedEntry * 100 / totalAlarm).toFixed(2);
    let percentageAStotalExcessiveReorders = isNaN((totalExcessiveReorders * 100 / totalAlarm)) ? 0 : (totalExcessiveReorders * 100 / totalAlarm).toFixed(2);

    let callBoxStatusBlueHtml = totalBlueAlarm + ' of ' + totalAlarm + ' (' + percentageBlue + '%)  Operational';
    let callBoxStatusLightBlueHtml = totalLightBlueAlarm + ' of ' + totalAlarm + ' (' + percentageLightBlue + '%)  Informational';
    let callBoxStatusRedHtml = totalRedAlarm + ' of ' + totalAlarm + ' (' + percentageRed + '%) Service Required';
    let callBoxStatusYellowHtml = totalYellowAlarm + ' of ' + totalAlarm + ' (' + percentageYellow + '%)  Degraded Operations';
    let callBoxTotalHtml = 'Total Call Boxes ' + TotalCallBoxes + ' (' + totalAlarm + ' Active + ' + totalInactive + ' Inactive)';
    let FailedToCheckinHtml = totalInactive + ' of ' + TotalCallBoxes + ' (' + percentageFailed + '%) Inactive/Bagged';
    let AlertStatisticsRed = totalFailedToCheckin + ' of ' + totalAlarm + ' (' + percentageAlertStatisticsRed + '%) Failed to Check-in';
    let ASVoiceAlarm = totalVoiceAlarm + ' of ' + totalAlarm + ' (' + percentageASVoiceAlarm + '%) Audio Alarm';
    let ASFrontDoorAlarm = totalFrontDoorAlarm + ' of ' + totalAlarm + ' (' + percentageASFrontDoorAlarm + '%) Front Door Alarm';
    let AStotalBatteryAlarm = totalBatteryAlarm + ' of ' + totalAlarm + ' (' + percentageAStotalBatteryAlarm + '%) Battery Alarm';
    let AStotalFrontPanelLampAlarm = totalFrontPanelLampAlarm + ' of ' + totalAlarm + ' (' + percentageAStotalFrontPanelLampAlarm + '%) Front Panel Lamp Alarm';
    let AStotalSolarAlarm = totalSolarAlarm + ' of ' + totalAlarm + ' (' + percentageAStotalSolarAlarm + '%) Solar Alarm';
    let AStotalReportCall = totalReportCall + ' of ' + totalAlarm + ' (' + percentageAStotalReportCall + '%) Report Call';
    let AStotalInnerDoorAlarm = totalInnerDoorAlarm + ' of ' + totalAlarm + ' (' + percentageAStotalInnerDoorAlarm + '%) Inner Door Alarm';
    let AStotalBaggedTest = totalBaggedTest + ' of ' + totalAlarm + ' (' + percentageAStotalBaggedTest + '%) Bagged Test';
    let AStotalProgrammingCall = totalProgrammingCall + ' of ' + totalAlarm + ' (' + percentageAStotalProgrammingCall + '%) Programming Call';
    let AStotalTiltAlarm = totalTiltAlarm + ' of ' + totalAlarm + ' (' + percentageAStotalTiltAlarm + '%) Tilt Alarm';
    let AStotalControllerBITAlarm = totalControllerBITAlarm + ' of ' + totalAlarm + ' (' + percentageAStotalControllerBITAlarm + '%) TTY Alarm';
    let AStotalAuthorizedEntry = totalAuthorizedEntry + ' of ' + totalAlarm + ' (' + percentageAStotalAuthorizedEntry + '%) Authorized Entry';
    let AStotalExcessiveReorders = totalExcessiveReorders + ' of ' + totalAlarm + ' (' + percentageAStotalExcessiveReorders + '%) Excessive Reorders';

    let tooltipData = rowsData.tooltipData;

    $('#callBoxStatusListTotal').prepend(callBoxTotalHtml);
    $('#callBoxStatusListBlueTotal').prepend(callBoxStatusBlueHtml);
    $('#callBoxStatusListLightBlueTotal').html(callBoxStatusLightBlueHtml);
    $('#callBoxStatusListRedTotal').prepend(callBoxStatusRedHtml);
    $('#callBoxStatusListYellowTotal').prepend(callBoxStatusYellowHtml);
    $('#totalFailedToCheckin').html(FailedToCheckinHtml);
    $('#AlertStatisticsRed').prepend(AlertStatisticsRed);
    $('#AlertStatisticsVoiceAlarm').prepend(ASVoiceAlarm).attr('title', tooltipData['0040']);
    $('#AlertStatisticsFrontDoorAlarm').prepend(ASFrontDoorAlarm).attr('title', tooltipData['0200']);
    $('#AStotalBatteryAlarm').prepend(AStotalBatteryAlarm).attr('title', tooltipData['0100']);
    $('#AStotalFrontPanelLampAlarm').prepend(AStotalFrontPanelLampAlarm).attr('title', tooltipData['0004']);
    $('#AStotalSolarAlarm').prepend(AStotalSolarAlarm).attr('title', tooltipData['0010']);
    $('#AStotalReportCall').prepend(AStotalReportCall);
    $('#AStotalInnerDoorAlarm').prepend(AStotalInnerDoorAlarm).attr('title', tooltipData['0001']);
    $('#AStotalProgrammingCall').prepend(AStotalProgrammingCall);
    $('#AStotalTiltAlarm').prepend(AStotalTiltAlarm).attr('title', tooltipData['0020']);
    $('#AStotalControllerBITAlarm').prepend(AStotalControllerBITAlarm).attr('title', tooltipData['0002']);
    $('#AStotalAuthorizedEntry').prepend(AStotalAuthorizedEntry).attr('title', tooltipData['4000']);
    $('#AStotalExcessiveReorders').prepend(AStotalExcessiveReorders);
};

const sendLiveStatusMessage = (ResponseData) => {
    // console.log("updateLiveCallBoxStatusResponseData", ResponseData);
    // ReloadCallBoxHighStatusTable();
};

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadCallBoxHighStatusTable();
});

$('.status_table tbody').on('click', 'td.dt-control', function () {
    let tr = $(this).closest('tr');
    console.log($(this).closest('table').attr('id'), "status_table");
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

function format(result) {
    let logInfoHtml = '';
    if(result.TCAR) {
    let messageData = result.TCAR.TLMD;
        logInfoHtml += '<div class="row">' +
            '<div class="col-lg-12">' +
            '<table cellpadding="5" cellspacing="0" border="0" style="width: 100%;">' +
            '<tr >' +
            '<td style="width: 35%;">original message:</td>' +
            '<td style="word-break: break-all;white-space: normal;">' + messageData.original_message + '</td>' +
            '</tr>' +
            '<tr class="' + (messageData.region ? "alert-show" : "d-none") + '">' +
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

            '<tr class="' + (messageData.ani ? "alert-show" : "d-none") + '">' +
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
            '<td>tty status :</td>' +
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
            '<tr >' +
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

$('.resetFn').click(function () {
    $('#search-call-box-status-value')[0].reset();
    ReloadCallBoxHighStatusTable();
});

const urlParams = new URLSearchParams(window.location.search);
const url_call_box_id = urlParams.get('id');
if (url_call_box_id) {
    const ani = urlParams.get('ani');
    const region = urlParams.get('region');
    viewCaseAlert(ani, region, url_call_box_id);
}

function detail_btn(id) {
    sendCaseCloudHTTPRequest("message/" + id, 'GET', "", function (result) {
        if (result.data) {
            let ResponseData = result.data;
            console.log("MessageView", ResponseData.call_box_id);
            viewCaseAlert(ResponseData.ani, ResponseData.region, ResponseData.call_box_id);
        }
    }, true);
}

function viewCaseAlert(ani, region, call_box_id) {
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
    let viewDetails =
        '<div>' +
        '<span class="font-weight-bold">ANI: <span>' + ani + '</span></span>' +
        '</div>' +
        '<div>' +
        '<span class="font-weight-bold">region: <span>' + region + '</span></span>' +
        '</div>';
    $('#callBoxStatusDetail').html(viewDetails);
    selected_call_box_id = call_box_id;
    getChartList();
}

function checkModulePermission() {
    let user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    // if(user_type != "admin"){
    //     window.location = _config.domain+"index.html";
    // }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
    GetRegionList();
}

const exportCSV = () => {
    const table = $('#call_box_high_status_table').DataTable();
    const reqData = JSON.parse(table.ajax.params());

    sendCaseCloudHTTPRequest("liveMessage/report/export", "POST", reqData, function (result) {
        if (result) {
            let responseData = result.data;
            let resultData = responseData.messageData;
            let resultTime = responseData.reportTime;
            let csvContent = 'ANI, Region, Status code, Time, Alert, Duration, Location\r\n';
            let exportData = [];
            resultData.forEach(function (rowArray) {
                let callBoxArray = rowArray['TCAR'];
                console.log(callBoxArray,"CallBoxArray");

                // Time
                callBoxArray['time'] = '';
                let timezone = rowArray['TRD'] && rowArray['TRD']['timezone'] !== null ? rowArray['TRD']['timezone'] : 'America/Los_Angeles';
                if (callBoxArray.status_code !== '9999') {
                    let dateTime = callBoxArray && callBoxArray['TLMD']['updatedAt'] ? callBoxArray['TLMD']['updatedAt'] : rowArray['updatedAt'];
                    callBoxArray['time'] = convertUTCToTimezone(dateTime, null, timezone);
                } else {
                    let dateTime = callBoxArray['report_generated_at'];
                    callBoxArray['time'] = convertUTCToTimezone(dateTime, null, timezone);
                }

                // Region
                callBoxArray['region'] = rowArray['TRD']['region_code'] ? rowArray['TRD']['region_code'] : '';

                // ANI
                callBoxArray['ani'] = rowArray['ani_number'];

                // Status code
                callBoxArray['status_code'] = callBoxArray['TLMD']['status_code'] ? callBoxArray['TLMD']['status_code'] : '';

                // Alert
                let alert = '';
                let messages_data = callBoxArray['TLMD']['TMD'];
                if (messages_data) {
                    let aniMetaData = messages_data['TAMD'];
                    if (aniMetaData) {
                        let statusName = aniMetaData['meta_type'];
                        if (aniMetaData['name'] === '9999') {
                            statusName = aniMetaData['meta_type'] + ' (FTC)'
                        }
                        alert = statusName;
                    }
                }
                callBoxArray['alert'] = alert ? alert : 'Inactive';

                // Duration
                let duration = '';
                let messages_info = callBoxArray['TLMD']['TMD'];
                if (messages_info && rowArray.cf_status === '1') {
                    if (messages_info.alarm_started_at && messages_info.meta_status !== '1000') {
                        const current_date = moment(resultTime);
                        const last_date = moment(messages_info.alarm_started_at);
                        const diff_date = current_date.diff(last_date);
                        const diffDuration = moment.duration(diff_date);
                        const days = diffDuration.days() ? diffDuration.days() + pluralize(diffDuration.days(), 'd') + ' ' : '';
                        const hours = diffDuration.hours() ? diffDuration.hours() + pluralize(diffDuration.hours(), 'hr') + ' ' : '';
                        const minute = diffDuration.minutes() ? diffDuration.minutes() + pluralize(diffDuration.minutes(), 'min') + ' ' : '';
                        duration = days + hours + minute;
                    }
                }
                callBoxArray['duration'] = duration;

                // Location
                callBoxArray['location'] = rowArray && true ? rowArray.description : '';
                let csvJson = _.omit(callBoxArray, ['TLMD'], 'id', 'message_id', 'createdAt', 'updatedAt', 'region_id');
                let csvData = _.values(csvJson);
                let csvResponse = csvData.map(string => string === null ? '' : `\"${string}\"`);

                exportData.push(csvResponse);
            });

            let row = exportData.join("\n");
            csvContent += row + "\r\n";
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement('a');
            const current_date = moment(resultTime).tz("America/Los_Angeles").format('YYYY-MM-DD hh:mm:ss A');
            let timestamp = new Date().getTime();
            let fileDate = current_date;
            let fileName = 'X15-Live-Message-' + fileDate + '.csv';
            let Name = 'X15-Live-Message-'+timestamp;
            link.id = Name;
            link.target = '_blank';
            link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            document.querySelector('#'+Name).click();
           // downloadFile(fileName, 'data:text/csv;charset=utf-8,' + encodedUri);
        }
    });
};

function getAlertList() {
    sendCaseCloudHTTPRequest('aniMeta/list', "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let alert_box = '<option value="">All</option>';
            $.each(ResponseData, function (index, value) {
                if (value.name !== '9998') alert_box += '<option value="' + value.name + '">' + value.meta_type + '</option>';
            });
            $('#fx_alert_box').html(alert_box);
        }
    });
}

let currentDate = new Date(), currentYear = currentDate.getFullYear(), lastMonth = currentDate.getMonth(),
    currentMonth = (lastMonth + 1), currentMonthStr = ('0' + currentMonth).slice(-2); // get current date
let makeDate = new Date();
let makeYearFirstDay = makeDate.setMonth(makeDate.getMonth() - 12);
let previousYear = new Date(makeYearFirstDay).toLocaleDateString();
let todayYear = new Date(currentDate).toLocaleDateString();
let makeMonthDate = new Date(currentDate);
let makeMonthFirstDay = makeMonthDate.setMonth(makeMonthDate.getMonth() - 1);
let monthFirstDay = new Date(makeMonthFirstDay).toLocaleDateString();
let selected_start_scale = previousYear;
let selected_end_scale = todayYear;
//let monthLastDay = currentDate.toLocaleDateString();
//console.log(monthLastDay, " lastDay = currentDate.toLocaleDateString();", todayYear);

let optionsECIO = {
    series: [{
        name: "ECIO",
        data: []
    }],
    chart: {
        id: 'ECIO', type: 'line', height: 350, zoom: {
            autoScaleYaxis: false,
        }, group: 'social',
        animations: {enabled: false},
        toolbar: {show: false,}
    },
    annotations: {},
    title: {text: 'ECIO/RSSI', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: 'ECIO',}, labels: {minWidth: 40}},
        {opposite: true, title: {text: 'RSSI',}, labels: {minWidth: 40},},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartECIO = new ApexCharts(document.querySelector("#chart-ECIO"), optionsECIO);
chartECIO.render();

let optionsBattery = {
    series: [{
        name: "Battery",
        data: []
    }],
    chart: {
        id: 'Battery', type: 'line', height: 350, zoom: {autoScaleYaxis: false}, group: 'social',
        animations: {enabled: false},
        toolbar: {show: false,}
    },
    annotations: {},
    title: {text: 'Battery', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: '',}, labels: {minWidth: 40}},
        {opposite: true, title: {text: 'Battery',},labels: {minWidth: 40, style: {colors: ['#ffffff00']}},},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartBattery = new ApexCharts(document.querySelector("#chart-battery"), optionsBattery);
chartBattery.render();

let optionsFTC = {
    series: [{
        name: "FTC",
        data: []
    }],
    chart: {
        id: 'FTC', type: 'line', height: 150, group: 'social',
        animations: {enabled: false},
    },
    stroke: {
        curve: 'stepline',
    },
    annotations: {},
    title: {text: 'FTC', align: 'center'},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: '',}, labels: {minWidth: 40},tickAmount: 1, min: 0, max: 1,},
        {opposite: true, title: {text: 'FTC',}, labels: {minWidth: 40, style: {colors: ['#ffffff00']}},},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartFTC = new ApexCharts(document.querySelector("#chart-FTC"), optionsFTC);
chartFTC.render();

var resetCssClasses = function (activeEl) {
    var els = document.querySelectorAll('.btn-chart');
    Array.prototype.forEach.call(els, function (el) {
        el.classList.remove('active')
    });
    activeEl.target.classList.add('active')
};

document.querySelector('#one_month').addEventListener('click', function (e) {
    resetCssClasses(e);
    console.log("Chartone_year1", new Date().toISOString());
    chartECIO.zoomX(new Date(monthFirstDay).getTime(), new Date(todayYear).getTime());
    //chartBattery.zoomX(new Date(monthFirstDay).getTime(), new Date(todayYear).getTime());
    console.log("Chartone_year2", new Date().toISOString());
    let zoomMinDay = new Date(monthFirstDay).getTime();
    let zoomMaxDay = new Date(todayYear).getTime();
    //chartBattery.updateOptions({xaxis: {min: zoomMinDay, max: zoomMaxDay}}, false, false, true);
    console.log("Chartone_year3", new Date().toISOString());
});
document.querySelector('#one_day').addEventListener('click', function (e) {
    resetCssClasses(e);
    let firstDay = currentDate.setUTCHours(0, 0, 0, 0);
    let lastDay = currentDate.setUTCHours(23, 59, 59, 999);
    console.log(firstDay, "lastDay", lastDay);
    chartECIO.zoomX(new Date(firstDay).getTime(), new Date(lastDay).getTime());
    //chartBattery.zoomX(new Date(firstDay).getTime(), new Date(lastDay).getTime());
});
document.querySelector('#one_week').addEventListener('click', function (e) {
    resetCssClasses(e);
    let weekFirstDay = new Date().toLocaleDateString();
    let weekLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7).toLocaleDateString();
    console.log(weekFirstDay, "Week", weekLastDay);
    chartECIO.zoomX(new Date(weekLastDay).getTime(), new Date(weekFirstDay).getTime());
    //chartBattery.zoomX(new Date(weekLastDay).getTime(), new Date(weekFirstDay).getTime());
    //selected_start_scale = weekFirstDay;
    //selected_end_scale = weekLastDay;
    //getChartList();
});
document.querySelector('#six_months').addEventListener('click', function (e) {
    resetCssClasses(e);
    let makeDate = new Date(currentDate);
    let makeMonthFirstDay = makeDate.setMonth(makeDate.getMonth() - 6);
    let monthFirstDay = new Date(makeMonthFirstDay).toLocaleDateString();
    let monthLastDay = currentDate.toLocaleDateString();
    console.log(monthFirstDay, "monthLastDay", monthLastDay);
    chartECIO.zoomX(new Date(monthFirstDay).getTime(), new Date(monthLastDay).getTime());
    //chartBattery.zoomX(new Date(monthFirstDay).getTime(), new Date(monthLastDay).getTime());
});
document.querySelector('#one_year').addEventListener('click', function (e) {
    resetCssClasses(e);
    let makeDate = new Date(currentDate);
    let makeYearFirstDay = makeDate.setMonth(makeDate.getMonth() - 12);
    let yearFirstDay = new Date(makeYearFirstDay).toLocaleDateString();
    let yearLastDay = currentDate.toLocaleDateString();
    let zoomMinDay = new Date(yearFirstDay).getTime();
    let zoomMaxDay = new Date(yearLastDay).getTime();
    console.log("Chartone_year0", new Date().toISOString());
    chartECIO.zoomX(new Date(yearFirstDay).getTime(), new Date(yearLastDay).getTime());
    //chartBattery.zoomX(new Date(yearFirstDay).getTime(), new Date(yearLastDay).getTime());
    console.log("Chartone_year1", new Date().toISOString());
    //chartECIO.updateOptions({xaxis: {min: zoomMinDay, max: zoomMaxDay}}, false, false, true);
    console.log("Chartone_year2", new Date().toISOString());
    //chartBattery.updateOptions({xaxis: {min: zoomMinDay, max: zoomMaxDay}}, false, false, false);
    console.log("Chartone_year3", new Date().toISOString());
    //selected_start_scale = yearFirstDay;
    //selected_end_scale = yearLastDay;
    //getChartList();
});

function getChartList() {
    let data = {
        'call_box_id': selected_call_box_id, 'start_date': selected_start_scale, 'end_date': selected_end_scale
    };
    sendCaseCloudHTTPRequest('message/report/chart', "POST", data, function (result) {
        if (result) {
            let batteryData = result.data.batteryData;
            let ECIOData = result.data.ECIOData;
            let audioAlarmData = result.data.audioAlarmData;
            let callBoxesData = result.data.callBoxesData;
            let batteryValueData = [], batteryAlertData = [];
            let ECIOValueData = [], rssiValueData = [];
            let failToCheckIn = [], FTCValueData = [];
            $.each(batteryData, function (index, res) {
                if (res.status_code === '9999') {
                    //failToCheckIn.push([res.updated_timestamp]);
                    failToCheckIn.push({
                        id: `annotation`, x: res.updated_timestamp,
                        label: {text: 'Fail to Check In', style: {background: '#fff', color: '#ff0300',},},
                        y: 0, marker: {size: 6, fillColor: "#fff", strokeColor: "#ff0300", radius: 2},
                    });
                } else {
                    ECIOValueData.push([res.updated_timestamp, res.ecio]);
                    batteryValueData.push([res.updated_timestamp, res.battery_voltage]);
                    rssiValueData.push([res.updated_timestamp, res.signal_rssi]);
                }
                /*if (battery_alert === '1') {
                    batteryAlertData.push();
                }*/
                FTCValueData.push([res.updated_timestamp, res.ftcvalue])
            });

            console.log("Chart0", FTCValueData);
            ApexCharts.exec('FTC', 'updateSeries', [{data: FTCValueData}], false);
            ApexCharts.exec('Battery', 'updateSeries', [{data: batteryValueData}], false);
            ApexCharts.exec('ECIO', 'updateSeries', [{data: ECIOValueData}], false);
            console.log("Chart1", new Date().toISOString());
            chartECIO.appendSeries({name: 'RSSI', data: rssiValueData});

            let tilt_start_date = [], battery_start_date = [], audio_start_date = [],
                solar_start_date = [], front_panel_start_date = [], tty_start_date = [],
                front_door_start_date = [], authorized_entry_start_date = [], inner_door_start_date = [],
                excessive_reorders_start_date = [], programming_call_start_date = [];
            $.each(audioAlarmData, function (index, res) {
                if (res.tilt_start_date) {
                    tilt_start_date.push({
                        id: `tilt_start_date`, x: res.tilt_start_date,
                        label: {text: 'tilt', style: {background: '#ff0300', color: '#fff',},},
                    });
                }
                if (res.battery_start_date) {
                    battery_start_date.push({
                        id: `battery_start_date`, x: res.battery_start_date,
                        label: {text: 'battery', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.audio_start_date) {
                    audio_start_date.push({
                        id: `audio_start_date`, x: res.audio_start_date,
                        label: {text: 'Audio', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.solar_start_date) {
                    solar_start_date.push({
                        id: `solar_start_date`, x: res.solar_start_date,
                        label: {text: 'solar', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.front_panel_start_date) {
                    front_panel_start_date.push({
                        id: `front_panel_start_date`, x: res.front_panel_start_date,
                        label: {text: 'front panel', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.tty_start_date) {
                    tty_start_date.push({
                        id: `tty_start_date`, x: res.tty_start_date,
                        label: {text: 'TTY', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.front_door_start_date) {
                    front_door_start_date.push({
                        id: `front_door_start_date`, x: res.front_door_start_date,
                        label: {text: 'front door', style: {background: '#005ec9', color: '#000',},},
                    });
                }
                if (res.authorized_entry_start_date) {
                    authorized_entry_start_date.push({
                        id: `authorized_entry_start_date`, x: res.authorized_entry_start_date,
                        label: {text: 'authorized entry', style: {background: '#005ec9', color: '#000',},},
                    });
                }
                if (res.inner_door_start_date) {
                    inner_door_start_date.push({
                        id: `inner_door_start_date`, x: res.inner_door_start_date,
                        label: {text: 'inner door', style: {background: '#005ec9', color: '#000',},},
                    });
                }
                if (res.excessive_reorders_start_date) {
                    excessive_reorders_start_date.push({
                        id: `excessive_reorders_start_date`, x: res.excessive_reorders_start_date,
                        label: {text: 'excessive reorders', style: {background: '#0000FF', color: '#FFF',},},
                    });
                }
                if (res.programming_call_start_date) {
                    programming_call_start_date.push({
                        id: `programming_call_start_date`, x: res.programming_call_start_date,
                        label: {text: 'programming call', style: {background: '#0000FF', color: '#FFF',},},
                    });
                }
            });
            const fn = _.spread(_.union);
            const mergeAlarm = [
                tilt_start_date,battery_start_date,audio_start_date,
                solar_start_date,front_panel_start_date,tty_start_date,
                front_door_start_date,authorized_entry_start_date,inner_door_start_date,
                excessive_reorders_start_date,programming_call_start_date,
                failToCheckIn
            ];
            const allAlarm = fn(mergeAlarm);
            chartFTC.updateOptions({annotations: {xaxis: allAlarm}}, true, false, true);
            chartBattery.updateOptions({annotations: {xaxis: allAlarm}}, true, false, true);
            chartECIO.updateOptions({annotations: {xaxis: allAlarm}}, true, false, true);
            let battery_low_level = callBoxesData.battery_low_level !== "0" ? callBoxesData.battery_low_level : _config.BATTERY_LOW_LEVEL;
            let battery_high_level = callBoxesData.battery_high_level !== "0" ? callBoxesData.battery_high_level : _config.BATTERY_HIGH_LEVEL;
            /*chartBattery.addYaxisAnnotation({
                y: parseInt(battery_low_level),
                y2: parseInt(battery_high_level),
                borderColor: '#000', fillColor: '#FEB019', label: {text: 'Battery Level',}
            });*/
            /* chartBattery.addYaxisAnnotation({y: 0, y2: 10, borderColor: '#000', fillColor: '#FF0005',});
             chartBattery.addYaxisAnnotation({y: 10, y2: 11, borderColor: '#000', fillColor: '#FF7102',});
             chartBattery.addYaxisAnnotation({y: 11, y2: 12, borderColor: '#000', fillColor: '#c1ad00',});
             chartBattery.addYaxisAnnotation({y: 12, y2: 100, borderColor: '#000', fillColor: '#32CD32',});*/
            console.log(ECIOValueData, "batteryValueData", batteryValueData);
            chartECIO.zoomX(new Date(monthFirstDay).getTime(), new Date(selected_end_scale).getTime());
            // chartBattery.zoomX(new Date(monthFirstDay).getTime(), new Date(selected_end_scale).getTime());
            // chartFTC.zoomX(new Date(monthFirstDay).getTime(), new Date(selected_end_scale).getTime());
        }
    });
}

/*var span = document.getElementById('realTime');

function time() {
    const current_date = moment(new Date()).format('DD-MM-YYYY');
    var d = new Date();
    var s = d.getSeconds();
    var m = d.getMinutes();
    var h = d.getHours();
    span.textContent = current_date + " " + ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2);
}

setInterval(time, 1000);*/

$('.cancelBtn, .backBtn').click(function (e) {
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
    resetCssClasses(e);
    $('#one_month').addClass('active');
    chartBattery.clearAnnotations();
    chartECIO.clearAnnotations();
    //chartBattery.removeAnnotation('annotation');
    if (url_call_box_id) history.back();
    $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
});
