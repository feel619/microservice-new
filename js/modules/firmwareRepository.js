let selected_region_id = '';
let selected_call_box_id = '';
let selected_log_id = '';
/*$(window).bind('beforeunload',function(){
    $('#firmware_repository_table').dataTable().fnDestroy();
});*/

let filters = {
        searchList: [
            {
                "field": "region_id", "operator": "is",
                "value": localStorage.getItem("region_id") ? localStorage.getItem("region_id") : $("select#admin_region_box>option:eq(0)").val()
            },
            {"field": "ani_number", "operator": "is", "value": ""},
            {"field": "call_box.firmware_family", "operator": "is", "value": ""},
            {"field": "call_box.firmware_rev", "operator": "less_then", "value": ''},
            {"field": "call_box.rfw_revision_code", "operator": "is", "value": ''},
            {"field": "call_box.rfw_revision_no", "operator": "less_then", "value": ''},
            {"field": "call_box.firmware_radio_handler_revision", "operator": "is", "value": ''},
        ]
    },
    columns = [
        {data: 'id', orderable: false, "width": "5%",},
        {data: 'ani_number', orderable: true, "width": "5%"},
        {data: 'firmware_family', orderable: true, "width": "10%",},
        {data: 'system_configuration_code', orderable: true, "width": "5%", className: 'system_configuration_code'},
        {data: 'firmware_radio_handler_revision', orderable: true, "width": "5%"},
        {data: 'firmware_rev', orderable: true, "width": "5%"},
        {data: 'firmware_filename', orderable: true, "width": "20%"},
        {data: 'fw_last_update_success_date', orderable: true, "width": "15%"},
        {data: 'fw_last_update_status', orderable: true, "width": "15%"},
        {data: 'requestedName', orderable: true, "width": "5%"},
        {data: 'Action', orderable: false, "width": "5%"},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                let edit_html = '<div class="">';
                console.log(filters.searchList[5], "searchList");
                console.log(data, type, full, meta, "searchList data");
                if (filters.searchList[5]['value']) {
                    edit_html += '<input type="checkbox" class="call-checkbox" value="' + meta.row + '" aria-label="Checkbox for following text input">';
                }
                edit_html += '</div>';
                return edit_html;
            }
        },
        {
            "targets": [3],
            render: function (data, type, full, meta) {
                return '<span style="cursor: pointer;">' + data + '</span>';
            },
            'createdCell': function (td, cellData, rowData, row, col) {
                //console.log("td, cellData, rowData, row, col",td, cellData, rowData, row, col)
                if (rowData.system_configuration_code !== '' && rowData.system_configuration_code !== null) {
                    var html = '' +
                        'Call box type: ' + rowData['TSCC']['call_box_type'] + ' \n' +
                        'Call button type: ' + rowData['TSCC']['call_button_type'] + ' \n' +
                        'Audio interface: ' + rowData['TSCC']['audio_interface'] + ' \n' +
                        'Power source: ' + rowData['TSCC']['power_source'] + ' \n' +
                        'Internal TTY device: ' + rowData['TSCC']['internal_tty_device'] + ' \n' +
                        'Notes: ' + rowData['TSCC']['notes'] + ' \n';
                    $(td).attr('title', html);
                }
            }
        },
        {
            "targets": [6],
            render: function (data, type, full, meta) {
                console.log(full.firmware_family, " DATA ", full.firmware_rev, full.firmware_radio_handler_revision);
                let currentFileName = full.current_firmware_filename, newFileName = full.new_firmware_filename,
                    edit_html = '';
                if (full.fw_last_update_status === 'SUCCESS' || (full.fw_last_update_status === '' || full.fw_last_update_status === null)) {
                    if (full.firmware_family && full.firmware_rev && full.firmware_radio_handler_revision) {
                        edit_html = '<div>' + createFirmwareFileName(full.firmware_family, full.firmware_rev, full.firmware_radio_handler_revision) + '</div>';
                    } else if (currentFileName) {
                        edit_html += '<div>' + currentFileName + '</div>';
                    }
                } else {
                    edit_html += '<div>' + createFirmwareFileName(full.firmware_family, full.firmware_rev, full.firmware_radio_handler_revision) + ' > ' + newFileName + '</div>';
                }
                return edit_html;
            }
        },
        {
            "targets": [7],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [8],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                dateTime = full['firmware_status_date'] ? full['firmware_status_date'] : full['updatedAt'];
                if (data != null) {
                    let error_reason = (full.fw_last_update_error_reason) ? full.fw_last_update_error_reason : '';
                    return data + ' at ' + convertUTCToTimezone(dateTime, null, timezone) + ' <br />' + error_reason;
                }
                return '';
            }
        },
        {
            "targets": [10],
            render: function (data, type, full, meta) {
                console.log(full, "function");
                let regionId = full.region_id ? full.region_id : '', statusCallBox = full.fw_last_update_status,
                    edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="Edit" class="btn btn-sm ml-1 btn-primary white-color" href="callbox.html?id=' + full['id'] + '"><i class="fa fa-edit"></i></a>';
                edit_html += '<a data-toggle="tooltip" title="History" class="btn btn-sm ml-1 btn-primary white-color" onclick="firmwarePushedHistory(\'' + regionId + '\',\'' + full.id + '\',\'' + full.region_code + '\',\'' + full.ani_number + '\')"><i class="fa fa-history"></i></a>';
                if (statusCallBox === "NOT-STARTED") edit_html += '<a data-toggle="tooltip" title="Cancel" class="btn btn-sm ml-1 btn-primary white-color" onclick="firmwarePushedCancel(\'' + regionId + '\',\'' + full.id + '\',\'' + full.region_code + '\',\'' + full.ani_number + '\')"><i class="fa fa-times"></i></a>';
                return edit_html;
            }
        },
    ],
    order = [1, 'asc'],
    createdRow = function (row, data, dataIndex) {
        console.log(row, " row  ", data, dataIndex);
        $(row).css("background-color", data.firmware_raw_color);
    },
    dataTable = callCaseAlertDataTable('firmware_repository_table', 'firmwareRepository/callBox/tableList', filters, columns, loadAniMoreData, columnDefs, order, createdRow);

// Reload firmware listing
function reloadFirmwareTable() {
    let regionCode = $("#admin_region_box").find('option:selected').attr("data-code");
    let regionId = $("#admin_region_box").find('option:selected').val();
    let revision_number = $("#fx_firmware_revision_number").find('option:selected').val();
    let rfw_code = $("#fx_rfw_code").find('option:selected').val() ? $("#fx_rfw_code").find('option:selected').val() : $("#fx_rfw_revision_box").find('option:selected').attr("data-code");
    let rfw_revision_code = $("#fx_rfw_revision_box").find('option:selected').attr("data-code");
    let rfw_radio_no = $("#fx_rfw_revision_box").find('option:selected').attr("data-name");
    let rfw_revision_no = $("#fx_rfw_revision_box").find('option:selected').val();
    filters.searchList[0]['value'] = regionId ? regionId : '';
    filters.searchList[1]['value'] = $('#fx_ani').val() ? $('#fx_ani').val() : "";
    filters.searchList[2]['value'] = revision_number ? revision_number : '';
    filters.searchList[3]['value'] = rfw_code ? rfw_code : '';
    filters.searchList[4]['value'] = rfw_revision_code ? rfw_revision_code : '';
    filters.searchList[5]['value'] = rfw_revision_no ? rfw_revision_no : '';
    filters.searchList[6]['value'] = rfw_radio_no ? rfw_radio_no : '';
    if (filters.searchList[5]['value']) {
        $('#firmware_repository_table').DataTable().order([5, 'asc']).draw();
    } else {
        $('#firmware_repository_table').DataTable().ajax.reload(null, false);
    }
}

$('#firmware_repository_table').DataTable().on("click", "input.select-checkbox", function () {
    let rows = $('#firmware_repository_table').DataTable().rows().nodes();
    if ($("input.select-checkbox").hasClass("selected")) {
        $("input.select-checkbox").removeClass("selected");
        $('input[type="checkbox"]', rows).prop('checked', false);
    } else {
        $("input.select-checkbox").addClass("selected");
        $('input[type="checkbox"]', rows).prop('checked', true);
    }
});

function loadAniMoreData(settings) {
    $('#btn-example-load-more').toggle(this.api().page.hasMore());
}

function remove_btn() {
    let id = $("#fx_rfw_revision_box").find('option:selected').attr("data-id");
    let filepath = $("#fx_rfw_revision_box").find('option:selected').attr("data-filepath");
    if (id) {
        Swal.fire({
            title: 'This will delete the record along with firmware file. Are you sure you want to delete this firmware?',
            text: "",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.value) {
                let data = {fileName: filepath, 'updated_by': localStorage.getItem('subIdUser')};
                sendCaseCloudHTTPRequest("firmwareRepository/updateStatus/" + id, "PUT", data, function (result) {
                    if (result) {
                        toastr.error('delete file successfully');
                        GetFirmwareList();
                        reloadFirmwareTable();
                    }
                });
            }
        });
    } else {
        toastr.error('please select firmware!');
    }
}

$('#btn-example-load-more').on('click', function () {
    $('#firmware_repository_table').DataTable().page.loadMore();
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
    reloadFirmwareTable();
    getCallBoxFirmwareFamily();
    getCallBoxFirmwareRev();
    GetFirmwareList();
});
$(document).on('change', '#fx_firmware_revision_number', function (event) {
    reloadFirmwareTable();
});
$(document).on('change', '#fx_rfw_code', function (event) {
    reloadFirmwareTable();
});
$(document).on('change', '#fx_rfw_revision_box', function (event) {
    reloadFirmwareTable();
});

const sendLiveStatusMessage = (ResponseData) => {
    console.log("updateLiveCallBoxStatusResponseData", ResponseData);
    // ReloadCallBoxHighStatusTable();
};

$("#search-firmware-repository").submit(function (event) {
    event.preventDefault();
    reloadFirmwareTable();
});

$('.resetFn').click(function () {
    $('#fx_ani').val('');
    $('#fx_rfw_code').val('');
    $('#fx_firmware_revision_number').val('');
    reloadFirmwareTable();
});

function GetFirmwareList() {
    let regionId = $("#admin_region_box").find('option:selected').val();
    regionId = regionId ? regionId : '';
    sendCaseCloudHTTPRequest('firmwareRepository/list?region_id=' + regionId, "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let box_html = '<option value="" >None</option>';
            //let box_html = '';
            $.each(ResponseData, function (index, value) {
                let textFirmware = value.firmware_family + '-' + value.firmware_rev + '-' + value.firmware_radio_handler_revision + '-' + value.description;
                box_html += '<option data-bs-toggle="tooltip" data-bs-placement="right" title="' + textFirmware + '" data-filepath="' + value.firmware_file_path + '" data-file="' + value.firmware_file + '"  data-code="' + value.firmware_family + '"  data-id="' + value.id + '" data-name="' + value.firmware_radio_handler_revision + '"  value="' + value.firmware_rev + '" class="" >' + textFirmware + ' </option>';
            });
            $("#fx_rfw_revision_box").html(box_html).select2({placeholder: "None", allowClear: true});
        }
    });
}


function getCallBoxFirmwareFamily() {
    let regionId = $("#admin_region_box").find('option:selected').val();
    regionId = regionId ? regionId : '';
    sendCaseCloudHTTPRequest('firmwareRepository/callBoxFirmwareFamily/list?region_id=' + regionId, "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let rfw_html = '<option value="" >All</option>';
            $.each(ResponseData, function (index, value) {
                rfw_html += '<option  data-code="' + value.firmware_family + '"  data-name="' + value.firmware_family + '"  value="' + value.firmware_family + '" >' + value.firmware_family + '</option>';
            });
            $("#fx_rfw_code").html(rfw_html);
        }
    });
}

function getCallBoxFirmwareRev() {
    let regionId = $("#admin_region_box").find('option:selected').val();
    regionId = regionId ? regionId : '';
    sendCaseCloudHTTPRequest('firmwareRepository/callBoxFirmwareRev/list?region_id=' + regionId, "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let revision_no_html = '<option value="" >All</option>';
            $.each(ResponseData, function (index, value) {
                revision_no_html += '<option  data-code="' + value.firmware_rev + '"  data-name="' + value.firmware_rev + '"  value="' + value.firmware_rev + '" >' + value.firmware_rev + '</option>';
            });
            $("#fx_firmware_revision_number").html(revision_no_html);
        }
    });
}

const openCsvModal = () => {
    $('#importCsvModal').modal('show');
};

jQuery.validator.addMethod("fileregex",  function(value, element, regexp) {
    let check = false;
    return regexp.test(value);
}, "Please check your filename");

$("#import_form").validate({
    rules: {
        description: {
            required: true,
        },
        import_csv: {
            required: true,
            maxlength:17,
            extension: "hex",
            //fileregex : /([a-zA-Z]{2})_([a-zA-Z]{2})([0-9]{8})+\.hex/g, //  /([a-zA-Z]{2})+_([a-zA-Z]{2})+([0-9]{2})+([0-9]{3})+([0-9]{3})+\.hex/g /([a-zA-Z]{2})+_([a-zA-Z]{2})+([0-9]{8})+\.hex/gm ([a-zA-Z]{2})_([a-zA-Z]{2})([0-9]{8})+\.hex
        },
    },
    submitHandler: function (form) {
        let $form = $(form);
        let formData = new FormData();
        let fileContent;
        let params = $form.serializeArray();
        let files = $form.find('[name="import_csv"]')[0].files;
        let fileName = $form.find('[name="import_csv"]').val().split('\\').pop();
        let fName = fileName.replace(/ /g, "_");
        let formParam = {};
        $.each(files, function (i, file) {
            fileContent = file;
            formData.append('file', file);
            formData.append('Content-Type', file.type);
        });
        $.each(params, function (i, val) {
            formParam[val['name']] = val['value'].trim();
            formData.append(val.name, val.value);
        });
        formData.append('created_by', localStorage.getItem('subIdUser'));
        formData.append('updated_by', localStorage.getItem('subIdUser'));

        sendCaseCloudHTTPRequest(`firmwareRepository/create/presignedUrl?file_name=${fName}`, "GET", null, function (response) {
            console.log(response, "Response");
            if (response.data) {
                let responseData = response.data;
                formData.append('firmware_file_path', responseData.firmware_file_path);
                formData.append('presigned_url', responseData.presigned_url);
                formData.append('fileName', responseData.fileName);
                let reqData = {
                    "firmware_file": responseData.fileName,
                    "controller_type": fName.substr(0, 2),
                    "radio_type": fName.substr(3, 2),
                    "system_configuration_code": fName.substr(5, 2),
                    "firmware_rev": fName.substr(7, 3),
                    "firmware_radio_handler_revision": fName.substr(10, 3),
                    "firmware_family": fName.substr(0, 7),
                    "description": formParam.description,
                    "firmware_file_path": responseData.firmware_file_path,
                    "created_by": localStorage.getItem('subIdUser'),
                    "updated_by": localStorage.getItem('subIdUser'),
                    "cf_status": '1'
                };
                uploadFilePreSigned(fileContent, responseData.presigned_url);
                importCallBox(reqData);
            } else {
                console.log("Error File");
                $('#importCsvModal').modal('hide');
            }
        });
    }
});

function importCallBox(formData) {
    sendCaseCloudHTTPRequest("firmwareRepository/create", "POST", formData, function (result) {
        reloadFirmwareTable();
        $('#import_csv').val('');
        $('#import_form')[0].reset();
        $('#importCsvModal').modal('hide');
        GetFirmwareList();
    });
}

function uploadFilePreSigned(files, presigned_url) {
    const config = {
        method: "PUT",
        /* headers: new Headers({
            "Accept": "application/txt"
        }),*/
        headers: {
            "Content-Type": "multipart/form-data"
        },
        body: files,
    };
    return fetch(presigned_url, config)
        .then(response => response.text())
        .then((xml) => {
            console.log("Xm");
            console.log(xml);
        })
        .catch((e) => console.error.bind(console))
}

function pushFirmware() {
    let data = [];
    let firmware_repo_id = $("#fx_rfw_revision_box").find('option:selected').attr("data-id");
    let new_revision_code = $("#fx_rfw_revision_box").find('option:selected').attr("data-code");
    let new_radio_no = $("#fx_rfw_revision_box").find('option:selected').attr("data-name");
    let new_filename = $("#fx_rfw_revision_box").find('option:selected').attr("data-file");
    let new_revision_no = $("#fx_rfw_revision_box").find('option:selected').val();

    let myTable = $('#firmware_repository_table').DataTable();
    let rowCollection = myTable.$(".call-checkbox:checked", {"page": "all"});
    let subIdUser = localStorage.getItem('subIdUser');

    if (firmware_repo_id && rowCollection.length > 0) {
        rowCollection.each(function (index, elem) {
            let insertValue = {};
            let checkbox_value = $(elem).val();
            let pushData = myTable.row(checkbox_value).data();
            let firmware_filename = pushData.current_firmware_filename;
            if (pushData.firmware_family && pushData.firmware_rev && pushData.firmware_radio_handler_revision) {
                firmware_filename = createFirmwareFileName(pushData.firmware_family, pushData.firmware_rev, pushData.firmware_radio_handler_revision);
            }
            console.log(pushData, "pushData");
            insertValue['call_box_id'] = pushData.id;
            insertValue['region_id'] = pushData.TRD.id;
            insertValue['region'] = pushData.region_code;
            insertValue['ani_number'] = pushData.ani_number;
            insertValue['current_firmware_repo_id'] = pushData.id;
            insertValue['current_firmware_family'] = pushData.firmware_family;
            //insertValue['current_system_configuration_code'] = pushData.system_configuration_code;
            insertValue['current_firmware_radio_handler_revision'] = pushData.firmware_radio_handler_revision;
            insertValue['current_firmware_rev'] = pushData.firmware_rev;
            insertValue['current_firmware_filename'] = firmware_filename;
            insertValue['new_firmware_repo_id'] = firmware_repo_id;
            insertValue['new_firmware_family'] = new_revision_code;
            //insertValue['new_system_configuration_code'] = pushData.system_configuration_code;
            insertValue['new_firmware_radio_handler_revision'] = new_radio_no;
            insertValue['new_firmware_rev'] = new_revision_no;
            insertValue['new_firmware_filename'] = new_filename;
            insertValue['created_by'] = subIdUser;
            insertValue['updated_by'] = subIdUser;
            insertValue['date_timestamp'] = (new Date().getTime() / 1000);
            data.push(insertValue);
        });
        console.log(data, " rowCollection  ");
        sendCaseCloudHTTPRequest(`firmwareRepository/pushed/firmware`, "POST", data, function (response) {
            console.log(response, "push firmware ");
            if (response.action === 'createItem') {
                toastr.success('Firmware selected to push on next call.');
                reloadFirmwareTable();
            } else {
                console.log("Error File");
            }
        });
    } else {
        toastr.error('please select firmware and call box!');
    }
}

function firmwarePushedCancel(region_id, call_box_id, region, ani_number) {
    let data = {region_id, call_box_id, region, ani_number};
    sendCaseCloudHTTPRequest("firmwareRepository/pushed/cancel", "POST", data, function (result) {
        reloadFirmwareTable();
    });
}

function firmwarePushedHistory(region_id, call_box_id, region, ani_number) {
    $('.f-add').show();
    $('.f-app').hide();
    $('.f-log-add').hide();
    selected_region_id = region_id;
    selected_call_box_id = call_box_id;
    $('#firmwarePushedRegionName').html(region);
    $('#firmwarePushedAni').html(ani_number);
    reloadFirmwarePushedTable();
    logsTables.firmwarePushedLogsTable();
}

let filtersFirmwarePushed = {
        searchList: [
            {
                "field": "region_id", "operator": "is",
                "value": localStorage.getItem("region_id") ? localStorage.getItem("region_id") : $("select#admin_region_box>option:eq(0)").val()
            },
            {"field": "call_box_id", "operator": "is", "value": ""},
        ]
    },
    columnsFirmwarePushed = [
        {data: 'current_firmware_filename', orderable: true, "width": "15%"},
        {data: 'cf_status', orderable: true, "width": "15%"},
        {data: 'error_reason', orderable: true, "width": "10%",},
        {data: 'requestedName', orderable: true, "width": "10%",},
        {data: 'createdAt', orderable: true, "width": "10%"},
        {data: 'updatedName', orderable: true, "width": "10%"},
        {data: 'updatedAt', orderable: true, "width": "10%"},
        {data: 'fw_update_tries', orderable: true, "width": "10%"},
        {data: 'fw_update_start_date', orderable: true, "width": "10%"},
        {data: 'fw_update_push_date', orderable: true, "width": "10%"},
        {data: 'fw_push_end_date', orderable: true, "width": "10%"},
        {data: 'Action', orderable: false, "width": "10%"},
    ],
    columnDefsFirmwarePushed = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                let edit_html = '';
                edit_html += '<div>' + full.current_firmware_filename + ' > ' + full.new_firmware_filename + '</div>';
                return edit_html;
            }
        },
        {
            "targets": [4],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null && data) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [6],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null && data) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [8],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null && data) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [9],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null && data) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [10],
            render: function (data, type, full, meta) {
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null && data) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [11],
            render: function (data, type, full, meta) {
                let regionId = full.region_id ? full.region_id : '', edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="View" class="btn btn-sm ml-1 btn-primary white-color"  onclick="firmwarePushedLogs(\'' + regionId + '\',\'' + full.call_box_id + '\',\'' + full.id + '\',\'' + full.region + '\',\'' + full.ani_number + '\')"><i class="fa fa-eye"></i></a>';
                return edit_html;
            }
        },
    ],
    orderFirmwarePushed = [4, 'desc'],
    dataTableFirmwarePushed = callCaseCloudDataTable('firmware_pushed_table', 'firmwareRepository/pushed/tableList', filtersFirmwarePushed, columnsFirmwarePushed, null, columnDefsFirmwarePushed, orderFirmwarePushed, null);

// Reload firmware pushed listing
function reloadFirmwarePushedTable() {
    filtersFirmwarePushed.searchList[0]['value'] = selected_region_id ? selected_region_id : '';
    filtersFirmwarePushed.searchList[1]['value'] = selected_call_box_id ? selected_call_box_id : '';
    $('#firmware_pushed_table').DataTable().ajax.reload(null, false);
}

function firmwarePushedLogs(region_id, call_box_id, id, region, ani_number) {
    $('.f-log-add').show();
    $('.f-app').hide();
    $('.f-add').hide();
    selected_region_id = region_id;
    selected_call_box_id = call_box_id;
    selected_log_id = id;
    $('#firmwareLogRegionName').html(region);
    $('#firmwareLogAni').html(ani_number);
    logsTables.reloadFirmwareLogsTable();
}

const logsTables = {
    filtersFirmwareLogs: {
        searchList: [
            {
                "field": "id", "operator": "is",
                "value": selected_log_id ? selected_log_id : ''
            }
        ]
    },
    columnsFirmwareLogs: [
        {data: 'idx', orderable: true, "width": "5%"},
        {data: 'date_time', orderable: true, "width": "10%"},
        {data: 'packet', orderable: true, "width": "85%"},
    ],
    columnDefsFirmwareLogs: [
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let remoteAddress = full.remote_address ? full.remote_address : '',
                    remotePort = full.remote_port ? full.remote_port : '';
                $('#firmwareLogRemoteAddress').html(remoteAddress);
                $('#firmwareLogRemotePort').html(remotePort);
                let timezone = full['timezone'] !== null ? full['timezone'] : 'America/Los_Angeles', dateTime = '';
                if (data != null && data) {
                    return convertUTCToTimezone(data, null, timezone);
                }
                return '';
            }
        },
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                let messagesHtml = '';
                if (data !== null) {
                    messagesHtml += '<div >' + logsTables.getFormattedMessages(full.in_out, data) + '</div>';
                }
                return messagesHtml;
            }
        },
    ],
    orderFirmwareLogs: [1, 'asc'],
    firmwarePushedLogsTable: function () {
        callCaseAlertDataTable('firmware_pushed_logs_table', 'firmwareRepository/logs/tableList', logsTables.filtersFirmwareLogs, logsTables.columnsFirmwareLogs, loadLogMoreData, logsTables.columnDefsFirmwareLogs, logsTables.orderFirmwareLogs, null);
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
    reloadFirmwareLogsTable: function () {
        logsTables.filtersFirmwareLogs.searchList[0]['value'] = selected_log_id ? selected_log_id : '';
        //filtersFirmwareLogs.searchList[1]['value'] = selected_call_box_id ? selected_call_box_id : '';
        $('#firmware_pushed_logs_table').DataTable().ajax.reload(null, false);
    }
};

function loadLogMoreData(settings) {
    //console.log(this.api().page, "  this.api().page ");
    //let page = this.api().page.hasMore() ? this.api().page.hasMore() : null;
    $('#btn-pushed-log-load-more').toggle(this.api().page.hasMore());
}

$('#btn-pushed-log-load-more').on('click', function () {
    $('#firmware_pushed_logs_table').DataTable().page.loadMore();
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
    $('#firmware_pushed_logs_table').dataTable().fnDestroy();
});
$('.backFirmwareLogBtn').click(function (e) {
    $('.f-log-add').hide();
    $('.m-add').hide();
    $('.f-app').hide();
    $('.f-add').show();
});
