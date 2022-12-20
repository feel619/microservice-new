let selected_region_id = localStorage.getItem("region_id") ? localStorage.getItem("region_id") : $("select#admin_region_box>option:eq(0)").val();
let durationFormat = 'Mon', duration = 'month', durationTime = '1 month';
let currentDate = new Date();
let makeMonthDate = new Date(currentDate);
let todayYear = new Date(currentDate).toLocaleDateString();
let makeMonthFirstDay = makeMonthDate.setMonth(makeMonthDate.getMonth() - 1);
let monthFirstDay = new Date(makeMonthFirstDay).toLocaleDateString();

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
    selected_region_id = id;
    getChartList();
});

const sendLiveStatusMessage = (ResponseData) => {
    console.log("updateLiveCallBoxStatusResponseData", ResponseData);
    // ReloadCallBoxHighStatusTable();
};

$("#search-call-box-status-value").submit(function (event) {
    event.preventDefault();

});

$('.resetFn').click(function () {
    $('#fx_ani').val('');
    $('#fx_alert_box').val('');

});

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

let optionsVoice = {
    series: [{
        name: 'Availability',
    }],
    chart: {
        id: 'voice', type: 'bar', height: 350, group: 'social',
        toolbar: {show: true},
    },
    colors: ["#008000"],
    plotOptions: {
        bar: {columnWidth: '55%', endingShape: 'rounded'},
    },
    dataLabels: {enabled: false,},
    stroke: {show: true, width: 2, colors: ['transparent']},
    title: {text: 'Voice calls', align: 'center'},
    xaxis: {
        categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        tickPlacement: 'on'
    },
    yaxis: [
        {title: {text: 'units',}, tickAmount: 5, min: 0, max: 6,
            labels: {minWidth: 40,},},

    ],
    fill: {opacity: 1},
};

let chartVoice = new ApexCharts(document.querySelector("#chart-voice"), optionsVoice);
chartVoice.render();

let optionsTTY = {
    series: [{
        name: 'Availability',
    }],
    chart: {
        id: 'tty', type: 'bar', height: 350, group: 'social',
        toolbar: {show: true},
    },
    colors: ["#008000"],
    plotOptions: {
        bar: {columnWidth: '55%', endingShape: 'rounded'},
    },
    dataLabels: {enabled: false,},
    stroke: {show: true, width: 2, colors: ['transparent']},
    title: {text: 'TTY calls', align: 'center'},
    xaxis: {
        categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        tickPlacement: 'on'
    },
    yaxis: [
        {title: {text: 'units',}, tickAmount: 5, min: 0, max: 6,
            labels: {minWidth: 40},},
    ],
    fill: {opacity: 1},
};

let chartTTY = new ApexCharts(document.querySelector("#chart-tty"), optionsTTY);
chartTTY.render();


let optionsData = {
    series: [{
        name: 'Availability',
    }],
    chart: {
        id: 'data', type: 'bar', height: 350, group: 'social',
        toolbar: {show: true},
    },
    colors: ["#008000"],
    plotOptions: {
        bar: {columnWidth: '55%', endingShape: 'rounded'},
    },
    dataLabels: {enabled: false,},
    stroke: {show: true, width: 2, colors: ['transparent']},
    title: {text: 'Data session', align: 'center'},
    xaxis: {
        categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        tickPlacement: 'on'
    },
    yaxis: [
        {title: {text: 'units',}, tickAmount: 5, min: 0, max: 6,
            labels: {minWidth: 40},},
    ],
    fill: {opacity: 1},
};

let chartData = new ApexCharts(document.querySelector("#chart-data"), optionsData);
chartData.render();

var resetCssClasses = function (activeEl) {
    var els = document.querySelectorAll('.btn-chart');
    Array.prototype.forEach.call(els, function (el) {
        el.classList.remove('active')
    });
    activeEl.target.classList.add('active');
    getChartList();
};

document.querySelector('#one_month').addEventListener('click', function (e) {
    duration = 'month';
    durationTime = '1 month';
    durationFormat = 'Mon';
    resetCssClasses(e);
});

document.querySelector('#one_week').addEventListener('click', function (e) {
    duration = 'week';
    durationTime = '1 week';
    durationFormat = 'Mon-DD';
    resetCssClasses(e);
});
document.querySelector('#six_months').addEventListener('click', function (e) {
    duration = 'month';
    durationTime = '3 month';
    durationFormat = 'Mon';
    resetCssClasses(e);
});
document.querySelector('#one_year').addEventListener('click', function (e) {
    duration = 'year';
    durationTime = '1 year';
    durationFormat = 'YYYY';
    resetCssClasses(e);
});

function getChartList() {
    let data = {
        'region_id': selected_region_id,
        'duration': duration,
        'durationTime': durationTime,
        'durationFormat': durationFormat
    };
    sendCaseCloudHTTPRequest('systemAvailability/chart', "POST", data, function (result) {
        if (result) {
            let voiceData = result.data;
            let voiceValueData = [], ttyValueData = [], dataValueData = [];
            console.log(voiceData, "voiceData");
            $.each(voiceData, function (index, res) {
                let voiceData = {
                    x: res.start_date, y: res.voice_availability.toFixed(1),
                    goals: [
                        {
                            name: 'Successful', value: res.voice_success, strokeHeight: 5, strokeColor: '#0000FF'
                        },
                        {
                            name: 'Failures', value: res.voice_fail, strokeHeight: 5, strokeColor: '#FF0000'
                        }
                    ]
                };
                let ttyData = {
                    x: res.start_date, y: res.tty_availability.toFixed(1),
                    goals: [
                        {
                            name: 'Successful', value: res.tty_success, strokeHeight: 5, strokeColor: '#0000FF'
                        },
                        {
                            name: 'Failures', value: res.tty_fail, strokeHeight: 5, strokeColor: '#FF0000'
                        }
                    ]
                };
                let dataSessionData = {
                    x: res.start_date, y: res.data_availability.toFixed(1),
                    goals: [
                        {
                            name: 'Successful', value: res.data_success, strokeHeight: 5, strokeColor: '#0000FF'
                        },
                        {
                            name: 'Failures', value: res.data_fail, strokeHeight: 5, strokeColor: '#FF0000'
                        }
                    ]
                };
                voiceValueData.push(voiceData);
                ttyValueData.push(ttyData);
                dataValueData.push(dataSessionData);
            });
            console.log(voiceValueData, ttyValueData, dataValueData, 'voiceValueData');
            ApexCharts.exec('voice', 'updateSeries', [{data: voiceValueData}], false);
            ApexCharts.exec('tty', 'updateSeries', [{data: ttyValueData}], false);
            ApexCharts.exec('data', 'updateSeries', [{data: dataValueData}], false);
            //chartVoice.updateOptions({}, true, false, true);
        }
    });
}

getChartList();

$('.cancelBtn, .backBtn').click(function (e) {
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
    resetCssClasses(e);
    $('#one_month').addClass('active');
    //chartVoice.clearAnnotations();
});

