let user_type = '';
const urlParams = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let urlANI = urlParams.ani;
let urlRegion = urlParams.region;
let url_call_box_id = urlParams.id;
let url_call_box_ani = urlParams.ani;

function checkModulePermission() {
    user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
        $('.call-box-readonly').prop('readonly', true);
    }
    // if (user_type !== "admin" && user_type !== "region_admin") {
    //     window.location = _config.domain + "index.html";
    // }
    GetRegionList();
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

let myStyles = [
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [
            {visibility: "off"}
        ]
    }
];

/********************** Location *************************** */
let RegionBox = {};
let readFile = true;
let map, geocoder;
let panorama;
if (localStorage.getItem('user_type') === "admin") {
    $('.latlong').keypress(function (e) {
        let regex = new RegExp("^[-+]?[0-9.]+$");
        let str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
        let txt = '';
        /*
            fixed minus sign issue
            Test regex with validation of  text box value
         */
        console.log("TextBoxValue value:", this.value); // this is the value before the key is added
        console.log("TextBoxValue selectionStart:", this.selectionStart); // the position where the character will be inserted
        switch (this.selectionStart) {
            case 0:
                if (str === "-") {
                    txt = str + $(this).val();
                    return true;
                }
        }
        txt = $(this).val() + str;
        if (regex.test(txt)) {
            return true;
        }
        e.preventDefault();
        return false;
    });
}
let centerCords = {
    lat: 29.7265904,
    lng: -95.5635037
};
let markers = [];
let runningPublisherId = [];
let iconBase = 'images/map-pin-blue.png';
let stopIcon = "images/map-pin.png";
let infowindow, marker;
let info_content = [];
myMap();
let bounds = new google.maps.LatLngBounds();


let callBox_table = $('#callBox_table');
let callBox_logs_table = $('#callBox_logs_table');
let lat_long_switch = $("#lat_long_switch");
let filter_region_id = $("#admin_region_box");

function myMap() {
    let mapProp = {
        disableDefaultUI: true,
        mapTypeId: 'roadmap',
        streetViewControl: true,
        mapTypeControl: true,
        scaleControl: true,
        zoomControl: true,
        center: centerCords,
        zoom: 5,
        styles: myStyles,
    };
    map = new google.maps.Map(document.getElementById("map_location"), mapProp);
    geocoder = new google.maps.Geocoder;
    infowindow = new google.maps.InfoWindow;
    geocodeLatLng(geocoder, map, infowindow);
    panorama = map.getStreetView();
    if (localStorage.getItem('user_type') === "admin") {
        google.maps.event.addListener(map, "click", function (e) {
            let latLng = e.latLng;
            let lat = latLng.lat();
            let lng = latLng.lng();
            $("#lat").val(lat);
            $("#long").val(lng);
            if (marker && marker.icon !== stopIcon) {
                if (marker.setMap) {
                    // if the marker already exists, remove it from the map
                    marker.setMap(null);
                }
            }
            marker = new google.maps.Marker({
                position: latLng,
                map: map,
                icon: iconBase,
                draggable: true,
                crossOnDrag: false
            });
            markers.push(marker);
            google.maps.event.addListener(marker, 'dragend', function (e) {
                let latLng = e.latLng;
                let lat = latLng.lat();
                let lng = latLng.lng();
                $("#lat").val(lat);
                $("#long").val(lng);
            });
        });
    }
}

function addMarker(callBoxValue) {
    let lat = callBoxValue.lat;
    let long = callBoxValue.long;
    let publisherId = callBoxValue.board_id;//callBoxValue.publisherId; //board_id = room_id = publisher_id
    let callBoxId = callBoxValue.id;//callBoxValue.publisherId; //board_id = room_id = publisher_id
    let myLatlng = new google.maps.LatLng(lat, long);
    marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        icon: stopIcon,
        draggable: false,
        crossOnDrag: false
    });
    let box_number = (callBoxValue.box_number !== undefined) ? callBoxValue.box_number : '';
    let regionName = $('#admin_region_box').find('option:selected').attr("region_code");
    let callBoxName = regionName + '-' + callBoxValue.ani_number;
    let contentString = '<div id="content">' +
        '<h6 id="firstHeading" style="word-break: break-all;" class="firstHeading">' + callBoxValue.account_number + '/' + callBoxValue.account_name + '</h6>' +
        '<div id="bodyContent">' +
        '<p style="word-break: break-all;" ><b>' + callBoxName + '</b>' +
        '<p><b>Ph: ' + callBoxValue.source_phone_number + '</b>' +
        '<p><b>Boxno: ' + box_number + '</b>' +
        '</div>' +
        '</div>';
    markers.push(marker);
    info_content[publisherId] = contentString;
    bounds.extend(marker.position);
    google.maps.event.addListener(marker, 'click', function (event) {
        let pub_id = callBoxId;
        updateCallBox(pub_id);
        backLtBack(pub_id);
    });
    google.maps.event.addListener(marker, 'mouseover', (function (marker, contentString, infowindow) {
        //marker.setDraggable(false);
        return function () {
            infowindow.setContent(contentString);
            infowindow.open(map, marker);
        };
    })(marker, contentString, infowindow));
    google.maps.event.addListener(marker, 'mouseout', (function (marker, contentString, infowindow) {
        //marker.setDraggable(true);
        return function () {
            infowindow.close();
        };
    })(marker, contentString, infowindow));
}

$("#description").blur(function () {
    codeAddress();
});

function geocodeLatLng(geocoder, map_location, infowindow) {
    let latitude = document.getElementById('lat').value;
    let longitude = document.getElementById('long').value;
    let latlng = {lat: parseFloat(latitude), lng: parseFloat(longitude)};
    geocoder.geocode({'location': latlng}, function (results, status) {
        if (status === 'OK') {
            if (results[0]) {
                map_location.setZoom(11);
                const marker = new google.maps.Marker({
                    position: latlng,
                    map: map_location
                });
                infowindow.setContent(results[0].formatted_address);
                infowindow.open(map_location, marker);
            } else {
                console.log('No results found');
            }
        } else {
            console.log('Geocoder failed due to: ' + status);
        }
    });
}

function codeAddress() {
    let address = document.getElementById('description').value;
    geocoder.geocode({'address': address}, function (results, status) {
        if (status === 'OK') {
            map.setCenter(results[0].geometry.location);
            let marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });
            infowindow.open(map, marker);
        } else {
            console.log('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function setFitBound() {
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
    map.panToBounds(bounds);
}

function setMapOnAll(map) {
    console.log(map, " map ", markers);
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function clearMarkers() {
    setMapOnAll(null);
}

function deleteMarkers() {
    clearMarkers();
    markers = [];
    bounds = new google.maps.LatLngBounds();
}

function setMarkerOnMap(lat, long, id) {
    RegionBox = callBox_table.DataTable().rows({filter: 'applied'}).data().toArray();
    regionListing(RegionBox, id);
    let ZoomLevel = 20;
    if ((lat === "" || long === "") || (lat === "0" || long === "0")) {
        ZoomLevel = 5;
    }
    let myLatLng = new google.maps.LatLng(lat, long);
    marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: iconBase,
        draggable: true,
        crossOnDrag: false
    });
    markers.push(marker);
    bounds.extend(marker.position);

    if (localStorage.getItem('user_type') === "admin") {
        google.maps.event.addListener(marker, 'dragend', function (e) {
            let latLng = e.latLng;
            let lat = latLng.lat();
            let lng = latLng.lng();
            $("#lat").val(lat);
            $("#long").val(lng);
        });
    }
    setFitBound();
    //bounds_changed
    let boundsListener = google.maps.event.addListener((map), 'bounds_changed', (event) => {
        console.log("ZoomLevel", map.getZoom());
        //bounds = new google.maps.LatLngBounds();
        center = bounds.getCenter();
        map.fitBounds(bounds);
        //map.setZoom(map.getZoom()+2);
        map.setCenter(new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng()));
        //map.panTo(center);
        map.panTo(marker.position);
        map.setZoom(ZoomLevel);
        google.maps.event.removeListener(boundsListener);
    });
}

jQuery.validator.addMethod("phoneUS", function (phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || phone_number.length > 9 &&
        phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

jQuery.validator.addMethod('selectcheck', function (value) {
    return (value !== '');
}, "region required");

$("#add_call_box_form").validate({
    rules: {
        description: "required",
        ani_number: {
            required: true,
            minlength: 1,
            maxlength: 4
        },
        phone: {
            required: true,
            minlength: 10,
            maxlength: 20
            // phoneUS: true
        },
        battery_low_level: {},
        /*  battery_medium_level: {
              min: function () {
                  return parseInt($('#battery_low_level').val());
              }
          },*/
        battery_high_level: {
            min: function () {
                return parseInt($('#battery_low_level').val());
            }
        },
        call_in_time: "required",
    },
    submitHandler: function (form) {
        let temp = $(form).serializeArray(), data = {};
        $.map(temp, function (n, i) {
            data[n['name']] = n['value'].trim();
            if(n['name'] === 'battery_low_level' || n['name'] === 'battery_medium_level' || n['name'] === 'battery_high_level')   data[n['name']] = parseInt(n['value']);
        });
        let region_id = filter_region_id.val();
        data['region_id'] = region_id;
        if (region_id !== '' && region_id != null) {
            //let ANI = parseInt(data['ani_number']);
            let region_name = $("#admin_region_box option:selected").text();
            let regionName = region_name.toLowerCase();
            data['region_name'] = regionName.replace(/\s/g, '');
            data['created_by'] = localStorage.getItem('subIdUser');
            let days = parseInt(data['fail_to_checkin_day']);
            let hours = parseInt(data['fail_to_checkin_hour']);
            let minute = parseInt(data['fail_to_checkin_minute']);
            let dayInMinute = days * 24 * 60;
            let hoursInMinute = Math.floor(hours * 60);
            let totalMinute = dayInMinute + hoursInMinute + minute;
            data['fail_to_checkin_day'] = (days ? days: 0);
            data['fail_to_checkin_hour'] = (hours ? hours: 0);
            data['fail_to_checkin_minute'] = (minute ? minute: 0);
            data['fail_to_checkin_frequency'] = (totalMinute ? totalMinute: 0);
            data['source_phone_number'] = data['phone'];

            // Convert Local time to GMT
            let call_in_time = data['call_in_time'];
            let timezone = $('#timezone').val();
            if (timezone != null) {
                let time = moment(moment().format('YYYY-MM-DD') + ' ' + call_in_time).format('YYYY-MM-DD HH:mm:ss');
                call_in_time = moment.tz(time, 'YYYY-MM-DD HH:mm:ss', timezone).utc().format('hh:mm:ss A');
            }
            data['call_in_time'] = call_in_time;

            if (!data['id']) {
                sendCaseCloudHTTPRequest("callBox/createCallBox", "POST", data, function (result) {
                    if (result) {
                        $('.cancelBtn, .backBtn').click();
                        reloadCallBoxTable();
                    }
                });
            } else {
                sendCaseCloudHTTPRequest("callBox/updateCallBox/" + data['id'], "PUT", data, function (result) {
                    if (result) {
                        toastr.success('Call box info updated!');
                        //$('.cancelBtn, .backBtn').click();
                        reloadCallBoxTable();
                        updateObjectOfRegion(data);
                    }
                });
            }
        } else {
            toastr.error('Please select region!');
        }
    }
});

function addCallBox() {
    if (filter_region_id.val()) {
        //  $(".board_id").show();
        //ResetDatatableFilter();
        $('.map_zoom_in_out_div').addClass('d-none');
        $('.map_prev_next_div').addClass('d-none');
        $('.add_call_box_btn').addClass('d-none');
        $('.form_header').html('Add');
        $(".cf_status_div").addClass('d-none');
        $('#add_call_box_form')[0].reset();
        $('#is_test').attr('checked', false);
        deleteMarkers();
        RegionBox = callBox_table.DataTable().rows().data().toArray();
        regionListing(RegionBox);
        //bounds_changed
        let boundsListener = google.maps.event.addListener((map), 'bounds_changed', (event) => {
            console.log("ZoomLevel on Add", map.getZoom());
            //bounds = new google.maps.LatLngBounds();
            let center = bounds.getCenter();
            map.fitBounds(bounds);
            //map.setZoom(map.getZoom()+2);
            map.setCenter(new google.maps.LatLng(center.lat(), center.lng()));
            map.panTo(center);
            google.maps.event.removeListener(boundsListener);
        });
        $('.hidden_field').html('');
        $('.call_box_form_div').removeClass('d-none');
        $('.call_box_table_div').addClass('d-none');
        $('.call_box_log_div').addClass('d-none');
        $('.call_box_message_div').addClass('d-none');
    } else {
        toastr.error('Please Select region');
    }
}

// Call box listing
let filters = {
        searchList: [
            {
                "field": "region_id",
                "operator": "is",
                "value": filter_region_id.val() === null ? "" : filter_region_id.val()
            },
            {
                "field": "cf_status", "operator": "contains", "value": $('.btn-check:checked').val()
            },
            {
                "field": "lat", "operator": "is", "value": lat_long_switch.is(":checked") ? null : ""
            },
            {
                "field": "ani_number", "operator": "contains", "value": ""
            }
        ]
    },
    columns = [
        {data: 'account_number', orderable: true},
        {data: 'account_name', orderable: true},
        {data: 'ani_number', orderable: true},
        {data: 'box_number', orderable: true},
        {data: 'description', orderable: true},
        {data: 'lat', orderable: true},
        {data: 'long', orderable: true},
        {data: 'source_phone_number', orderable: true},
        {data: 'call_in_time', orderable: false},
        {data: 'fail_to_checkin_frequency', orderable: false},
        {data: 'cf_status', orderable: true},
        {data: 'p_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                let accountNo = full.account_number !== '' ? full.account_number : 'None';
                return '<label class="">' + accountNo + '</label>';
            }
        },
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let accountName = full.account_name !== '' ? full.account_name : 'None';
                return '<label class="">' + accountName + '</label>';
            }
        },
        {
            "targets": [4],
            "type": "html",
            className: 'dt-body-description',
            render: function (data, type, full, meta) {
                let description = full.description.replace(/(\r\n|\n|\r)/gm, "<br>").trim();
                return description.replace("||||", "<br>");
            }
        },
        {
            "targets": [8],
            render: function (call_in_time, type, full) {
                // Convert GMT to Local timezone
                if (call_in_time != null) {
                    if (full['TRD']['timezone'] != null) {
                        let time = moment(moment().format('YYYY-MM-DD') + ' ' + call_in_time).format('YYYY-MM-DD HH:mm:ss');
                        return moment.utc(time, null).tz(full['TRD']['timezone']).format('hh:mm:ss A z');
                    } else {
                        return call_in_time;
                    }
                } else {
                    return '';
                }
            }
        },
        {
            "targets": [9],
            render: function (data, type, full, meta) {
                if (full.fail_to_checkin_frequency === '0') {
                    if (full.TRD.fail_to_checkin_frequency === '0') {
                        return _config.failToCheckinFrequency + ' Minutes - <small>Based on system</small>';
                    } else {
                        return full.TRD.fail_to_checkin_frequency + ' Minutes - <small>Based on region</small>';
                    }
                } else {
                    return full.fail_to_checkin_frequency + ' Minutes - <small>Based on call box</small>';
                }
            }
        },
        {
            "targets": [10],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let id = full.id;
                let checked = ((full.cf_status !== '3') ? (full.cf_status === '1' ? 'checked' : '') : 'disabled');
                let isDisabled = (localStorage.getItem('user_type') === 'project' || localStorage.getItem('user_type') === 'technician' ? 'disabled' : '');
                return '<div class="material-switch"><input ' + isDisabled + ' id="' + id + '" name="someSwitchOption001" class="checked-box" type="checkbox" ' + checked + ' value="' + id + '"><label for="' + id + '" class="label-primary"></label><p style="display:none;">' + full.cf_status + '</p></div>';
            }
        },
        {
            "targets": [11],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let id = full.id;
                return ((full.p_status === '1') ? 'YES' : 'NO');
            }
        },
        {
            "targets": [12],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let regionCode = full.TRD && full.TRD.region_code ? full.TRD.region_code : '', edit_html = '';
                if (localStorage.getItem('user_type') === "admin") {
                    if (full.cf_status === '3') {
                        edit_html += '<a data-toggle="tooltip" title="Ban" class="btn btn-sm btn-primary white-color" ><i class="fa fa-ban"></i></a>';
                    } else if (full.cf_status === '2') {
                        edit_html += '<a data-toggle="tooltip" title="Edit" class="btn btn-sm btn-primary white-color" onclick="updateCallBox(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                        edit_html += '<a data-toggle="tooltip" title="Delete" class="btn ml-1 btn-sm btn-danger white-color" onclick="removeCallBox(\'' + full.id + '\')"><i class="fa fa-trash"></i></a>';
                    } else {
                        edit_html += '<a data-toggle="tooltip" title="Call Box Failure Analysis Graph" class="btn white-color btn-sm btn-primary" href="caseAlertRealTime.html?ani=' + full['ani_number'] + '&region=' + regionCode + '&id=' + full['id'] + '"><i class="fa fa-bar-chart "></i></a>';
                        edit_html += '<a data-toggle="tooltip" title="Knightscope Alerts Detail History Graph" class="btn ml-1 white-color btn-sm btn-primary" href="caseAlertClassic.html?ani=' + full['ani_number'] + '&region=' + regionCode + '&id=' + full['id'] + '" ><i class="fa fa-line-chart"></i></a>';
                        edit_html += '<a data-toggle="tooltip" title="Edit" class="btn btn-sm ml-1 btn-primary white-color" onclick="updateCallBox(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                    }
                } else {
                    edit_html += '<a data-toggle="tooltip" title="View" class="btn btn-sm btn-primary white-color" onclick="updateCallBox(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                }
                return edit_html;
            }
        }
    ],
    order = [[0, "asc"]],
    dataTable = callCaseCloudDataTable('callBox_table', 'callBox/tableList', filters, columns, '', columnDefs, order);

/*callBox_table.DataTable().on('search.dt', function () {
    console.log("search.dt");
    //number of filtered rows
    console.log(callBox_table.DataTable().rows({filter: 'applied'}).nodes().length);
    //filtered rows data as arrays
    console.log("Data", callBox_table.DataTable().rows({filter: 'applied'}).data());
    //RegionBox =  callBox_table.DataTable().rows( { filter : 'applied'} ).data[0];
    //deleteMarkers();
    setTimeout(() => {
        RegionBox = callBox_table.DataTable().rows({filter: 'applied'}).data().toArray();
        //regionListing(RegionBox);
    }, 2000);
});*/

/*$.fn.dataTable.ext.search.push(
    function (settings, data, dataIndex) {
        let statusSwitch = $("input[name='status_switch']:checked").val();
        let statusColData = data[8];
        let latColData = data[5];
        let longColData = data[6];
        if (lat_long_switch.is(":checked")) {
            if (latColData === '' && longColData === '') { //&& (statusSwitch !== '1') ? ((statusSwitch === '2') ? statusColData === '2' : statusColData === '3')  : statusColData === '1'
                let m = RegionBox.filter((region) => {
                    return region.lat === '' && region.long === '' && region.cf_status === statusSwitch;
                });
                callBox_table.trigger('datachange.dt');
                return true;
            } else {
                return false;
            }
        } else {
            if (statusColData === statusSwitch) {
                callBox_table.trigger('datachange.dt');
                return true;
            }
        }
    }
);*/

// Reload call box listing
function reloadCallBoxTable() {
    filters.searchList[0]['value'] = filter_region_id.val();
    filters.searchList[1]['value'] = $('.btn-check:checked').val();
    filters.searchList[2]['value'] = lat_long_switch.is(":checked") ? null : "";
    filters.searchList[3]['value'] = $('#call_box_search').val() ? $('#call_box_search').val() : '';
    callBox_table.DataTable().ajax.reload(null, false);
}

$("#call_box_search").on('keyup change', function (event) {
    //console.log(this.value.length,"this.value.length");
    reloadCallBoxTable();
});

callBox_table.on('draw.dt', function () {
    RegionBox = callBox_table.DataTable().rows().data().toArray();
    if (url_call_box_id) {
        if(filter_region_id.val() != null) {
            updateCallBox(url_call_box_id);
        }
    } else {
        $('.call_box_table_div').removeClass('d-none');
        $('.call_box_form_div').addClass('d-none');
        $('.call_box_log_div').addClass('d-none');
        $('.call_box_message_div').addClass('d-none');
    }
});

let callBoxFilters = {
        searchList: [{"field": "call_box_id", "operator": "is", "value": ""}]
    },
    callBoxColumns = [
        {data: 'operation', orderable: true, width: "5%"},
        {data: 'value', orderable: false, width: "80%"},
        {data: 'TUD', orderable: true,  width: "10%"},
        {data: 'createAt', orderable: true,  width: "5%"},
    ],
    callBoxColumnDefs = [
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let logsHtml = '';
                for (var key in data) {
                    if (key !== 'id' && key !== 'region_id' && key !== 'ani_number' && key !== 'created_by') {
                        logsHtml += '<div style=" overflow: hidden;">' + key + ':' + data[key] + '</div>';
                    }
                }
                return logsHtml;
            }
        },
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                let logsHtml = '';
                let alarmStatus = '';
                if(full['operation_job'] === 'TRIGGER' && (full['alarm_status'] || full['alarm_status'] !== '')){
                    alarmStatus = (full['alarm_status'] === '0400') ?  'Programming call': 'Report call';
                } else if(full['operation_job'] !== 'TRIGGER' && data) {
                    alarmStatus = data.name;
                }
                logsHtml += '<div>' + alarmStatus + '</div>';
                return logsHtml;
            }
        },
        {
            "targets": [3],
            render: function (data, type, full, meta) {
                console.log("data",data);
                console.log("full",full);
                console.log("meta",meta);
                console.log("type",type);
                let timezone = full.TRD ? (full.TRD.timezone !== null ? full.TRD.timezone : 'America/Los_Angeles') : 'America/Los_Angeles';
                let dateTime = full.updatedAt ? full.updatedAt : full.createdAt;
                return convertUTCToTimezone(dateTime, null, timezone);
            }
        },
    ],
    callBoxOrder = [[3, "desc"]],
    callBoxDataTable = callCaseCloudDataTable('callBox_logs_table', 'callBoxLog/tableList', callBoxFilters, callBoxColumns, '', callBoxColumnDefs, callBoxOrder);

function reloadCallBoxLogTable(id) {
    callBoxFilters.searchList[0]['value'] = id;
    callBox_logs_table.DataTable().ajax.reload(null, false);
}

let callBoxMessageFilters = {
        searchList: [
            {"field": "call_box_id", "operator": "is", "value": ""}]
    },
    callBoxMessageColumns = [
        {
            "className": 'dt-control',
            "orderable": false,
            "data": null,
            "defaultContent": ''
        },
        {data: 'time', orderable: true},
        {data: 'original_message', orderable: true},
        {data: 'region', orderable: false},
        {data: 'ani', orderable: true},
        {data: 'status_code', orderable: true},
    ],
    callBoxMessageColumnDefs = [
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let dateTime = full.createdAt;
                return moment(dateTime).format('DD-MM-YYYY HH:MM:SS');
            }
        }
    ],
    callBoxMessageOrder = [[1, "desc"]],
    callBoxMessageDataTable = callCaseCloudDataTable('callBox_message_table', 'message/tableList', callBoxMessageFilters, callBoxMessageColumns, '', callBoxMessageColumnDefs, callBoxMessageOrder);

function reloadCallBoxMessageTable(id) {
    callBoxMessageFilters.searchList[0]['value'] = id;
    $('#callBox_message_table').DataTable().ajax.reload(null, false);
}

$('#callBox_message_table tbody').on('click', 'td.dt-control', function () {
    let tr = $(this).closest('tr');
    let table = $('#callBox_message_table').DataTable();
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
    let messageData = messageResponse;
    console.log(messageData);
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
            '</table>' +
            '</div>' +
            '<div class="col-lg-4">' +
            '<table cellpadding="5" cellspacing="0" border="0" style="width: 100%;">' +
            '<tr>' +
            '<td>ani:</td>' +
            '<td>' + messageData.ani + '</td>' +
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
            '<td>time:</td>' +
            '<td>' + messageData.time + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>status:</td>' +
            '<td>';
        messageData.messages_data.forEach(function (value, index) {
            logInfoHtml += '<span>' + value.ani_meta_data.meta_type + '</span>';
        });
        logInfoHtml += '</td></tr>' +
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

// Change status in filter
$('.status_switch').change(() => {
    reloadCallBoxTable();
});

// Change lat long switch in filter
$('#lat_long_switch').change(() => {
    reloadCallBoxTable();
});

const ResetDatatableFilter = () => {
    $('#status_switch').attr('checked', true);
    $('#lat_long_switch').attr('checked', false);
    $("#callBox_table_filter").find('input').val('');
    callBox_table.trigger('datachange.dt');
};

const getDetailsOfCallBox = () => {
    sendCaseCloudHTTPRequest("callBox/detail", 'POST', {"ani": urlANI, "region": urlRegion}, function (result) {
        if (result.data) {
            //if region found in list then select region in box and get all details of call box
            let responseData = result.data;
            let responseRegion = responseData.TRD;
            localStorage.setItem("region_id", responseRegion.id);
            setTimeout(() => {
                updateCallBox(responseData.id);
            }, 2000);
        }
    });
};
/*if (urlRegion !== null && urlANI !== null) {
    console.log(urlANI, "getDetailsOfCallBox", urlRegion);
    getDetailsOfCallBox();
}*/

/*if (url_call_box_id) {
    $('#call_box_search').val(url_call_box_ani);
    updateCallBox(url_call_box_id);
    console.log('isDataTable', $.fn.DataTable.isDataTable('#callBox_table'), filter_region_id.val());
    setTimeout(() => {
        console.log('isDataTable after', $.fn.DataTable.isDataTable('#callBox_table'), filter_region_id.val());
    }, 3000);
} else {
    $('.call_box_table_div').removeClass('d-none');
    $('.call_box_form_div').addClass('d-none');
    $('.call_box_log_div').addClass('d-none');
    $('.call_box_message_div').addClass('d-none');
}*/

// Update call box
function updateCallBox(id) {
    $('.map_zoom_in_out_div').removeClass('d-none');
    $('.map_prev_next_div').removeClass('d-none');
    $('.add_call_box_btn').removeClass('d-none');
    $('.cf_status_div').removeClass('d-none');
    $('.form_header').html('Edit');
    $('#add_call_box_form')[0].reset();
    deleteMarkers();
    sendCaseCloudHTTPRequest("callBox/getCallBox/" + id, 'GET', "", function (result) {
        if (result.data) {
            let response = result.data;
            $('#timezone').val(response['TRD']['timezone']);
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
            $('#account_name').val(response['account_name']);
            $('#account_number').val(response['account_number']);
            let desc = response['description'].replace(/(\r\n|\n|\r)/gm, "\n").trim().replace(" |||| ", "\n");
            $('#description').val(desc);
            $('#board_id').val(response['board_id']);
            $('#ani_number').val(response['ani_number']);
            $('#lat').val(response['lat']);
            $('#long').val(response['long']);
            $('#box_number').val(response['box_number']);
            $('#cf_status').attr('checked', response['cf_status'] === '1');
            $('#is_test').attr('checked', response['is_test'] === true);
            setMarkerOnMap(response['lat'], response['long'], response['id']);
            backLtBack(response['id']);
            let phone = response['source_phone_number'].replace(/ /g, '');
            $('#phone').val(phone);
            $('#region_id').val(response['region_id']);
            $('#fail_to_checkin_day').val(response['fail_to_checkin_day'] != null ? response['fail_to_checkin_day'] : 0);
            $('#fail_to_checkin_hour').val(response['fail_to_checkin_hour'] != null ? response['fail_to_checkin_hour'] : 0);
            $('#fail_to_checkin_minute').val(response['fail_to_checkin_minute'] != null ? response['fail_to_checkin_minute'] : 0);
            $('#battery_low_level').val(response['battery_low_level'] != null ? response['battery_low_level'] : 0);
            $('#battery_high_level').val(response['battery_high_level'] != null ? response['battery_high_level'] : 0);

            // Convert GMT to Local timezone
            let call_in_time = '', call_in_time_zone = '';

            if (response['TRD']['timezone'] != null) {
                call_in_time_zone = moment(moment().format('YYYY-MM-DD')).tz(response['TRD']['timezone']).format('z');
                if (response['call_in_time'] != null) {
                    let time = moment(moment().format('YYYY-MM-DD') + ' ' + response['call_in_time']).format('YYYY-MM-DD HH:mm:ss');
                    call_in_time = moment.utc(time, null).tz(response['TRD']['timezone']).format('hh:mm:ss A');
                } else {
                    call_in_time = response['call_in_time'];
                }
            } else {
                call_in_time = response['call_in_time'];
            }

            /*if (response['call_in_time'] != null) {
                if (response['TRD']['timezone'] != null) {
                    let time = moment(moment().format('YYYY-MM-DD') + ' ' + response['call_in_time']).format('YYYY-MM-DD HH:mm:ss');
                    call_in_time = moment.utc(time, null).tz(response['TRD']['timezone']).format('hh:mm:ss A');
                    call_in_time_zone = moment(moment().format('YYYY-MM-DD')).tz(response['TRD']['timezone']).format('z');
                } else {
                    call_in_time = response['call_in_time'];
                }
            }*/
            $('#call_in_time').val(call_in_time);
            $('#call_in_time_zone').html(call_in_time_zone);

            // Bind Configuration
            $('.controller_board_type').html(response['controller_board_type'] != null && response['controller_board_type'] !== '' ? response['controller_board_type'] : 'N/A');
            $('.tty_equipped').html(response['tty_equipped'] != null && response['tty_equipped'] !== '' ? response['tty_equipped'] : 'N/A');
            $('.rat').html(response['rat'] != null && response['rat'] !== '' ? response['rat'] : 'N/A');
            $('.apn').html(response['apn'] != null && response['apn'] !== '' ? response['apn'] : 'N/A');
            $('.radio_model').html(response['radio_model'] != null && response['radio_model'] !== '' ? response['radio_model'] : 'N/A');
            $('.firmware_family').html(response['firmware_family'] != null && response['firmware_family'] !== '' ? response['firmware_family'] : 'N/A');
            $('.system_configuration_code').html(response['system_configuration_code'] != null && response['system_configuration_code'] !== '' ? response['system_configuration_code'] : 'N/A');
            $('.firmware_rev').html(response['firmware_rev'] != null && response['firmware_rev'] !== '' ? response['firmware_rev'] : 'N/A');
            $('.firmware_radio_handler_revision').html(response['firmware_radio_handler_revision'] != null && response['firmware_radio_handler_revision'] !== '' ? response['firmware_radio_handler_revision'] : 'N/A');
            $('.firmware_boot_revision').html(response['firmware_boot_revision'] != null && response['firmware_boot_revision'] !== '' ? response['firmware_boot_revision'] : 'N/A');
            $('.firmware_tty_revision').html(response['firmware_tty_revision'] != null && response['firmware_tty_revision'] !== '' ? response['firmware_tty_revision'] : 'N/A');
            $('.firmware_dsp_revision').html(response['firmware_dsp_revision'] != null && response['firmware_dsp_revision'] !== '' ? response['firmware_dsp_revision'] : 'N/A');
            $('.cb_cam_sw_revision').html(response['cb_cam_sw_revision'] != null && response['cb_cam_sw_revision'] !== '' ? response['cb_cam_sw_revision'] : 'N/A');
            $('.cb_gps_lat').html(response['gps_lat'] != null && response['gps_lat'] !== '' ? response['gps_lat'] : 'N/A');
            $('.cb_gps_long').html(response['gps_long'] != null && response['gps_long'] !== '' ? response['gps_long'] : 'N/A');
            $('.alarm_status').html(response['alarm_status'] != null && response['alarm_status'] !== '' ? response['alarm_status'] : 'N/A');
            $('.battery_voltage').html(response['battery_voltage'] != null && response['battery_voltage'] !== '' ? response['battery_voltage'] : 'N/A');
            $('.radio_temperature').html(response['radio_temperature'] != null && response['radio_temperature'] !== '' ? response['radio_temperature'] : 'N/A');
            $('.rssi').html(response['rssi'] != null && response['rssi'] !== '' ? response['rssi'] : 'N/A');
            $('.ecio').html(response['ecio'] != null && response['ecio'] !== '' ? response['ecio'] : 'N/A');
            $('.event_log_data').html(response['event_log_data'] != null && response['event_log_data'] !== '' ? response['event_log_data'] : 'N/A');

            $('#maintenance_alarm_masks').val(response['maintenance_alarm_masks']);
            $('#area_light_timeout').val(response['area_light_timeout']);
            $('#days_between_report_calls').val(response['days_between_report_calls']);
            $('#second_report_call_time').val(response['TRD']['second_report_call_time']);

            $('.call_box_form_div').removeClass('d-none');
            $('.call_box_table_div').addClass('d-none');
            $('.call_box_log_div').removeClass('d-none');
            $('.call_box_message_div').removeClass('d-none');
            reloadCallBoxLogTable(response['id']);
            reloadCallBoxMessageTable(response['id'])
        }
    }, false);
}

// Delete call box
function removeCallBox(id) {
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
            sendCaseCloudHTTPRequest("callBox/updateCallBox/" + id, "PUT", {'cf_status': "3"}, function (result) {
                if (result) {
                    reloadCallBoxTable();
                }
            }, true);
        }
    });
    /*removeData("callBox/delete", 'DELETE', id, function (data) {
        if (data) {
            reloadCallBoxTable();
        }
    }, true);*/
}

// Change call box status
$("#callBox_table").on("change", ".checked-box", function (event) {
    var id = $(event.target).attr('value');
    sendCaseCloudHTTPRequest("callBox/updateCallBox/" + id, "PUT", {'cf_status': this.checked ? "1" : "2"}, function (result) {
        if (result) {
            reloadCallBoxTable();
        }
    }, true);
});

const instructionModalOpen = () => {
    $('#InstructionModal').modal('show');
};

const openCsvModal = () => {
    $('#importCsvModal').modal('show');
};

$("#import_form").validate({
    rules: {
        description: {
            required: true,
        },
        import_csv: {
            required: true,
            extension: "csv"
        },
    },
    submitHandler: function (form) {
        let $form = $(form);
        $("#import_csv").parse({
            config: {
                header: true,
                //complete: completeFn,
                error: errorFn,
                skipEmptyLines: true,
            },
            error: function (err, file, inputElem, reason) {
                console.log(err, file, "-before-", inputElem, reason);
            },
            complete: function () {
                let formData = new FormData();
                let params = $form.serializeArray();
                let files = $form.find('[name="import_csv"]')[0].files;
                let fileName = $form.find('[name="import_csv"]').val().split('\\').pop();
                let fName = fileName.replace(/ /g, "_");
                let regionName = fName.split('.').slice(0, -1).join(' ');

                $.each(files, function (i, file) {
                    formData.append('import_file', file);
                });
                $.each(params, function (i, val) {
                    formData.append(val.name, val.value);
                });
                formData.append('created_by',localStorage.getItem('subIdUser'));
                //checking region already exist
                sendCaseCloudHTTPRequest("region/exist?region_name=" + regionName, "GET", '', function (response) {
                    console.log(response, "Response");
                    if (response.data) {
                        importCallBox(formData);
                    } else {
                        Swal.fire({
                            title: "There is no matching region exist in database, are you sure you want to creating a new region!",
                            text: "",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes'
                        }).then((res) => {
                            console.log(res, "res");
                            if (res.value) {
                                importCallBox(formData);
                            } else {
                                $('#importCsvModal').modal('hide');
                            }
                        });
                    }
                });
            }
        });
    }
});

function importCallBox(formData) {
    sendCaseCloudFormRequest("callBox/import", "POST", formData, function (result) {
        reloadCallBoxTable();
        $('#import_csv').val('');
        $('#import_form')[0].reset();
        $('#importCsvModal').modal('hide');
    }, true);
}

function errorFn() {
    toastr.error('Please check if any ANI present!');
    $('#import_csv').val('');
    $('#import_form')[0].reset();
    $('#importCsvModal').modal('hide');
}

$('#importCsvModal').on('hidden.bs.modal', function (e) {
    $('#import_csv').val('');
    $('#import_form')[0].reset();
});

$(".export_csv").on('click', function () {
    event.preventDefault();
    let region_id = filter_region_id.val();
    let region_name = $("#admin_region_box option:selected").text();
    //let region_name_1 = $("#admin_region_box option:selected").text();
    if (region_name !== '' && region_id !== '') {
        let data = {'region_name': region_name};
        sendCaseCloudHTTPRequest("callBox/export/" + region_id, "POST", data, function (result) {
            console.log(result, " result ");
            if(result.data){
                let csvContent = 'ANI, AccountNumber, AccountName, Phone, Lat, Long, BoxNumber, Description.0, Status.0, CallInTime\r\n';
                let resultData = result.data;
                let exportData = [];
                resultData.forEach(function (rowArray) {
                    let callBoxArray = rowArray;
                    callBoxArray['ani_number'] = rowArray['ani_number']; // Time
                    callBoxArray['account_number'] = rowArray['account_number'];  // Region
                    callBoxArray['account_name'] = rowArray['account_name'];  // account_name
                    callBoxArray['source_phone_number'] = rowArray['source_phone_number'];  // source_phone_number
                    callBoxArray['lat'] = rowArray['lat'];  // lat
                    callBoxArray['long'] = rowArray['long'];  // long
                    callBoxArray['box_number'] = rowArray['box_number'];  // box_number
                    callBoxArray['description'] = rowArray['description'].replace(/(\r\n|\n|\r|,)/gm, "||||") ;  // description
                    callBoxArray['status_code'] = rowArray['cf_status'] === '1' ? 'Active' : 'InActive';

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
                    let csvJson = _.pick(callBoxArray, 'ani_number', 'account_number', 'account_name', 'source_phone_number', 'lat', 'long', 'box_number', 'description','status_code','call_in_time');
                    let csvData = _.values(csvJson);
                    let csvResponse = csvData.map(string => string === null ? '' : `\"${string}\"`);
                    exportData.push(csvResponse);
                });
                let row = exportData.join("\n");
                csvContent += row + "\r\n";
                let encodedUri = encodeURI(csvContent);
                let link = document.createElement('a');
                let timestamp = new Date().getTime();
                let fileName = region_name + '.csv';
                let Name = region_name + timestamp;
                link.id = Name;
                link.target = '_blank';
                link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                document.querySelector('#' + Name).click();
            }
        }, true);
    } else {
        toastr.error('Please Select region');
    }
});

$(document).on('change', '#admin_region_box', function (event) {
    let regionId = $(this).val(), element = $(this).find('option:selected'), regionCode = element.attr("data-code");
    filter_region_id.val(regionId ? regionId : '');
    localStorage.setItem("region_id", regionId ? regionId : '');
    localStorage.setItem("region_code", regionId ? regionCode : '');
    reloadCallBoxTable();
    deleteMarkers();
    /*sendCaseCloudHTTPRequest("callBox/getCallBoxByRegion/" + (regionId ? regionId : 0), 'GET', "", function (result) {
        if (result.data) {
            RegionBox = result.data;
            regionListing(RegionBox);
        }
    });*/
});

function regionListing(RegionBox, id = '') {
    if (RegionBox && RegionBox instanceof Array && RegionBox.length) {
        $.each(RegionBox, function (callBoxInd, callBoxValue) {
            //Only active CALLBOX marker would be added on Map
            //console.log(callBoxValue.cf_status,callBoxValue);
            //if (callBoxValue.cf_status) {
            if (callBoxValue.cf_status && callBoxValue.cf_status === "1") {
                if (callBoxValue.id !== id) {
                    addMarker(callBoxValue);
                }
                if (callBoxInd === (RegionBox.length - 1)) {
                    setFitBound();
                }
            }
        });
    }
}

const backLtBack = (pub_id) => {
    console.log(pub_id);
    var len = RegionBox.length;
    if (len > 1) {
        $(".prev-btn,.next-btn").show();
        if (pub_id === "") {
            var index = RegionBox[0].id;
            $(".edit-regions").attr("id", previous["id"]);
        } else {
            var index = RegionBox.findIndex(RegionBox => RegionBox.id === pub_id);
        }
        toggleStreetView();
        console.log(index);
        var current = RegionBox[index];
        if (current === undefined) {
            $(".prev-btn,.next-btn").hide();
            return false;
        }
        console.log("current", current);
        var previous = RegionBox[(index + len - 1) % len];
        console.log("previous", previous, (index + len - 1) % len);
        $(".prev-btn").attr("id", previous["id"]);
        var next = RegionBox[(index + 1) % len];
        console.log("next", next);
        $(".next-btn").attr("id", next["id"]);
    } else {
        $(".prev-btn,.next-btn").hide();
    }
};

$('.cancelBtn, .backBtn').click(function () {
    const myPromise = new Promise(function (resolve, reject) {
        if ($("#id").val() !== undefined) {
            let user_type = localStorage.getItem('user_type');
            if (!CheckDataChangeOnUpdate() && user_type === 'admin') {
                Swal.fire({
                    title: "Are you sure you want to move without making change?",
                    text: "",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes'
                }).then((result) => {
                    if (result.value) {
                        resolve(true)
                    }
                });
            } else {
                resolve(true)
            }
        } else {
            resolve(true)
        }
    });
    myPromise
        .then(function whenOk(response) {
            console.log(response);
            deleteMarkers();
            $('#add_call_box_form')[0].reset();
            let validator = $("#add_call_box_form").validate();
            validator.resetForm();
            $('.call_box_form_div').addClass('d-none');
            $('.call_box_table_div').removeClass('d-none');
            $('.call_box_log_div').addClass('d-none');
            $('.call_box_message_div').addClass('d-none');
            if (url_call_box_id) history.back();
            return response
        })
        .catch(function notOk(err) {
            if (url_call_box_id) history.back();
            console.error(err);
        })
});

const toggleStreetView = () => {
    panorama.setVisible(false);
    /*const toggle = panorama.getVisible();
    if (toggle === false) {
       // panorama.setVisible(true);
    } else {
        panorama.setVisible(false);
    }*/
};

const prev_next_btn = (flg) => {
    if (flg === 3) {
        if (RegionBox.length === 0) {
            toastr.error('No record found in data set!');
            return false;
        }
        let current = RegionBox[0];
        backLtBack(current["id"]);
        id = current["id"];
        updateCallBox(id);
        return true;
    }
    const myPromise = new Promise(function (resolve, reject) {
        let user_type = localStorage.getItem('user_type');
        if (!CheckDataChangeOnUpdate() && user_type === 'admin') {
            Swal.fire({
                title: "Are you sure you want to move without making change?",
                text: "",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes'
            }).then((result) => {
                if (result.value) {
                    resolve(true)
                }
            });
        } else {
            resolve(true)
        }
    });

    myPromise.then(function whenOk(response) {
        let id = '';
        if (flg === 1) {
            id = $(".prev-btn").attr("id");
        } else if (flg === 2) {
            id = $(".next-btn").attr("id");
        } else {
            if (RegionBox.length === 0) {
                toastr.error('No record found in data set!');
                return false;
            }
            let current = RegionBox[0];
            backLtBack(current["id"]);
            id = current["id"];
        }
        updateCallBox(id);
    }).catch(function notOk(err) {
        console.error(err)
    })

};

const zoom_out = (type) => {
    deleteMarkers();
    switch (type) {
        case "IN":
            setMarkerOnMap($('#lat').val(), $('#long').val(), $('#id').val());
            break;
        case "OUT":
            RegionBox = callBox_table.DataTable().rows().data().toArray();
            regionListing(RegionBox);
            //bounds_changed
            let boundsListener = google.maps.event.addListener((map), 'bounds_changed', (event) => {
                console.log("ZoomLevel on Add", map.getZoom());
                //bounds = new google.maps.LatLngBounds();
                center = bounds.getCenter();
                map.fitBounds(bounds);
                //map.setZoom(map.getZoom()+2);
                map.setCenter(new google.maps.LatLng(center.lat(), center.lng()));
                map.panTo(center);
                google.maps.event.removeListener(boundsListener);
            });
            break;
    }
};

const CheckDataChangeOnUpdate = () => {
    let flg = false;
    let index = RegionBox.findIndex(RegionBox => RegionBox.id === $("#id").val());
    let callbox_old_data = RegionBox[index];
    let description = $('#description').val();
    let ani_number = $('#ani_number').val();
    let lat = $('#lat').val();
    let long = $('#long').val();
    let box_number = $('#box_number').val();
    let status = $('#cf_status').is(":checked") ? 1 : 2;
    let phone = $('#phone').val();

    let desc = description.replace(/(\r\n|\n|\r)/gm, "\n");
    let fdesc = desc.trim().replace(" |||| ", "\n");

    let oldDesc = callbox_old_data["description"].replace(/(\r\n|\n|\r)/gm, "\n");
    let folddesc = oldDesc.trim().replace(" |||| ", "\n");
    //console.log(folddesc ,"==", fdesc ,"&&", callbox_old_data["ani_number"] ,"==", ani_number ,"&&", callbox_old_data["lat"] ,"==", lat ,"&&", callbox_old_data["long"] ,"==", long,"&&",callbox_old_data["box_number"] ,"==", box_number ,"&&", callbox_old_data["cf_status"] ,"==", status ,"&&", callbox_old_data["source_phone_number"] ,"==", phone);
    if (folddesc === fdesc && callbox_old_data["ani_number"] == ani_number && callbox_old_data["lat"] == lat && callbox_old_data["long"] == long && callbox_old_data["box_number"] == box_number && callbox_old_data["cf_status"] == status && callbox_old_data["source_phone_number"] == phone) {
        flg = true;
    } else {
        flg = false;
    }

    return flg;
};

const updateObjectOfRegion = (data) => {
    console.log(data, " data ");
    let index = RegionBox.findIndex(RegionBox => RegionBox.id === data['id']);
    RegionBox[index]['ani_number'] = data['ani_number'];
    RegionBox[index]['lat'] = data['lat'];
    RegionBox[index]['long'] = data['long'];
    RegionBox[index]['box_number'] = data['box_number'];
    RegionBox[index]['cf_status'] = data['cf_status'];
    RegionBox[index]['phone'] = data['phone'];
    RegionBox[index]['description'] = data['description'];
    console.log(index, " callBox - Response-  ", RegionBox[index]);
};

/*sendCaseCloudHTTPRequest("region/list", 'GET', "", function (result) {
    if (result.data) {
        let region_list = result.data;
        let region_box = '<option value="">Select Region</option>';
        let regionId = localStorage.getItem('region_id');
        region_list.forEach(function (value, index, array) {
            let selected = (regionId && value.id === regionId) ? 'selected' : '';
            region_box += '<option ' + selected + ' value="' + value['id'] + '" region_code="' + value['region_code'] + '">' + value['region_name'] + '</option>';
        });
        $('#admin_region_box').html(region_box);
    }
});*/
