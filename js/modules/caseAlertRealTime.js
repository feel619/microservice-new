let selected_call_box_id = '';

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
                "field": "region_id",
                "operator": "is",
                "value": localStorage.getItem("region_id") ? localStorage.getItem("region_id") : $("select#admin_region_box>option:eq(0)").val()
            },
            {"field": "ani_number", "operator": "is", "value": ""},
            {"field": "sub_status", "operator": "is", "value": ""},
            {
                "field": "region_code",
                "operator": "is",
                "value": localStorage.getItem("region_code") ? localStorage.getItem("region_code") : ""
            }
        ]
    },
    columns = [
        {name: 'one', className: 'dt-control', orderable: false, data: 'id', defaultContent: '', width: "5%"},
        {name: 'two', data: 'id', orderable: true, "width": "10%",},
        {name: 'third', data: 'region_ani', orderable: true, "width": "5%"},
        {name: 'fourth', data: 'ani_number', orderable: true, "width": "5%"},
        {data: 'status_code', orderable: false, "width": "5%"},
        {data: 'sub_status_code', orderable: true, "width": "15%"},
        {name: 'six', data: 'id', orderable: false, "width": "10%"},
        {data: 'alarm_started_at', orderable: true, "width": "15%"},
        {name: 'box_number', data:'box_number',orderable: true, "width": "10%"},
        {name: 'eight', data: 'call_in_time', orderable: false, "width": "5%"},
        {name: 'nine', data: 'description', orderable: false, "width": "35%"},
        {data: 'id', orderable: false, "width": "5%"}
    ],
    columnDefs = [
        {
            "targets": [0],
            "createdCell": function (td, cellData, full) {
                if (full['status_code'] === '9999' || full['cf_status'] === '2') {
                    $(td).removeClass('dt-control');
                }
            },
            render: function () {
                return '';
            }
        }, // Plus sign
        {
            "targets": [1],
            render: function (data, type, full) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (full['cf_status'] === '1') {

                    if (full['type'] === 'primary') {
                        dateTime = full['primary_ftc_time'] != null ? full['primary_ftc_time'] : full['message_updated_at'];
                    } else if (full['type'] === 'secondary') {
                        dateTime = full['secondary_ftc_time'] != null ? full['secondary_ftc_time'] : full['message_updated_at'];
                    } else if (full.p_status === '0') {
                        dateTime = full['call_box_updated_at'] != null ? full['call_box_updated_at'] : full['call_box_created_at'];
                    } else {
                        dateTime = full['message_time'] != null ? full['message_time'] : full['message_updated_at'];
                    }
                } else {
                    dateTime = full['call_box_updated_at'] != null ? full['call_box_updated_at'] : full['call_box_created_at'];
                }
                return convertUTCToTimezone(dateTime, null, timezone);
            }
        }, // Created At
        {
            "targets": [2],
            render: function (region_code, type, full) {
                return full['region_code'] != null ? full['region_code'] : '';
            }
        }, // Region code
        {
            "targets": [3],
            render: function (ani_number, type, full) {
                return ani_number != null ? ani_number : '';
            }
        }, // Ani number
        {
            "targets": [4],
            render: function (status_code, type, full) {
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
        }, // Call box status
        {
            "targets": [5],
            render: function (sub_status_code, type, full) {
                console.log('sub_status_code', sub_status_code, full['ani_number']);
                let status_name = full['status_name'],
                    tooltip = full['tooltip'] != null ? status_name + ' - ' + full['tooltip'] : '',
                    status_html = '',
                    extra_color = full['ftc_clear_on'] === 'actual_ftc' ? 'callBoxStatusListRed' : 'callBoxStatusListGray',
                    actual_color = 'callBoxStatusList' + full['color'];

                if (sub_status_code === '9999') {
                    status_name = full['status_name'] + ' (FTC)'
                }
                if (sub_status_code === '0002') {
                    status_name = messageTTYAlarm[full['TLMD']['tty_status_code']]
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
                                status_html += '<div title="' + value['status_name'] + ' - ' + value['tooltip'] + '" class="callBoxStatusList' + value['color'] + '">' + value['status_name'] + '</div>';
                            });
                        }
                    }
                } else {
                    status_html = '<div title="' + tooltip + '" class="d-block ' + actual_color + '">' + status_name + '</div>';
                }
                return full.cf_status === '1' ? (full.p_status !== '0') ? status_html : 'Inactive' : 'Inactive';
            }
        }, // Sub status with color and tooltip
        {
            "targets": [6],
            render: function (alarm_started_at, type, full) {
                let htmlIndication = '';
                if (full.status_code === '9999' && full['cf_status'] === '1') {
                    if (full.indication) {
                        let conditionRSSI = ((full.indication.rssi_level === 'callBoxStatusListYellow' || full.indication.rssi_level === 'callBoxStatusListRed') ? 'Low' : '');
                        let conditionECIO = ((full.indication.ecio_level === 'callBoxStatusListYellow' || full.indication.ecio_level === 'callBoxStatusListRed') ? 'Low' : '');
                        htmlIndication += '<div  class="d-block" >Tech "' + (full.indication.call_box_network !== null ? full.indication.call_box_network : "") + '",APN="' + (full.indication.apn !== null ? full.indication.apn : "") + '", FW Rel "' + (full.indication.filename !== null ? full.indication.filename : "") + '"</div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.battery_alarm === 1 ? "Low Battery" : "") + '</div>';
                        if (full.indication.call_box_rssi !== null) htmlIndication += '<div  class="d-block" ><span  class="' + full.indication.rssi_level + '" >' + (full.indication.call_box_rssi !== '' ? conditionRSSI + " RSSI " + full.indication.call_box_rssi : "") + '</span>,';
                        if (full.indication.call_box_network === '4G') {
                            if (full.indication.call_box_rsrq !== null) htmlIndication += '<span class="' + full.indication.ecio_level + ' ml-1" >' + (full.indication.call_box_rsrq !== '' ? conditionECIO + " RSRQ " + full.indication.call_box_rsrq : "") + '</span></div>';
                        } else {
                            if (full.indication.call_box_ecio !== null) htmlIndication += '<span class="' + full.indication.ecio_level + ' ml-1" >' + (full.indication.call_box_ecio !== '' ? conditionECIO + " EC/IO " + full.indication.call_box_ecio : "") + '</span></div>';
                        }
                        htmlIndication += '<div  class="d-block" >' + (full.indication.tilt_alarm === 1 ? "Pole Tilt" : "") + '</div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.inner_door_alarm === 1 ? "Technician Visit" : "") + '</div>';
                        htmlIndication += '<div  class="d-block" >' + (full.indication.programming_alarm === 1 ? "Programming Call" : "") + '</div>';
                    }
                    return htmlIndication;
                } else {
                    return htmlIndication;
                }
            }
        }, // indication
        {
            "targets": [7],
            render: function (alarm_started_at, type, full) {
                let current_date = moment(new Date()), duration_html = '';
                if (full['cf_status'] === '1') {
                    if (full['type'] === 'primary') {
                        duration_html = '<div  class="d-block" >' + getDuration(current_date, moment(full['primary_ftc_time'])) + '</div>';
                    } else if (full.type === 'secondary') {
                        duration_html = '<div  class="d-block" >' + getDuration(current_date, moment(full['secondary_ftc_time'])) + '</div>';
                    } else if (full['type'] === 'clear') {
                        full['sub_status'].forEach(function (value, key) {
                            if (full['alarm_started_at'] != null) {
                                duration_html += '<div  class="d-block" >' + getDuration(current_date, moment(full['alarm_started_at'])) + '</div>';
                            } else {
                                duration_html += '<div  class="d-block" ></div>';
                            }
                        });
                    } else {
                        if (alarm_started_at != null) {
                            duration_html = '<div  class="d-block" >' + getDuration(current_date, moment(alarm_started_at)) + '</div>';
                        }
                    }
                }
                return duration_html;
            }
        }, // Duration
        {
            "targets": [8],
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
            "targets": [9],
            render: function (call_in_time, type, full) {
                if (call_in_time != null) {
                    if (full['timezone'] != null) {
                        let time = moment(moment().format('YYYY-MM-DD') + ' ' + call_in_time).format('YYYY-MM-DD HH:mm:ss');
                        return moment.utc(time, null).tz(full['timezone']).format('hh:mm:ss A z');
                    } else {
                        return call_in_time;
                    }
                } else {
                    return '';
                }
            }
        }, // Call in time
        {
            "targets": [10],
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
        }, // Description
        {
            "targets": [11],
            render: function (data, type, full) {
                let regionCode = full['region_code'] ? full['region_code'] : '', edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="Call Box Failure Analysis Graph" class="btn white-color btn-sm btn-primary" onclick="viewCaseAlert(\'' + full['ani_number'] + '\',\'' + regionCode + '\',\'' + full['call_box_id'] + '\')"><i class="fa fa-bar-chart "></i></a>';
                edit_html += '<a data-toggle="tooltip" title="Knightscope Alerts Detail History Graph" class="btn ml-1 white-color btn-sm btn-primary" href="caseAlertClassic.html?ani=' + full['ani_number'] + '&region=' + regionCode + '&id=' + full['call_box_id'] + '" ><i class="fa fa-line-chart"></i></a>';
                edit_html += '<a data-toggle="tooltip" title="edit" class="btn ml-1 white-color btn-sm btn-primary"  href="callbox.html?id=' + full['call_box_id'] + '"><i class="fa fa-edit"></i></a>';
                return edit_html;
            }
        } // Action
    ],
    createdRow = function (row, data, dataIndex) {
        /* if (data['is_test']) {
             $(row).css("background-color", "rgb(255 251 240)");
         }*/
    },
    order = [],
    dataHighTable = callCaseAlertDataTable('call_box_high_status_table', 'liveMessage/tableList', filters, columns, loadMoreData, columnDefs, order, createdRow);

getAlertList();

function ReloadCallBoxHighStatusTable() {
    let regionCode = $("#admin_region_box").find('option:selected').attr("data-code");
    let regionId = $("#admin_region_box").find('option:selected').val();
    filters.searchList[0]['value'] = regionId ? regionId : '';
    filters.searchList[1]['value'] = $('#fx_ani').val() ? $('#fx_ani').val() : "";
    filters.searchList[2]['value'] = $('#fx_alert_box').val() ? $('#fx_alert_box').val() : "";
    filters.searchList[3]['value'] = regionCode ? regionCode : '';
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
    //let totalCallBox =
    console.log(total, "total");
    let totalAlarm = parseInt(total['active']);
    let totalInactive = parseInt(total['inactive']);
    let totalTest = parseInt(total['test']);
    let TotalCallBoxes = totalAlarm + totalInactive;
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
    let percentageTest = isNaN((totalTest * 100 / TotalCallBoxes)) ? 0 : (totalTest * 100 / TotalCallBoxes).toFixed(2);
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

    let callBoxStatusBlueHtml = (isNaN(totalBlueAlarm) ? 0 : totalBlueAlarm) + ' of ' + totalAlarm + ' (' + percentageBlue + '%)  Operational';
    let callBoxStatusLightBlueHtml = (isNaN(totalLightBlueAlarm) ? 0 : totalLightBlueAlarm) + ' of ' + totalAlarm + ' (' + percentageLightBlue + '%)  Informational';
    let callBoxStatusRedHtml = (isNaN(totalRedAlarm) ? 0 : totalRedAlarm) + ' of ' + totalAlarm + ' (' + percentageRed + '%) Service Required';
    let callBoxStatusYellowHtml = (isNaN(totalYellowAlarm) ? 0 : totalYellowAlarm) + ' of ' + totalAlarm + ' (' + percentageYellow + '%)  Degraded Operations';
    let callBoxTotalHtml = 'Total Call Boxes ' + TotalCallBoxes + ' (' + totalAlarm + ' Active + ' + totalInactive + ' Inactive';
    callBoxTotalHtml += totalTest > 0 ? ' + ' + totalTest + ' Test)' : ')';
    let FailedToCheckinHtml = totalInactive + ' of ' + TotalCallBoxes + ' (' + percentageFailed + '%) Inactive/Bagged';
    let TestHtml = totalTest + ' of ' + TotalCallBoxes + ' (' + percentageTest + '%) Test';
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
    let AStotalTiltAlarm = (isNaN(totalTiltAlarm) ? 0 : totalTiltAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalTiltAlarm + '%) Tilt Alarm';
    let AStotalControllerBITAlarm = (isNaN(totalControllerBITAlarm) ? 0 : totalControllerBITAlarm) + ' of ' + totalAlarm + ' (' + percentageAStotalControllerBITAlarm + '%) TTY Alarm';
    let AStotalAuthorizedEntry = (isNaN(totalAuthorizedEntry) ? 0 : totalAuthorizedEntry) + ' of ' + totalAlarm + ' (' + percentageAStotalAuthorizedEntry + '%) Authorized Entry';
    let AStotalExcessiveReorders = (isNaN(totalExcessiveReorders) ? 0 : totalExcessiveReorders) + ' of ' + totalAlarm + ' (' + percentageAStotalExcessiveReorders + '%) Excessive Reorders';

    let tooltipData = rowsData.tooltipData;
    let tooltipPrimary = 'Primary FTC - ' + ftcToolTip['primary'];
    let tooltipSecondary = 'Secondary FTC - ' + ftcToolTip['secondary'];

    $('#callBoxStatusListTotal').prepend(callBoxTotalHtml);
    $('#callBoxStatusListBlueTotal').prepend(callBoxStatusBlueHtml);
    $('#callBoxStatusListLightBlueTotal').html(callBoxStatusLightBlueHtml);
    $('#callBoxStatusListRedTotal').prepend(callBoxStatusRedHtml);
    $('#callBoxStatusListYellowTotal').prepend(callBoxStatusYellowHtml);
    $('#totalFailedToCheckin').html(FailedToCheckinHtml);
    if (totalTest > 0) {
        $('#totalTest').html(TestHtml);
    }
    $('#AlertStatisticsRed').prepend(AlertStatisticsRed).attr('title', tooltipData['9999']);
    $('#AlertSecondaryFTCRed').prepend(AlertSecondaryFTCRed).attr('title', tooltipSecondary);
    $('#AlertPrimaryFTCRed').prepend(AlertPrimaryFTCRed).attr('title', tooltipPrimary);
    $('#AlertStatisticsVoiceAlarm').prepend(ASVoiceAlarm).attr('title', tooltipData['0040']);
    $('#AlertStatisticsFrontDoorAlarm').prepend(ASFrontDoorAlarm).attr('title', tooltipData['0200']);
    $('#AStotalBatteryAlarm').prepend(AStotalBatteryAlarm).attr('title', tooltipData['0100']);
    $('#AStotalFrontPanelLampAlarm').prepend(AStotalFrontPanelLampAlarm).attr('title', tooltipData['0004']);
    $('#AStotalSolarAlarm').prepend(AStotalSolarAlarm).attr('title', tooltipData['0010']);
    $('#AStotalReportCall').prepend(AStotalReportCall);
    $('#AStotalInnerDoorAlarm').prepend(AStotalInnerDoorAlarm).attr('title', tooltipData['0001']);
    //$('#AStotalBaggedTest').prepend(AStotalBaggedTest);
    $('#AStotalProgrammingCall').prepend(AStotalProgrammingCall);
    $('#AStotalTiltAlarm').prepend(AStotalTiltAlarm).attr('title', tooltipData['0020']);
    $('#AStotalControllerBITAlarm').prepend(AStotalControllerBITAlarm).attr('title', tooltipData['0002']);
    $('#AStotalAuthorizedEntry').prepend(AStotalAuthorizedEntry).attr('title', tooltipData['4000']);
    $('#AStotalExcessiveReorders').prepend(AStotalExcessiveReorders);
};

const sendLiveStatusMessage = (ResponseData) => {
    console.log("updateLiveCallBoxStatusResponseData", ResponseData);
    // ReloadCallBoxHighStatusTable();
};

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadCallBoxHighStatusTable();
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
                if ((rowArray['sub_status_code'] === '9999' && rowArray['cf_status'] === '1') && rowArray.indication) {
                    let conditionRSSI = ((rowArray.indication.rssi_level === 'callBoxStatusListYellow' || rowArray.indication.rssi_level === 'callBoxStatusListRed') ? 'Low' : '');
                    let conditionECIO = ((rowArray.indication.ecio_level === 'callBoxStatusListYellow' || rowArray.indication.ecio_level === 'callBoxStatusListRed') ? 'Low' : '');
                    htmlIndication += 'Tech=' + (rowArray['indication'].call_box_network !== null ? rowArray['indication'].call_box_network : 'null') + ' APN=' + (rowArray['indication'].apn !== null ? rowArray['indication'].apn : 'null') + ' FW Rel=' + (rowArray['indication'].filename !== null ? rowArray['indication'].filename : 'null') + ' ';
                    htmlIndication += (rowArray['indication']['battery_alarm'] === 1 ? "Low Battery" : "") + ' ';
                    if (rowArray.indication.call_box_rssi !== null) htmlIndication += (rowArray.indication.call_box_rssi !== '' ? conditionRSSI + " RSSI " + rowArray.indication.call_box_rssi : "") + ', ';
                    if (rowArray.indication.call_box_network === '4G') {
                        if (rowArray.indication.call_box_rsrq !== null) htmlIndication += (rowArray.indication.call_box_rsrq !== '' ? conditionECIO + " RSRQ " + rowArray.indication.call_box_rsrq : "");
                    } else {
                        if (rowArray.indication.call_box_ecio !== null) htmlIndication += (rowArray.indication.call_box_ecio !== '' ? conditionECIO + " EC/IO " + rowArray.indication.call_box_ecio : "");
                    }
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
            let alert_box = '<option value="">All</option>';
            $.each(ResponseData, function (index, value) {
                if (value.name !== '9998') alert_box += '<option value="' + value.name + '">' + value.meta_type + '</option>';
            });
            $('#fx_alert_box').html(alert_box);
        }
    });
}

let optionsFTC = {
    series: [{
        name: "Alert Graph",
        data: []
    }],
    chart: {
        id: 'FTC', type: 'line', height: 200, group: 'social', width: '100%',
        animations: {enabled: false},
        toolbar: {show: true},
    },
    stroke: {
        curve: 'stepline',
        colors: '#e6e6e600',
        width: 4,
    },
    annotations: {},
    title: {text: 'Alert Graph', align: 'center'},
    markers: {size: 0, colors: '#e6e6e600',},
    xaxis: {
        type: 'datetime', min: new Date(monthFirstDay).getTime(), max: new Date(todayYear).getTime(),
        tickAmount: 'dataPoints',
        labels: {
            hideOverlappingLabels: false
        }
    },
    yaxis: [
        {
            title: {text: 'Alert Graph',},
            labels: {minWidth: 40, style: {colors: ['#ffffff00']}},
            tickAmount: 1,
            min: 0,
            max: 1,
        },
        // {opposite: true, title: {text: 'Alert Graph',}, labels: {minWidth: 40, style: {colors: ['#ffffff00']}},},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartFTC = new ApexCharts(document.querySelector("#chart-FTC"), optionsFTC);
chartFTC.render();

let optionsBattery = {
    series: [{
        name: "Battery",
        data: []
    }],
    chart: {
        id: 'Battery', type: 'line', height: 350, zoom: {autoScaleYaxis: false}, group: 'social', width: '100%',
        animations: {enabled: false},
        toolbar: {show: true},
    },
    annotations: {},
    title: {text: 'Battery', align: 'center'},
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
        {title: {text: 'Battery',}, labels: {minWidth: 40}, tickAmount: 4, min: 1, max: 15,},
        // {opposite: true, title: {text: 'Battery',}, labels: {minWidth: 40, style: {colors: ['#ffffff00']}},},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};

let chartBattery = new ApexCharts(document.querySelector("#chart-battery"), optionsBattery);
chartBattery.render();

let optionsRSSI = {
    series: [{
        name: "RSSI",
        data: []
    }],
    chart: {
        id: 'RSSI', type: 'line', height: 350, width: '100%', zoom: {
            autoScaleYaxis: false,
        }, group: 'social',
        animations: {enabled: false},
        toolbar: {show: true},
    },
    annotations: {},
    title: {text: 'RSSI', align: 'center'},
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
        {title: {text: 'RSSI',}, labels: {minWidth: 40}, tickAmount: 6, min: -120, max: -50,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};
let chartRSSI = new ApexCharts(document.querySelector("#chart-RSSI"), optionsRSSI);
chartRSSI.render();

let optionsECIO = {
    series: [{
        name: "ECIO",
        data: []
    }],
    chart: {
        id: 'ECIO', type: 'line', height: 350, width: '100%', zoom: {
            autoScaleYaxis: false,
        }, group: 'social',
        animations: {enabled: false},
        toolbar: {show: true},
    },
    annotations: {},
    title: {text: 'ECIO', align: 'center'},
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
        {title: {text: 'ECIO',}, labels: {minWidth: 40}, tickAmount: 4, min: -20, max: 0,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};
let chartECIO = new ApexCharts(document.querySelector("#chart-ECIO"), optionsECIO);
chartECIO.render();

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
        toolbar: {show: true,},
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
        {title: {text: 'RSRP',}, labels: {minWidth: 40,}, tickAmount: 5, min: -130, max: -80,},
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
        toolbar: {show: true},
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
        {title: {text: 'RSRQ',}, labels: {minWidth: 40}, tickAmount: 5, min: -20, max: -7,},
    ],
    tooltip: {
        x: {format: 'dd MMM yyyy HH:mm:ss'}
    },
};
let chartRSRQ = new ApexCharts(document.querySelector("#chart-RSRQ"), optionsRSRQ);
chartRSRQ.render();


var resetCssClasses = function (activeEl) {
    var els = document.querySelectorAll('.btn-chart');
    Array.prototype.forEach.call(els, function (el) {
        el.classList.remove('active')
    });
    activeEl.target.classList.add('active')
};

document.querySelector('#one_month').addEventListener('click', function (e) {
    resetCssClasses(e);
    chartBattery.zoomX(new Date(monthFirstDay).getTime(), new Date(todayYear).getTime());
});
document.querySelector('#one_day').addEventListener('click', function (e) {
    resetCssClasses(e);
    let firstDay = currentDate.setUTCHours(0, 0, 0, 0);
    let lastDay = currentDate.setUTCHours(23, 59, 59, 999);
    chartBattery.zoomX(new Date(firstDay).getTime(), new Date(lastDay).getTime());
});
document.querySelector('#one_week').addEventListener('click', function (e) {
    resetCssClasses(e);
    let weekFirstDay = new Date().toLocaleDateString();
    let weekLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7).toLocaleDateString();
    chartBattery.zoomX(new Date(weekLastDay).getTime(), new Date(weekFirstDay).getTime());
});
document.querySelector('#six_months').addEventListener('click', function (e) {
    resetCssClasses(e);
    let makeDate = new Date(currentDate);
    let makeMonthFirstDay = makeDate.setMonth(makeDate.getMonth() - 6);
    let monthFirstDay = new Date(makeMonthFirstDay).toLocaleDateString();
    let monthLastDay = currentDate.toLocaleDateString();
    chartBattery.zoomX(new Date(monthFirstDay).getTime(), new Date(monthLastDay).getTime());
});
document.querySelector('#one_year').addEventListener('click', function (e) {
    resetCssClasses(e);
    let makeDate = new Date(currentDate);
    let makeYearFirstDay = makeDate.setMonth(makeDate.getMonth() - 12);
    let yearFirstDay = new Date(makeYearFirstDay).toLocaleDateString();
    let yearLastDay = currentDate.toLocaleDateString();
    chartBattery.zoomX(new Date(yearFirstDay).getTime(), new Date(yearLastDay).getTime());
});

function getChartList() {
    let data = {
        'call_box_id': selected_call_box_id, 'start_date': selected_start_scale, 'end_date': selected_end_scale
    };
    sendCaseCloudHTTPRequest('message/live/chart', "POST", data, function (result) {
        if (result) {
            let batteryData = result.data.batteryData;
            let alarmData = result.data.alarmData;
            let ECIOData = result.data.ECIOData;
            let callBoxesData = result.data.callBoxesData;
            let batteryValueData = [], batteryAlertData = [];
            let ECIOValueData = [], rssiValueData = [];
            let RSRPValueData = [], RSRQValueData = [];
            let failToCheckIn = [], FTCValueData = [];
            $.each(batteryData, function (index, res) {
                if (res.status_code !== '9999') {
                    ECIOValueData.push([res.updated_timestamp, res.call_box_ecio]);
                    batteryValueData.push([res.updated_timestamp, res.battery_voltage]);
                    rssiValueData.push([res.updated_timestamp, res.call_box_rssi]);
                    if (res.call_box_rsrp !== '') RSRPValueData.push([res.updated_timestamp, res.call_box_rsrp]);
                    if (res.call_box_rsrq !== '') RSRQValueData.push([res.updated_timestamp, res.call_box_rsrq]);
                }
                if (res.status_code === '9999') FTCValueData.push([res.updated_timestamp, res.ftcvalue])
            });

            if (FTCValueData.length <= 0) FTCValueData.push([1, '0']);
            if (batteryValueData.length <= 0) batteryValueData.push([1, '0']);
            if (ECIOValueData.length <= 0) ECIOValueData.push([1, '0']);
            if (rssiValueData.length <= 0) rssiValueData.push([1, '0']);
            if (RSRPValueData.length <= 0) RSRPValueData.push([1, '0']);
            if (RSRQValueData.length <= 0) RSRQValueData.push([1, '0']);

            ApexCharts.exec('FTC', 'updateSeries', [{data: FTCValueData}], false);
            ApexCharts.exec('Battery', 'updateSeries', [{data: batteryValueData}], false);
            ApexCharts.exec('RSSI', 'updateSeries', [{data: rssiValueData}], false);
            ApexCharts.exec('ECIO', 'updateSeries', [{data: ECIOValueData}], false);
            ApexCharts.exec('RSRP', 'updateSeries', [{data: RSRPValueData}], false);
            ApexCharts.exec('RSRQ', 'updateSeries', [{data: RSRQValueData}], false);

            let ftc_alarm_start_date = [], tilt_start_date = [], battery_start_date = [], audio_start_date = [],
                solar_start_date = [], front_panel_start_date = [], tty_start_date = [],
                front_door_start_date = [], authorized_entry_start_date = [], inner_door_start_date = [],
                excessive_reorders_start_date = [], programming_call_start_date = [], report_alarm_start_at = [];
            let timestamp = new Date().getTime();
            $.each(alarmData, function (index, res) {

                if (res.tilt_alarm_start_at) {
                    tilt_start_date.push({
                        x: res.tilt_alarm_start_at,
                        x2: (res.tilt_alarm_end_at === null ? timestamp : res.tilt_alarm_end_at),
                        fillColor: '#ff0300',
                        label: {text: 'tilt', style: {background: '#ff0300', color: '#fff',},},
                    });
                }
                if (res.ftc_alarm_start_at) {
                    ftc_alarm_start_date.push({
                        x: res.ftc_alarm_start_at,
                        x2: (res.ftc_alarm_end_at === null ? timestamp : res.ftc_alarm_end_at),
                        fillColor: '#ff0300',
                        label: {text: 'FTC', style: {background: '#ff0300', color: '#fff',},},
                    });
                }
                if (res.battery_alarm_start_at) {
                    battery_start_date.push({
                        x: res.battery_alarm_start_at,
                        x2: (res.battery_alarm_end_at === null ? timestamp : res.battery_alarm_end_at),
                        fillColor: '#c1ad00',
                        label: {text: 'battery', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.solar_alarm_start_at) {
                    solar_start_date.push({
                        x: res.solar_alarm_start_at,
                        x2: (res.solar_alarm_end_at === null ? timestamp : res.solar_alarm_end_at),
                        fillColor: '#c1ad00',
                        label: {text: 'solar', style: {background: '#c1ad00', color: '#000',},},
                    });
                }
                if (res.programming_alarm_start_at) {
                    programming_call_start_date.push({
                        x: res.programming_alarm_start_at,
                        x2: res.programming_alarm_end_at,
                        fillColor: '#0000FF',
                        label: {text: 'programming', style: {background: '#0000FF', color: '#fff',},},
                    });
                }
            });
            const fn = _.spread(_.union);
            const mergeAlarm = [
                tilt_start_date, battery_start_date,
                solar_start_date, ftc_alarm_start_date, programming_call_start_date
            ];
            const allAlarm = fn(mergeAlarm);
            chartFTC.updateOptions({annotations: {xaxis: allAlarm,}}, true, false, true);//points: programming_call_start_date
            chartBattery.updateOptions({
                annotations: {
                    xaxis: allAlarm,
                    yaxis: [
                        {y: 12, y2: 100, borderColor: '#000', fillColor: '#32CD32',},
                        {y: 11, y2: 12, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: 10, y2: 11, borderColor: '#000', fillColor: '#FF7102',},
                        {y: 0, y2: 10, borderColor: '#000', fillColor: '#FF0005',}
                    ]
                }
            }, false, false, true);
            chartRSSI.updateOptions({
                annotations: {
                    xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -70, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -70, y2: -85, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -85, y2: -100, borderColor: '#000', fillColor: '#FF7102',},
                        {y: -100, y2: -110, borderColor: '#000', fillColor: '#FF0005',},
                        {y: -110, y2: -200, borderColor: '#000', fillColor: '#720008',}
                    ]
                }
            }, false, false, true);
            chartRSRP.updateOptions({
                chart: {group: "social"},
                annotations: {
                    xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -90, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -90, y2: -105, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -105, y2: -120, borderColor: '#000', fillColor: '#FF7102',},
                        {y: -120, y2: -200, borderColor: '#000', fillColor: '#FF0005',}
                    ]
                }
            }, false, false, true);
            chartECIO.updateOptions({
                annotations: {
                    xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -7, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -7, y2: -9, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -9, y2: -15, borderColor: '#000', fillColor: '#FF7102',},
                        {y: -15, y2: -120, borderColor: '#000', fillColor: '#FF0005',},
                    ]
                }
            }, false, false, true);
            chartRSRQ.updateOptions({
                annotations: {
                    xaxis: allAlarm, yaxis: [
                        {y: 0, y2: -9, borderColor: '#000', fillColor: '#32CD32',},
                        {y: -9, y2: -12, borderColor: '#000', fillColor: '#c1ad00',},
                        {y: -12, y2: -110, borderColor: '#000', fillColor: '#FF0005',},
                    ]
                }
            }, false, false, true);
            chartFTC.zoomX(new Date(monthFirstDay).getTime(), new Date(selected_end_scale).getTime());
            if (callBoxesData.call_box_network === '4G') {
                $('#chart-ECIO').css({position: 'fixed', height: '1px', width: '1px'});
                $("#chart-RSRP").css("position", "relative");
                $("#chart-RSRQ").css("position", "relative");
                // position:fixed !important;height:1px !important;width:1px !important; bottom:0 !important;left:0 !important;z-index:-999 !important;display:inline !important;
            } else {
                $('#chart-RSRP').css({position: 'fixed'});
                $('#chart-RSRQ').css({position: 'fixed'});
                $("#chart-ECIO").removeAttr("style");
            }
        }
    });
}

var realTimeSpan = document.getElementById('realTime');

function time() {
    const current_date = moment(new Date()).format('DD-MM-YYYY');
    var d = new Date();
    var s = d.getSeconds();
    var m = d.getMinutes();
    var h = d.getHours();
    const localTimeZone = moment.tz.guess();
    //const localTimeZone = moment(new Date()).format('z');
    //let zone = moment.tz(localTimeZone).format("Z z");
    //let zoneAbbr = moment.tz(localTimeZone).zoneAbbr();
    let zoneName = moment.tz(localTimeZone).zoneName();
    //console.log(zone,"localTimeZone",zoneAbbr,zoneName);
    realTimeSpan.textContent = current_date + " " + ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2) + " " + zoneName;
}

setInterval(time, 1000);

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

