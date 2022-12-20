$('.cancelBtn, .backBtn').click(function () {
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});
$('#fx_created_at').daterangepicker({
    autoUpdateInput: false,
    drops: 'auto',
    timePicker: false,
    locale: {
        cancelLabel: 'Clear',
        format: 'YYYY-MM-DD h:mm A'
    },
    //startDate: startDate,
    //minDate: currentTime,
    maxDate: new Date()
});
$('#fx_created_at').on('apply.daterangepicker', function (ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    ReloadCallBoxStatusTable();
});
$('#fx_created_at').on('cancel.daterangepicker', function (ev, picker) {
    $(this).val('');
    ReloadCallBoxStatusTable();
});
let filters = {
        searchList: [
            {
                "field": "region",
                "operator": "is",
                "value": ""
            },
            {
                "field": "ani",
                "operator": "is",
                "value": ""
            },
            {
                "field": "status_code",
                "operator": "contains",
                "value": ""
            },
            {
                "field": "createdAt",
                "operator": "sdate",
                "value": ""
            },
            {
                "field": "createdAt",
                "operator": "edate",
                "value": ""
            }
        ]
    },
    columns = [
        /* {data: 'id', orderable: true},*/
        {
            "className": 'dt-control',
            "orderable": false,
            "data": null,
            "defaultContent": ''
        },
        {data: 'createdAt', orderable: true},
        {data: 'region', orderable: true},
        {data: 'ani', orderable: true},
        {data: 'status_code', orderable: true},
        {data: 'call_box_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [1],
            "visible": (localStorage.getItem('user_type') === 'admin'),
            render: function (data, type, full, meta) {
                let dateTime = full.createdAt;
                return moment(dateTime).format('DD-MM-YYYY HH:MM:SS');
            }
        },
        {
            "targets": [5],
            "visible": (localStorage.getItem('user_type') === 'admin'),
            render: function (data, type, full, meta) {
                let call_box = '';
                let messages_data = full.messages_data;
                call_box += '<div class="region_list text-cvs-wrap">';
                messages_data.forEach(function (value, index, array) {
                    let aniMetaData = value.ani_meta_data;
                    let ani_meta_info = aniMetaData.ani_meta_info;
                    call_box += '<div class="">' + aniMetaData.meta_type + '</div>';
                });
                call_box += '</div>';
                return call_box;
            }
        },
        {
            "targets": [6],
            "visible": (localStorage.getItem('user_type') === 'admin'),
            render: function (data, type, full, meta) {
                let edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="view" class="btn white-color btn-sm btn-primary" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-eye"></i></a>';
                return edit_html;
            }
        }
    ],
    order = [1, 'desc'],
    dataTable = callCaseCloudDataTable('call_box_status_table', 'listing/message', filters, columns, '', columnDefs, order);

function ReloadCallBoxStatusTable() {
    //let createdAt = $('#fx_created_at').val().split(' - ');
    filters.searchList[0]['value'] = $('#fx_region').val() ? $('#fx_region').val() : "";
    filters.searchList[1]['value'] = $('#fx_ani').val() ? $('#fx_ani').val() : "";
    filters.searchList[2]['value'] = $('#fx_status_code').val() ? $('#fx_status_code').val() : "";
    //filters.searchList[3]['value'] = createdAt[0] ? moment(createdAt[0]).format('YYYY-MM-DD') : "";
    //filters.searchList[4]['value'] = createdAt[1] ? moment(createdAt[1]).format('YYYY-MM-DD') : "";
    $('#call_box_status_table').DataTable().ajax.reload(null, false);
}

$('#call_box_status_table').on( 'draw.dt', function () {
    countingAlarms();
});

const countingAlarms = () => {
    let rowsData =  $('#call_box_status_table').DataTable().ajax.json();
    $('#regionName').html(filters.searchList[0]['value'] ? filters.searchList[0]['value'] :'All');
    $('#TotalStatus').html(rowsData.alarmCounting[0]['TotalCount']);
    $('#totalRed').html(rowsData.alarmCounting[0]['RedColor']);
    $('#totalYellow').html(rowsData.alarmCounting[0]['YellowColor']);
    $('#totalBlue').html(rowsData.alarmCounting[0]['BlueColor']);
};

const sendLiveStatusMessage = (ResponseData) => {
    // console.log("updateLiveCallBoxStatusResponseData", ResponseData);
    // ReloadCallBoxStatusTable();
};

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadCallBoxStatusTable();
});

$('#call_box_status_table tbody').on('click', 'td.dt-control', function () {
    let tr = $(this).closest('tr');
    let table = $('#call_box_status_table').DataTable();
    let row = table.row(tr);
    if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
    } else {
        row.child(format(row.data())).show();
        tr.addClass('shown');
    }
});

function format(messageData) {
    let logInfoHtml = '';
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
            '<tr>' +
            '<td>signal dbm:</td>' +
            '<td>' + messageData.signal_dbm + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>rssi:</td>' +
            '<td>' + messageData.rssi + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>cb cam:</td>' +
            '<td>' + messageData.cb_cam + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>cb vid:</td>' +
            '<td>' + messageData.cb_vid + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>own ip:</td>' +
            '<td>' + messageData.own_ip + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>temp c:</td>' +
            '<td>' + messageData.temp_c + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>sig qual:</td>' +
            '<td>' + messageData.sig_qual + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>sig pwr:</td>' +
            '<td>' + messageData.sig_pwr + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>time:</td>' +
            '<td>' + messageData.time + '</td>' +
            '</tr>' +
            '</table>' +
            '</div>' +
            '<div class="col-lg-4">' +
            '<table cellpadding="5" cellspacing="0" border="0" style="width: 100%;">' +
            '<tr>' +
            '<td>ani:</td>' +
            '<td><a href="callbox.html?ani='+messageData.ani+'&region='+messageData.region+'" >' + messageData.ani + '</a></td>' +
            '</tr>' +
            '<tr>' +
            '<td>battery voltage:</td>' +
            '<td>' + messageData.battery_voltage + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>signal dbm:</td>' +
            '<td>' + messageData.signal_dbm + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>tty status:</td>' +
            '<td>' + messageData.tty_status + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>status code:</td>' +
            '<td>' + messageData.status_code + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>lat:</td>' +
            '<td>' + messageData.lat + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>long:</td>' +
            '<td>' + messageData.long + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>phone:</td>' +
            '<td>' + messageData.phone + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>tty rev:</td>' +
            '<td>' + messageData.tty_rev + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>mcu:</td>' +
            '<td>' + messageData.mcu + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>rat:</td>' +
            '<td>' + messageData.rat + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>status:</td>' +
            '<td>';
        messageData.messages_data.forEach(function (value,key) {
            let aniMetaData = value.ani_meta_data;
            logInfoHtml += '<div class="">' + aniMetaData.meta_type + '</div>';
        });
        logInfoHtml+= '</td>' +
            '</tr>' +
            '</table>' +
            '</div>' +
            '<div class="col-lg-4">\n' +
            '<table cellpadding="5" cellspacing="0" border="0" style="width: 100%;">' +
            '<tr>' +
            '<td>call count:</td>' +
            '<td>' + messageData.call_count + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>call sec:</td>' +
            '<td>' + messageData.call_sec + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>call min:</td>' +
            '<td>' + messageData.call_min + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>signal rssi:</td>' +
            '<td>' + messageData.signal_rssi + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>system configuration:</td>' +
            '<td>' + messageData.system_configuration + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>configuration first:</td>' +
            '<td>' + messageData.configuration_first + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>configuration second:</td>' +
            '<td>' + messageData.configuration_second + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>firmware rev:</td>' +
            '<td>' + messageData.firmware_rev + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>radio handler rev:</td>' +
            '<td>' + messageData.radio_handler_rev + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>radio type:</td>' +
            '<td>' + messageData.radio_type + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>aurora boot rev:</td>' +
            '<td>' + messageData.aurora_boot_rev + '</td>' +
            '</tr>' +
            '<tr>' +
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
    ReloadCallBoxStatusTable();
});

sendCaseCloudHTTPRequest("message/list/region", 'GET', "", function (result) {
    if (result.data) {
        let region_list = result.data;
        let region_box = '<option value="">All</option>';
        region_list.forEach(function (value, index, array) {
            let region = value['region'];
            region_box += '<option value="' + region + '">' + region + '</option>';
        });
        $('#fx_region').html(region_box);
    }
});
sendCaseCloudHTTPRequest("message/list/ani", 'GET', "", function (result) {
    if (result.data) {
        let ani_list = result.data;
        let ani_box = '<option value="">All</option>';
        ani_list.forEach(function (value, index, array) {
            let ani = value['ani'];
            ani_box += '<option value="' + ani + '">' + ani + '</option>';
        });
        $('#fx_ani').html(ani_box);
    }
});

function update_btn(id) {
    sendCaseCloudHTTPRequest("message/" + id, 'GET', "", function (result) {
        if (result.data) {
            let ResponseData = result.data;
            console.log(ResponseData);
            $('.f-add').css('display', 'block');
            $('.f-app').hide();

            let viewDetails = '<tr>' +
                '<th scope="row">ANI</th>' +
                '<td>' + ResponseData.ani + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">region</th>' +
                '<td>' + ResponseData.region + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">battery voltage</th>' +
                '<td>' + ResponseData.battery_voltage + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">call count</th>' +
                '<td>' + ResponseData.call_count + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">call min</th>' +
                '<td>' + ResponseData.call_min + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">call sec</th>' +
                '<td>' + ResponseData.call_sec + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">ecio</th>' +
                '<td>' + ResponseData.ecio + '</td>' +
                '</tr>' +
                '<tr>' +
                '<tr>' +
                '<th scope="row">rssi</th>' +
                '<td>' + ResponseData.rssi + '</td>' +
                '</tr>' +
                '<tr>' +
                '<tr>' +
                '<th scope="row">signal dbm</th>' +
                '<td>' + ResponseData.signal_dbm + '</td>' +
                '</tr>' +
                '<tr>' +
                '<tr>' +
                '<th scope="row">signal rssi</th>' +
                '<td>' + ResponseData.signal_rssi + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">time</th>' +
                '<td>' + ResponseData.time + '</td>' +
                '</tr>' +
                // '<tr>' +
                // '<th scope="row">tty status</th>' +
                // '<td>' + ResponseData.tty_status + '</td>' +
                // '</tr>' +
                '<tr>' +
                '<th scope="row">updatedAt</th>' +
                '<td>' + ResponseData.updatedAt + '</td>' +
                '</tr>' +
                '<tr>' +
                '<th scope="row">status code</th>' +
                '<td>' + ResponseData.status_code + '</td>' +
                '</tr>';
            $('#callBoxStatusDetail').html(viewDetails);

        }
    }, true);
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
}

const exportCSV = () => {
    let table = $('#call_box_status_table').DataTable();
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

    sendCaseCloudHTTPRequest("message/export", "POST", reqData, function (result) {
        if (result) {
            let resultData = result.data;
            let csvContent = '"original_message", "time", "region", "battery_voltage", "ani", "call_count", "call_sec", "call_min", "signal_rssi", "signal_dbm", "rssi", "ecio", "status_code", "createdAt", "call_box_status"\r\n';
            let exportData = [];
            resultData.forEach(function (rowArray) {
                //console.log(rowArray," d");
                const messagesData = rowArray.messages_data;
                const metaType = [];
                if (messagesData) {
                    messagesData.map((val, key) => {
                        let aniMetaData = val.ani_meta_data;
                        metaType.push(aniMetaData.meta_type);
                    });
                }
                rowArray['call_box_status'] = metaType.toString();
                let csvJson = _.omit(rowArray, ['messages_data']);
                let csvData = _.values(csvJson);
                let csvResponse = csvData.map(string => string === null ? '' : `\"${string}\"`);
                exportData.push(csvResponse);
                console.log(exportData);
            });
            let row = exportData.join("\n");
            csvContent += row + "\r\n";
            console.log(csvContent, "CSC");
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement('a');
            link.id = 'download-csv';
            link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
            link.setAttribute('download', 'X15-Live-Message.csv');
            document.body.appendChild(link);
            document.querySelector('#download-csv').click();
            // console.log(reqData, "filters.reqData");
            // window.open(encodedUri);
        }
    });
};

const batteryCanvas = document.getElementById("batteryVoltageChart");
const batteryCtx = batteryCanvas.getContext("2d");
const batteryHorizontalLinePlugin = {
    id: 'horizontalLine',
    afterDraw: function (chartInstance) {
        let yScale = chartInstance.scales["y"];
        let index;
        let line;
        let style;
        if (chartInstance.options.horizontalLine) {
            for (index = 0; index < chartInstance.options.horizontalLine.length; index++) {
                line = chartInstance.options.horizontalLine[index];
                if (!line.style) {
                    style = "rgba(169,169,169, .6)";
                } else {
                    style = line.style;
                }
                if (line.y) {
                    yValue = yScale.getPixelForValue(line.y);
                } else {
                    yValue = 0;
                }
                batteryCtx.lineWidth = 3;
                if (yValue) {
                    batteryCtx.beginPath();
                    batteryCtx.moveTo(28, yValue);
                    batteryCtx.lineTo(batteryCanvas.width - 14, yValue);
                    batteryCtx.strokeStyle = style;
                    batteryCtx.stroke();
                }
                if (line.text) {
                    batteryCtx.fillStyle = style;
                    batteryCtx.fillText(line.text, 0, yValue + ctx.lineWidth);
                }
            }
            return;
        }
    }
};
const batteryData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [{
        label: "Battery voltage",
        fill: false,
        lineTension: 0.1,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        data: [0, 5, 8, 81, 56, 55, 40],
    },
    ]
};
Chart.register(batteryHorizontalLinePlugin);
const batteryVoltageChart = new Chart(batteryCtx, {
    type: 'line',
    data: batteryData,
    options: {
        "horizontalLine": [{
            "y": 10,
            "style": "#fb9f9f",
            "text": ""
        }, {
            "y": 20,
            "style": "#9fb6fb",
            "text": ""
        }, {
            "y": 30,
            "style": "#94f78f",
            "text": ""
        }],
    }
});


const ECIOCanvas = document.getElementById("ECIOChart");
const ECIOCtx = ECIOCanvas.getContext("2d");
const ECIOHorizontalLinePlugin = {
    id: 'horizontalLineECIO',
    afterDraw: function (chartInstance) {
        let yScale = chartInstance.scales["y"];
        let index;
        let line;
        let style;
        if (chartInstance.options.horizontalLine) {
            for (index = 0; index < chartInstance.options.horizontalLine.length; index++) {
                line = chartInstance.options.horizontalLine[index];
                if (!line.style) {
                    style = "rgba(169,169,169, .6)";
                } else {
                    style = line.style;
                }
                if (line.y) {
                    yValue = yScale.getPixelForValue(line.y);
                } else {
                    yValue = 0;
                }
                ECIOCtx.lineWidth = 3;
                if (yValue) {
                    ECIOCtx.beginPath();
                    ECIOCtx.moveTo(28, yValue);
                    ECIOCtx.lineTo(ECIOCanvas.width - 14, yValue);
                    ECIOCtx.strokeStyle = style;
                    ECIOCtx.stroke();
                }
                if (line.text) {
                    ECIOCtx.fillStyle = style;
                    ECIOCtx.fillText(line.text, 0, yValue + ctx.lineWidth);
                }
            }
            return;
        }
    }
};
const ECIOData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [{
        label: "ECIO",
        fill: false,
        lineTension: 0.1,
        backgroundColor: "rgba(205,223,68,0.4)",
        borderColor: "rgba(205,223,68,1)",
        data: [0, 5, 8, 81, 56, 55, 40],
    },
    ]
};
Chart.register(ECIOHorizontalLinePlugin);
const ECIOChart = new Chart(ECIOCanvas, {
    type: 'line',
    data: ECIOData,
    options: {
        "horizontalLine": [{
            "y": 10,
            "style": "#fb9f9f",
            "text": ""
        }, {
            "y": 20,
            "style": "#9fb6fb",
            "text": ""
        }, {
            "y": 30,
            "style": "#94f78f",
            "text": ""
        }],
    }
});
