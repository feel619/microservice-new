let selected_call_box_id = '';
let report_time = '';

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

let filters = {
        legend: '1',
        searchList: [
            {
                "field": "region_id", "operator": "is",
                "value": localStorage.getItem("region_id") ? localStorage.getItem("region_id") : $("select#admin_region_box>option:eq(0)").val()
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
        {name: 'one', className: 'dt-control', orderable: false, data: 'id', defaultContent: '', width: "5%"},
        {name: 'two', data: 'id', orderable: true, "width": "10%",},
        {name: 'third', data: 'region_ani', orderable: true, "width": "5%"},
        {name: 'fourth', data: 'ani_number', orderable: true, "width": "5%"},
        {data: 'status_code', orderable: false, "width": "5%"},
        {data: 'sub_status_code', orderable: true, "width": "15%"},
        {data: 'alarm_started_at', orderable: true, "width": "15%"},
        {name: 'box_number', data:'box_number',orderable: true, "width": "10%"},
        {name: 'eight', data: 'description', orderable: false, "width": "35%"},
        {data: 'id', orderable: false, "width": "5%"}
    ],
    columnDefs = [
        {
            "targets": [0],
            "createdCell": function (td, cellData, full) {
                if (full.status_code === '9999' || full.cf_status === '2') {
                    $(td).removeClass('dt-control');
                }
            },
            render: function () {
                return '';
            }
        },
        {
            "targets": [1],
            render: function (data, type, full) {
                let timezone = full.timezone !== null ? full.timezone : 'America/Los_Angeles', dateTime = '';
                if (full.cf_status === '1') {
                    if (full.status_code !== '9999') {
                        dateTime = full.message_updated_at != null ? full.message_updated_at : full.call_box_created_at;
                    } else {
                        dateTime = full.report_generated_at;
                    }
                } else {
                    dateTime = full.call_box_updated_at != null ? full.call_box_updated_at : full.call_box_created_at;
                }
                return convertUTCToTimezone(dateTime, null, timezone);
            }
        },
        {
            "targets": [2],
            render: function (region_code, type, full) {
                return full.region_code != null ? full.region_code : '';
            }
        },
        {
            "targets": [3],
            render: function (ani_number, type, full) {
                return ani_number != null ? ani_number : '';
            }
        },
        {
            "targets": [4],
            render: function (status_code, type, full) {
                return full.cf_status === '1' ? status_code : '';
            }
        },
        {
            "targets": [5],
            render: function (sub_status_code, type, full) {

                let status_name = full.status_name;
                if (sub_status_code === '9999') {
                    status_name = full.status_name + ' (FTC)'
                }
                if (sub_status_code === '0002') {
                    status_name = messageTTYAlarm[full.TLMD.tty_status_code]
                }
                return full.cf_status === '1' ? '<div title="' + status_name + ' - ' + full.tooltip + '" class="callBoxStatusList' + full.color + '"  >' + status_name + '</div>' : 'Inactive';
            }
        },
        {
            "targets": [6],
            render: function (alarm_started_at, type, full) {
                let current_date = moment(full.report_time),
                    last_date = moment(alarm_started_at),
                    diff_duration = '';
                if (full.cf_status === '1' && alarm_started_at != null) {
                    diff_duration = getDuration(current_date, last_date);
                }
                return '<div  class="d-block" >' + diff_duration + '</div>';
            }
        },
        {
            "targets": [7],
            render: function (box_number, type, full) {
                if (full.box_number !== '') {
                    let call_box = '';
                    box_number = box_number != null ? box_number : '';
                    call_box += '<div class="text-cvs-wrap">';
                    call_box += '<div class="">' + box_number + '</div>';
                    call_box += '</div>';
                    return call_box;
                } else {
                    return box_number
                }
            }
        },
        {
            "targets": [8],
            render: function (description, type, full) {
                if (full.cf_status === '1') {
                    //let isTestCallBox = (full['is_test']) ? '<b>TEST CALL BOX — Alert not included in overall CASE Alerts statistics</b>':'';
                    let call_box = '';
                    description = description != null ? description : '';
                    call_box += '<div class="text-cvs-wrap">';
                    call_box += '<div class="">' + description + '</div>';
                    call_box += '</div>';
                    return call_box;
                } else {
                    return description;
                }
            }
        },
        {
            "targets": [9],
            render: function (data, type, full, meta) {
                let regionCode = full.region_code ? full.region_code : '', edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="view" class="btn white-color btn-sm btn-primary" onclick="viewCaseAlert(\'' + full.ani_number + '\',\'' + regionCode + '\',\'' + full.call_box_id + '\')"><i class="fa fa-eye"></i></a>';
                edit_html += '<a data-toggle="tooltip" title="edit" class="btn ml-1 white-color btn-sm btn-primary"  href="callbox.html?id=' + full.call_box_id + '&ani=' + full.ani_number + '"><i class="fa fa-edit"></i></a>';
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
    $('#callBoxStatusListTotal,#callBoxStatusListBlueTotal,#callBoxStatusListRedTotal,#callBoxStatusListYellowTotal,#AlertStatisticsRed,#AlertPrimaryFTCRed,#AlertSecondaryFTCRed,#AlertStatisticsVoiceAlarm,#AlertStatisticsFrontDoorAlarm,#AStotalBatteryAlarm,#AStotalFrontPanelLampAlarm,#AStotalSolarAlarm,#AStotalReportCall,#AStotalInnerDoorAlarm,#AStotalBaggedTest,#AStotalProgrammingCall,#AStotalTiltAlarm,#AStotalControllerBITAlarm,#AStotalAuthorizedEntry,#AStotalExcessiveReorders').html('');
    let total = rowsData.callBoxData;
    console.log('totalAlarm', total);
    let totalAlarm = parseInt(total['active']);
    let totalInactive = parseInt(total['inactive']);
    let TotalCallBoxes = totalAlarm + totalInactive;
    report_time = rowsData['reportTime'];
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
    let totalPrimaryFTC = parseInt(rowsData.alarmCounting[0]['PrimaryFTC']);
    let totalSecondaryFTC = parseInt(rowsData.alarmCounting[0]['SecondaryFTC']);
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
    let percentageAlertPrimaryFTCRed = isNaN((totalPrimaryFTC * 100 / totalAlarm)) ? 0 : (totalPrimaryFTC * 100 / totalAlarm).toFixed(2);
    let percentageAlertSecondaryFTCRed = isNaN((totalSecondaryFTC * 100 / totalAlarm)) ? 0 : (totalSecondaryFTC * 100 / totalAlarm).toFixed(2);
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

    let callBoxStatusBlueHtml = (isNaN(totalBlueAlarm ) ? 0 : totalBlueAlarm) + ' of ' + totalAlarm + ' (' + percentageBlue + '%)  Operational';
    let callBoxStatusLightBlueHtml = (isNaN(totalLightBlueAlarm ) ? 0 : totalLightBlueAlarm) + ' of ' + totalAlarm + ' (' + percentageLightBlue + '%)  Informational';
    let callBoxStatusRedHtml = (isNaN(totalRedAlarm ) ? 0 : totalRedAlarm) + ' of ' + totalAlarm + ' (' + percentageRed + '%) Service Required';
    let callBoxStatusYellowHtml = (isNaN(totalYellowAlarm  ) ? 0 : totalYellowAlarm)+ ' of ' + totalAlarm + ' (' + percentageYellow + '%)  Degraded Operations';
    let callBoxTotalHtml = 'Total Call Boxes ' + TotalCallBoxes + ' (' + totalAlarm + ' Active + ' + totalInactive + ' Inactive)';
    let FailedToCheckinHtml = totalInactive + ' of ' + TotalCallBoxes + ' (' + percentageFailed + '%) Inactive/Bagged';
    let AlertStatisticsRed = (isNaN(totalFailedToCheckin) ? 0 : totalFailedToCheckin) + ' of ' + totalAlarm + ' (' + percentageAlertStatisticsRed + '%) Failed to Check-in';
    let AlertPrimaryFTCRed = (isNaN(totalPrimaryFTC) ? 0 : totalPrimaryFTC) + ' of ' + totalAlarm + ' (' + percentageAlertPrimaryFTCRed + '%) Primary FTC';
    let AlertSecondaryFTCRed = (isNaN(totalSecondaryFTC) ? 0 : totalSecondaryFTC) + ' of ' + totalAlarm + ' (' + percentageAlertSecondaryFTCRed + '%) Secondary FTC';
    let ASVoiceAlarm = (isNaN(totalVoiceAlarm) ? 0 : totalVoiceAlarm) + ' of ' + totalAlarm + ' (' + percentageASVoiceAlarm + '%) Audio Alarm';
    let ASFrontDoorAlarm = (isNaN(totalFrontDoorAlarm) ? 0 : totalFrontDoorAlarm) + ' of ' + totalAlarm + ' (' + percentageASFrontDoorAlarm + '%) Front Door Alarm';
    let AStotalBatteryAlarm = (isNaN(totalBatteryAlarm) ? 0 : totalBatteryAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalBatteryAlarm + '%) Battery Alarm';
    let AStotalFrontPanelLampAlarm = (isNaN(totalFrontPanelLampAlarm) ? 0 : totalFrontPanelLampAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalFrontPanelLampAlarm + '%) Front Panel Lamp Alarm';
    let AStotalSolarAlarm = (isNaN(totalSolarAlarm) ? 0 : totalSolarAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalSolarAlarm + '%) Solar Alarm';
    let AStotalReportCall = (isNaN(totalReportCall) ? 0 : totalReportCall) + ' of ' + totalAlarm + ' (' + percentageAStotalReportCall + '%) Report Call';
    let AStotalInnerDoorAlarm = (isNaN(totalInnerDoorAlarm) ? 0 : totalInnerDoorAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalInnerDoorAlarm + '%) Inner Door Alarm';
    let AStotalBaggedTest = (isNaN(totalBaggedTest) ? 0 : totalBaggedTest) + ' of ' + totalAlarm + ' (' + percentageAStotalBaggedTest + '%) Bagged Test';
    let AStotalProgrammingCall = (isNaN(totalProgrammingCall) ? 0 : totalProgrammingCall) + ' of ' + totalAlarm + ' (' + percentageAStotalProgrammingCall + '%) Programming Call';
    let AStotalTiltAlarm = (isNaN(totalTiltAlarm  ) ? 0 : totalTiltAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalTiltAlarm + '%) Tilt Alarm';
    let AStotalControllerBITAlarm = (isNaN(totalControllerBITAlarm) ? 0 : totalControllerBITAlarm)+ ' of ' + totalAlarm + ' (' + percentageAStotalControllerBITAlarm + '%) TTY Alarm';
    let AStotalAuthorizedEntry = (isNaN(totalAuthorizedEntry) ? 0 : totalAuthorizedEntry) + ' of ' + totalAlarm + ' (' + percentageAStotalAuthorizedEntry + '%) Authorized Entry';
    let AStotalExcessiveReorders = (isNaN(totalExcessiveReorders) ? 0 : totalExcessiveReorders) + ' of ' + totalAlarm + ' (' + percentageAStotalExcessiveReorders + '%) Excessive Reorders';

    let tooltipData = rowsData.tooltipData;

    $('#callBoxStatusListTotal').prepend(callBoxTotalHtml);
    $('#callBoxStatusListBlueTotal').prepend(callBoxStatusBlueHtml);
    $('#callBoxStatusListLightBlueTotal').html(callBoxStatusLightBlueHtml);
    $('#callBoxStatusListRedTotal').prepend(callBoxStatusRedHtml);
    $('#callBoxStatusListYellowTotal').prepend(callBoxStatusYellowHtml);
    $('#totalFailedToCheckin').html(FailedToCheckinHtml);
    $('#AlertSecondaryFTCRed').prepend(AlertSecondaryFTCRed);
    $('#AlertPrimaryFTCRed').prepend(AlertPrimaryFTCRed);
    $('#AlertStatisticsRed').prepend(AlertStatisticsRed).attr('title', tooltipData['9999']);
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
    let messageData = result.TLMD;
    if (messageData) {
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
        messageData.sub_status.forEach(function (value, key) {
            logInfoHtml += '<div class="">' + value + '</div>';
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
    $('#fx_ani').val('');
    $('#fx_alert_box').val('');
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
            let resultData = result.messageData;
            let resultTime = result.reportTime;
            let csvContent = 'ANI, Region, Status code, Time, Alert, Duration, Location\r\n';
            let exportData = [];
            resultData.forEach(function (rowArray) {

                let callBoxArray = rowArray;

                // Time
                callBoxArray['time'] = '';
                let timezone = rowArray['timezone'] !== null ? rowArray['timezone'] : 'America/Los_Angeles',
                    dateTime = '';
                if (rowArray['cf_status'] === '1') {
                    if (rowArray['status_code'] !== '9999') {
                        dateTime = rowArray['message_updated_at'] != null ? rowArray['message_updated_at'] : rowArray['call_box_created_at'];
                    } else {
                        dateTime = rowArray['report_generated_at'];
                    }
                } else {
                    dateTime = rowArray['call_box_updated_at'] != null ? rowArray['call_box_updated_at'] : rowArray['call_box_created_at'];
                }
                callBoxArray['time'] = convertUTCToTimezone(dateTime, null, timezone);

                // Region
                callBoxArray['region'] = rowArray['region_code'] ? rowArray['region_code'] : '';

                // ANI
                callBoxArray['ani'] = rowArray['ani_number'];

                callBoxArray['status_code'] = rowArray['cf_status'] === '1' ? rowArray['status_code'] : '';

                // Alert
                let alert = '';
                if (rowArray.cf_status === '1') {
                    if (rowArray['sub_status_code'] === '9999') {
                        alert = rowArray['status_name'] + ' (FTC)';
                    } else if (rowArray['sub_status_code'] === '0002') {
                        alert = messageTTYAlarm[rowArray.tty_status_code];
                    } else {
                        alert = rowArray['status_name'];
                    }
                } else {
                    alert = 'Inactive';
                }
                callBoxArray['alert'] = alert;

                // Duration
                let current_date = moment(resultTime),
                    last_date = moment(rowArray['alarm_started_at']),
                    diff_duration = '';
                if (rowArray.cf_status === '1' && rowArray['alarm_started_at'] != null) {
                    diff_duration = getDuration(current_date, last_date);
                }
                callBoxArray['duration'] = diff_duration;

                // Location
                callBoxArray['location'] = rowArray && true ? rowArray['description'] : '';
                let csvJson = _.pick(callBoxArray, 'ani', 'region', 'status_code', 'time', 'alert', 'duration', 'location');
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
            let fileName = 'X15-Live-Message-classic-' + current_date + '.csv';
            let Name = 'X15-Live-Message-classic-' + timestamp;
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
            let alert_box = '<option value="">All</option>';
            $.each(ResponseData, function (index, value) {
                if (value.name !== '9998') alert_box += '<option value="' + value.name + '">' + value.meta_type + '</option>';
            });
            $('#fx_alert_box').html(alert_box);
        }
    });
}

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
        toolbar: { show: true },
    },
    annotations: {},
    title: {text: 'ECIO', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: 'ECIO',}, labels: {minWidth: 40}, tickAmount: 4, min: -20, max: 0,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartECIO = new ApexCharts(document.querySelector("#chart-ECIO"), optionsECIO);
chartECIO.render();


let optionsRSSI = {
    series: [{
        name: "RSSI",
        data: []
    }],
    chart: {
        id: 'RSSI', type: 'line', height: 350, zoom: {
            autoScaleYaxis: false,
        }, group: 'social',
        animations: {enabled: false},
        toolbar: { show: true },
    },
    annotations: {},
    title: {text: 'RSSI', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: 'RSSI',}, labels: {minWidth: 40}, tickAmount: 6, min: -120, max: -50,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartRSSI = new ApexCharts(document.querySelector("#chart-RSSI"), optionsRSSI);
chartRSSI.render();


let optionsRSRP = {
    series: [{
        name: "RSRP",
        data: []
    }],
    chart: {
        id: 'RSRP', type: 'line', height: 350, width: '100%', zoom: {
            autoScaleYaxis: false,
        }, group: 'social',
        animations: {enabled: false},
        toolbar: { show: true },
    },
    annotations: {},
    title: {text: 'RSRP', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
        tickAmount: 'dataPoints',
        labels: {
            hideOverlappingLabels: false
        }
    },
    yaxis: [
        {title: {text: 'RSRP',}, labels: {minWidth: 40}, tickAmount: 5, min: -130, max: -80,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};
let chartRSRP = new ApexCharts(document.querySelector("#chart-RSRP"), optionsRSRP);
chartRSRP.render();
let optionsRSRQ = {
    series: [{
        name: "RSRQ",
        data: []
    }],
    chart: {
        id: 'RSRQ', type: 'line', height: 350, width: '100%', zoom: {
            autoScaleYaxis: false,
        }, group: 'social',
        animations: {enabled: false},
        toolbar: { show: true },
    },
    annotations: {},
    title: {text: 'RSRQ', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
        tickAmount: 'dataPoints',
        labels: {
            hideOverlappingLabels: false
        }
    },
    yaxis: [
        {title: {text: 'RSRQ',}, labels: {minWidth: 40},tickAmount: 5, min: -20, max: -7,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};
let chartRSRQ = new ApexCharts(document.querySelector("#chart-RSRQ"), optionsRSRQ);
chartRSRQ.render();

let optionsBattery = {
    series: [{
        name: "Battery",
        data: []
    }],
    chart: {
        id: 'Battery', type: 'line', height: 350, zoom: {autoScaleYaxis: false}, group: 'social',
        animations: {enabled: false},
        toolbar: { show: true },
    },
    annotations: {},
    title: {text: 'Battery', align: 'center'},
    dataLabels: {enabled: true},
    markers: {size: 0},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: 'Battery',}, labels: {minWidth: 40}, tickAmount: 4, min: 1, max: 15,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartBattery = new ApexCharts(document.querySelector("#chart-battery"), optionsBattery);
chartBattery.render();

let optionsFTC = {
    series: [{
        name: "Alert Graph",
        data: []
    }],
    chart: {
        id: 'FTC', type: 'line', height: 200, group: 'social',
        animations: {enabled: false},
        toolbar: { show: true },
    },
    stroke: {
        curve: 'stepline',
        colors: '#e6e6e600',
        width: 4,
    },
    annotations: {},
    title: {text: 'Alert Graph', align: 'center'},
    markers: {size: 0,colors: '#e6e6e600',},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
    },
    yaxis: [
        {title: {text: 'Alert Graph',}, labels: {minWidth: 40, style: {colors: ['#ffffff00']}}, tickAmount: 1, min: 0, max: 1,},
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
});
document.querySelector('#one_day').addEventListener('click', function (e) {
    resetCssClasses(e);
    let firstDay = currentDate.setUTCHours(0, 0, 0, 0);
    let lastDay = currentDate.setUTCHours(23, 59, 59, 999);
    console.log(firstDay, "lastDay", lastDay);
    chartECIO.zoomX(new Date(firstDay).getTime(), new Date(lastDay).getTime());
});
document.querySelector('#one_week').addEventListener('click', function (e) {
    resetCssClasses(e);
    let weekFirstDay = new Date().toLocaleDateString();
    let weekLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7).toLocaleDateString();
    console.log(weekFirstDay, "Week", weekLastDay);
    chartECIO.zoomX(new Date(weekLastDay).getTime(), new Date(weekFirstDay).getTime());
});
document.querySelector('#six_months').addEventListener('click', function (e) {
    resetCssClasses(e);
    let makeDate = new Date(currentDate);
    let makeMonthFirstDay = makeDate.setMonth(makeDate.getMonth() - 6);
    let monthFirstDay = new Date(makeMonthFirstDay).toLocaleDateString();
    let monthLastDay = currentDate.toLocaleDateString();
    console.log(monthFirstDay, "monthLastDay", monthLastDay);
    chartECIO.zoomX(new Date(monthFirstDay).getTime(), new Date(monthLastDay).getTime());
});
document.querySelector('#one_year').addEventListener('click', function (e) {
    resetCssClasses(e);
    let makeDate = new Date(currentDate);
    let makeYearFirstDay = makeDate.setMonth(makeDate.getMonth() - 12);
    let yearFirstDay = new Date(makeYearFirstDay).toLocaleDateString();
    let yearLastDay = currentDate.toLocaleDateString();
    chartECIO.zoomX(new Date(yearFirstDay).getTime(), new Date(yearLastDay).getTime());
});

function getChartList() {
    let data = {
        'call_box_id': selected_call_box_id, 'start_date': selected_start_scale, 'end_date': selected_end_scale
    };
    sendCaseCloudHTTPRequest('message/report/chart', "POST", data, function (result) {
        if (result) {
            let batteryData = result.data.batteryData;
            let alarmData = result.data.alarmData;
            let reportTime = result.data.reportTime;
            let ECIOData = result.data.ECIOData;
            let callBoxesData = result.data.callBoxesData;
            let batteryValueData = [], batteryAlertData = [];
            let RSRPValueData = [], RSRQValueData = [];
            let ECIOValueData = [], rssiValueData = [];
            let failToCheckIn = [], FTCValueData = [];
            $.each(batteryData, function (index, res) {
                if (res.status_code !== '9999') {
                    ECIOValueData.push([res.updated_timestamp, res.ecio]);
                    batteryValueData.push([res.updated_timestamp, res.battery_voltage]);
                    rssiValueData.push([res.updated_timestamp, res.rssi]);
                    if(res.call_box_rsrp !== '') RSRPValueData.push([res.updated_timestamp,res.call_box_rsrp]);
                    if(res.call_box_rsrq !== '') RSRQValueData.push([res.updated_timestamp, res.call_box_rsrq]);
                }
                if (res.status_code === '9999')  FTCValueData.push([res.updated_timestamp, res.ftcvalue])
            });

            if (FTCValueData.length <= 0) FTCValueData.push([1, '0']);
            if (batteryValueData.length <= 0) batteryValueData.push([1, '0']);
            if (ECIOValueData.length <= 0) ECIOValueData.push([1, '0']);
            if (rssiValueData.length <= 0) rssiValueData.push([1, '0']);
            if (RSRPValueData.length <= 0) RSRPValueData.push([1, '0']);
            if (RSRQValueData.length <= 0) RSRQValueData.push([1, '0']);
            ApexCharts.exec('FTC', 'updateSeries', [{data: FTCValueData}], false);
            ApexCharts.exec('Battery', 'updateSeries', [{data: batteryValueData}], false);
            ApexCharts.exec('ECIO', 'updateSeries', [{data: ECIOValueData}], false);
            ApexCharts.exec('RSSI', 'updateSeries', [{data: rssiValueData}], false);
            ApexCharts.exec('RSRP', 'updateSeries', [{data: RSRPValueData}], false);
            ApexCharts.exec('RSRQ', 'updateSeries', [{data: RSRQValueData}], false);

            let ftc_alarm_start_date = [], tilt_start_date = [], battery_start_date = [], audio_start_date = [],
                solar_start_date = [], front_panel_start_date = [], tty_start_date = [],
                front_door_start_date = [], authorized_entry_start_date = [], inner_door_start_date = [],
                excessive_reorders_start_date = [], programming_call_start_date = [], report_alarm_start_at = [];
            let timestamp = new Date(reportTime).getTime();
            $.each(alarmData, function (index, res) {

                if (res.tilt_alarm_start_at) {
                    tilt_start_date.push({
                        x: res.tilt_alarm_start_at, x2: (res.tilt_alarm_end_at === null ? timestamp :res.tilt_alarm_end_at),
                        fillColor: '#ff0300', label: {text: 'tilt', style: {background: '#ff0300', color: '#fff',},},
                    });
                }
                if (res.ftc_alarm_start_at) {
                    ftc_alarm_start_date.push({
                        x: res.ftc_alarm_start_at, x2: (res.ftc_alarm_end_at === null ? timestamp :res.ftc_alarm_end_at),
                        fillColor: '#ff0300', label: {text: 'FTC', style: {background: '#ff0300', color: '#fff',},},
                    });
                }
                if (res.battery_alarm_start_at) {
                    battery_start_date.push({
                        x: res.battery_alarm_start_at, x2: (res.battery_alarm_end_at === null ? timestamp :res.battery_alarm_end_at),
                        fillColor: '#c1ad00', label: {text: 'battery', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.solar_alarm_start_at) {
                    solar_start_date.push({
                        x: res.solar_alarm_start_at, x2: (res.solar_alarm_end_at === null ? timestamp :res.solar_alarm_end_at),
                        fillColor: '#c1ad00', label: {text: 'solar', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.audio_alarm_start_at) {
                    audio_start_date.push({
                        x: res.audio_alarm_start_at, x2: (res.audio_alarm_end_at === null ? timestamp :res.audio_alarm_end_at),
                        fillColor: '#c1ad00', label: {text: 'Audio', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.front_panel_alarm_start_at) {
                    front_panel_start_date.push({
                        x: res.front_panel_alarm_start_at, x2: (res.front_panel_alarm_end_at === null ? timestamp :res.front_panel_alarm_end_at),
                        fillColor: '#c1ad00',
                        label: {text: 'front panel', style: {background: '#c1ad00', color: '#fff',},},
                    });
                }
                if (res.tty_alarm_start_at) {
                    tty_start_date.push({
                        x: res.tty_alarm_start_at, x2: (res.tty_alarm_end_at === null ? timestamp :res.tty_alarm_end_at),
                        fillColor: '#c1ad00', label: {text: 'TTY', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.front_door_alarm_start_at) {
                    front_door_start_date.push({
                        x: res.front_door_alarm_start_at, x2: (res.front_door_alarm_end_at === null ? timestamp :res.front_door_alarm_end_at),
                        fillColor: '#005ec9',
                        label: {text: 'front door', style: {background: '#005ec9', color: '#000',},},
                    });
                }
                if (res.autorized_alarm_start_at) {
                    authorized_entry_start_date.push({
                        x: res.autorized_alarm_start_at, x2: (res.autorized_alarm_end_at === null ? timestamp :res.autorized_alarm_end_at),
                        fillColor: '#005ec9',
                        label: {text: 'authorized', style: {background: '#005ec9', color: '#000',},},
                    });
                }
                if (res.inner_door_alarm_start_at) {
                    inner_door_start_date.push({
                        x: res.inner_door_alarm_start_at, x2: (res.inner_door_alarm_end_at === null ? timestamp :res.inner_door_alarm_end_at),
                        fillColor: '#005ec9',
                        label: {text: 'inner door', style: {background: '#005ec9', color: '#000',},},
                    });
                }
                if (res.excessive_alarm_start_at) {
                    excessive_reorders_start_date.push({
                        x: res.excessive_alarm_start_at, x2: res.excessive_alarm_end_at,
                        fillColor: '#0000FF',
                        label: {text: 'excessive', style: {background: '#0000FF', color: '#fff',},},
                    });
                }
                if (res.programming_alarm_start_at) {
                    programming_call_start_date.push({
                        x: res.programming_alarm_start_at, x2: res.programming_alarm_end_at,
                        fillColor: '#0000FF', label: {text: 'programming', style: {background: '#0000FF', color: '#fff',},},
                    });
                }
            });
            const fn = _.spread(_.union);
            const mergeAlarm = [
                tilt_start_date, battery_start_date, audio_start_date,
                solar_start_date, front_panel_start_date, tty_start_date,
                front_door_start_date, authorized_entry_start_date, inner_door_start_date,
                excessive_reorders_start_date, ftc_alarm_start_date, report_alarm_start_at, programming_call_start_date
            ];
            const allAlarm = fn(mergeAlarm);
            chartFTC.updateOptions({annotations: {xaxis: allAlarm}}, true, false, true);//points: programming_call_start_date
            chartBattery.updateOptions({annotations: {xaxis: allAlarm,
                    yaxis: [
                        {y: 12, y2: 100, borderColor: '#000', fillColor: '#32CD32',},
                        {y: 11, y2: 12, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: 10, y2: 11, borderColor: '#000', fillColor: '#FF7102',},
                        {y: 0, y2: 10, borderColor: '#000', fillColor: '#FF0005',}
                    ]
                }}, false, false, true);
            chartECIO.updateOptions({annotations: {xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -7, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -7, y2: -9, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -9, y2: -15, borderColor: '#000', fillColor: '#FF7102',},
                        {y: -15, y2: -120, borderColor: '#000', fillColor: '#FF0005',},
                    ]}}, false, false, true);
            chartRSSI.updateOptions({annotations: {xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -70, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -70, y2: -85, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -85, y2: -100, borderColor: '#000', fillColor: '#FF7102',},
                        {y: -100, y2: -110, borderColor: '#000', fillColor: '#FF0005',},
                        {y: -110, y2: -200, borderColor: '#000', fillColor: '#720008',}
                    ]}}, false, false, true);
            chartRSRP.updateOptions({annotations: {xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -90, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -90, y2: -105, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -105, y2: -120, borderColor: '#000', fillColor: '#FF7102',},
                        {y: -120, y2: -200, borderColor: '#000', fillColor: '#FF0005',}
                    ]}}, false, false, true);
            chartRSRQ.updateOptions({annotations: {xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -9, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -9, y2: -12, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -12, y2: -110, borderColor: '#000', fillColor: '#FF0005',},
                    ]}}, false, false, true);
            chartFTC.zoomX(new Date(monthFirstDay).getTime(),timestamp);
            if (callBoxesData.call_box_network === '4G') {
                $('#chart-ECIO').css({position: 'fixed',height:'1px',width:'1px'});
                $("#chart-RSRP").css("position", "relative");
                $("#chart-RSRQ").css("position", "relative");
            } else {
                $('#chart-RSRP').css({position: 'fixed'});
                $('#chart-RSRQ').css({position: 'fixed'});
                $("#chart-ECIO").removeAttr("style");
            }
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
    //chartECIO.clearAnnotations();
    //chartBattery.removeAnnotation('annotation');
    if (url_call_box_id) history.back();
    $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
});
