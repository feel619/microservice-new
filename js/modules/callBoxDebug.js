$('.cancelBtn, .backBtn').click(function () {
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});
$('#fx_created_at').daterangepicker({
    autoUpdateInput: false,
    drops: 'auto',
    timePicker: true,
    locale: {
        cancelLabel: 'Clear',
        format: 'YYYY-MM-DD h:mm A'
    },
    //startDate: startDate,
    //minDate: currentTime,
    maxDate: new Date()
});
$('#fx_created_at').on('apply.daterangepicker', function (ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD  h:mm A') + ' - ' + picker.endDate.format('YYYY-MM-DD  h:mm A'));
    ReloadCallBoxStatusTable();
});
$('#fx_created_at').on('cancel.daterangepicker', function (ev, picker) {
    $(this).val('');
    ReloadCallBoxStatusTable();
});
let filters = {
        searchList: [
            {
                "field": "logs",
                "operator": "contains",
                "value": ""
            },
        ]
    },
    columns = [
        {data: 'time', orderable: false},
        {data: 'remote_address', orderable: false},
        {data: 'logs', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                let dateTime = full.createdAt;
                return moment(dateTime).format('DD-MM-YYYY HH:MM:SS');
            }
        },
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                let messages = full.messages;
                let messagesHtml = '';
                if (messages !== null) {
                    messagesHtml += '<div style="cursor: pointer;" class="dt-control">'+data+'</div>';
                } else {
                    messagesHtml += '<div class="">'+data+'</div>';
                }
                return messagesHtml;
            }
        },
    ],
    order = [1, 'desc'],
    dataTable = callCaseCloudLogDataTable('call_box_status_table', 'messageLogs/listing', filters, columns, '', columnDefs, order);

function ReloadCallBoxStatusTable() {
    filters.searchList[0]['value'] = $('#fx_search').val() ? $('#fx_search').val() : "";
    $('#call_box_status_table').DataTable().ajax.reload(null, false);
}

const sendLiveLogMessage = (ResponseData) => {
    console.log("updateLiveLogMessageResponseData", ResponseData);
    // ReloadCallBoxStatusTable();
};

const getLiveMessageLogs = () => {
    sendCaseCloudHTTPRequest("messageLogs/listing", 'POST', "", function (result) {
        if (result.data) {
            let ResponseData = result.data;
            console.log(ResponseData, " sendCaseCloudHTTPRequest ");
        }
    });
};

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();
    ReloadCallBoxStatusTable();
});

$('#call_box_status_table tbody').on('click', 'div.dt-control', function () {
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

function format(messageResponse) {
    let logInfoHtml = '';
    let messageData = messageResponse.messages;
    console.log(messageData,"ess");
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

//const ctx = document.getElementById('myChart').getContext('2d');
//const speedCanvas = document.getElementById("myChart");

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
