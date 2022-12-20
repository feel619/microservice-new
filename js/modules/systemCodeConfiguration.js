
let systemCodeFilters = {
        searchList: [
            {"field": "region_id", "operator": "is", "value": ''},
        ]
    },
    systemCodeColumns = [
        {data: 'system_configuration_code', orderable: true, "width": "10%",},
        {data: 'call_box_type', orderable: true, "width": "10%",},
        {data: 'call_button_type', orderable: true, "width": "10%"},
        {data: 'audio_interface', orderable: true, "width": "10%"},
        {data: 'power_source', orderable: false, "width": "10%"},
        {data: 'internal_tty_device', orderable: true, "width": "10%"},
        {data: 'notes', orderable: true, "width": "30%"},
        {data: 'Action', orderable: true, "width": "10%"},
    ],
    systemCodeColumnDefs = [
        {
            "targets": [7],
            render: function (data, type, full, meta) {
                let edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="Edit" class="btn btn-sm ml-1 btn-primary white-color" onclick="updateSystemCode(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                return edit_html;
            }
        },
    ],
    systemCodeOrder = [1, 'asc'],
    systemCodeDataTable = callCaseAlertDataTable('system_code_table', 'systemConfigurationCode/tableList', systemCodeFilters, systemCodeColumns, '', systemCodeColumnDefs, systemCodeOrder);

// Reload System code listing
function reloadSystemCodeTable() {
    $('#system_code_table').DataTable().ajax.reload(null, false);
}

const sendLiveStatusMessage = (ResponseData) => {
    console.log("updateLiveCallBoxStatusResponseData", ResponseData);
    // ReloadCallBoxHighStatusTable();
};

$('.resetFn').click(function () {
    $('#fx_ani').val('');
    $('#fx_alert_box').val('');
});

//open system code model
const openSystemCodeModal = () => {
    $('#importSystemCodeModal').modal('show');
};

$("#import_system_code_form").validate({
    rules: {
        system_code_csv: {required: true,extension: "csv"},
    },
    submitHandler: function (form) {
        let $form = $(form);
        $("#system_code_csv").parse({
            config: {
                header: true,
                //complete: completeFn,
                error: errorFn,
                skipEmptyLines: true,
            },
            error: function (err, file, inputElem, reason) {
                console.log(err, file, "-before-", inputElem, reason);
            },
            complete: function (results, file) {
                console.log(results,file);
                let formData = new FormData();
                let params = $form.serializeArray();
                let files = $form.find('[name="system_code_csv"]')[0].files;
                let fileName = $form.find('[name="system_code_csv"]').val().split('\\').pop();
                let fName = fileName.replace(/ /g, "_");
                $.each(files, function (i, file) {
                    formData.append('file', file);
                    formData.append('Content-Type', file.type);
                });
                $.each(params, function (i, val) {
                    formData.append(val.name, val.value);
                });
                formData.append('created_by', localStorage.getItem('subIdUser'));
                sendCaseCloudFormRequest(`systemConfigurationCode/import`, "POST", formData, function (response) {
                    console.log(response, "importSystemCodeModal");
                    resetImport();
                });
            }
        });
    }
});
function errorFn() {
    toastr.error('Please check File data!');
    resetImport();
}
function resetImport() {
    $('#system_code_csv').val('');
    $('#import_system_code_form')[0].reset();
    $('#importSystemCodeModal').modal('hide');
    reloadSystemCodeTable();
}

function createSystemCode() {
    $('#form_header').html('Add');
    $('#add_system_code_form')[0].reset();
    $('.system_code_form_div').removeClass('d-none');
    $('.system_code_tab').addClass('d-none');
}

function back() {
    $('#add_system_code_form')[0].reset();
    $("#add_system_code_form").validate().resetForm();
    $('.system_code_form_div').addClass('d-none');
    $('.system_code_tab').removeClass('d-none');
}

$("#add_system_code_form").validate({
    rules: {
        system_configuration_code: {required: true,},
        call_box_type: {required: true,},
        call_button_type: {required: true,},
        audio_interface: {required: true,},
        power_source: {required: true,},
        internal_tty_device: {required: true,},
        notes: {required: true,},
    },
    submitHandler: function (form) {
        let unindexed_array = $(form).serializeArray();
        let data = {};
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
        });
        data['created_by'] = localStorage.getItem('subIdUser');
        if (!data['id']) {
            sendCaseCloudHTTPRequest("systemConfigurationCode/createSystemConfigurationCode", "POST", data, function (result) {
                if (result) {
                    back();
                    reloadSystemCodeTable();
                }
            });
        } else {
            sendCaseCloudHTTPRequest("systemConfigurationCode/updateSystemConfigurationCode/" + data['id'], "PUT", data, function (result) {
                if (result) {
                    back();
                    reloadSystemCodeTable();
                }
            });
        }
    }
});
// Update System code
function updateSystemCode(id) {
    $('.form_header').html('Edit');
    $('#add_system_code_form')[0].reset();
    $('.system_code_form_div').removeClass('d-none');
    $('.system_code_tab').addClass('d-none');
    sendCaseCloudHTTPRequest("systemConfigurationCode/getSystemConfigurationCode/" + id, 'GET', "", function (result) {
        if (result.data) {
            let response = result.data;
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
            $('#system_configuration_code').val(response['system_configuration_code']);
            $('#call_box_type').val(response['call_box_type']);
            $('#call_button_type').val(response['call_button_type']);
            $('#audio_interface').val(response['audio_interface']);
            $('#power_source').val(response['power_source']);
            $('#internal_tty_device').val(response['internal_tty_device']);
            $('#notes').val(response['notes']);
        }
    }, false);
}


const exportCSV = () => {
    const table = $('#system_code_table').DataTable();
    const reqData = JSON.parse(table.ajax.params());
    sendCaseCloudHTTPRequest("systemConfigurationCode/export", "POST", reqData, function (result) {
        if (result) {
            let resultData = result.data;
            let csvContent = 'SystemConfigurationCode,CallBoxType,CallButtonType,AudioInterface,PowerSource,InternalTtyDevice,Notes\r\n';
            let exportData = [];
            resultData.forEach(function (rowArray) {
                let callBoxArray = rowArray;
                callBoxArray['system_configuration_code'] = rowArray['system_configuration_code'] ? rowArray['system_configuration_code'] : ''; // System Configuration Code
                callBoxArray['call_box_type'] = rowArray['call_box_type'] ? rowArray['call_box_type'] : '';// Call Box Type
                callBoxArray['call_button_type'] = rowArray['call_button_type'] ? rowArray['call_button_type'] : '';// Call Button Type
                callBoxArray['audio_interface'] = rowArray['audio_interface'] ? rowArray['audio_interface'] : ''; //Audio Interface
                callBoxArray['power_source'] = rowArray['power_source'] ? rowArray['power_source'] : ''; //Power Source
                callBoxArray['internal_tty_device'] = rowArray['internal_tty_device'] ? rowArray['internal_tty_device'] : ''; //Internal Tty Device
                callBoxArray['notes'] = rowArray['notes'] ? rowArray['notes'] : '';//Notes
                let csvJson = _.pick(callBoxArray, 'system_configuration_code', 'call_box_type', 'call_button_type', 'audio_interface', 'power_source', 'internal_tty_device', 'notes');
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
            let fileName = 'cca-system-configuration-code-' + current_date + '.csv';
            let Name = 'cca-system-configuration-code-' + timestamp;
            link.id = Name;
            link.target = '_blank';
            link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            document.querySelector('#' + Name).click();
        }
    });
};


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
});

