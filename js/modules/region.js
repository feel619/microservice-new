var filters = {
        //region_id:region_id
    },
    columns = [
        {data: 'region_name', orderable: true},
        {data: 'region_code', orderable: true},
        {data: 'group_name', orderable: false},
        {data: 'system_operator', orderable: true},
        {data: 'projects', orderable: true},
        {data: 'carrier', orderable: true},
        {data: 'wireless_tech', orderable: true},
        {data: 'total_call_box', orderable: false},
        {data: 'report_generation_time', orderable: false},
        {data: 'second_report_call_time', orderable: true},
        {data: 'fail_to_checkin_frequency', orderable: true},
        {data: 'timezone', orderable: true},
        {data: 'cf_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                return full.group_name ? full.group_name : '';
            }
        },
        {
            "targets": [9],
            render: function (data, type, full, meta) {
                return full.second_report_call_time + ' Minutes';
            }
        },
        {
            "targets": [10],
            render: function (data, type, full, meta) {
                return full.fail_to_checkin_frequency === '0' ?
                    _config.failToCheckinFrequency + ' Minutes - <small>Based on system</small>' :
                    full.fail_to_checkin_frequency + ' Minutes - <small>Based on region</small>';
            }
        },
        {
            "targets": [12],
            "visible": (localStorage.getItem('user_type') !== 'viewer'),
            render: function (data, type, full, meta) {
                var id = full.id;
                var checked = full.cf_status === '1' ? 'checked' : '';
                var isDisabled = (localStorage.getItem('user_type') === 'region_admin' ? 'disabled' : '');
                return '<div class="material-switch"><input ' + isDisabled + '  id="' + id + '" name="someSwitchOption001" class="checked-box" type="checkbox" ' + checked + ' value="' + id + '"><label for="' + id + '" class="label-primary"></label><p style="display:none;">' + full.cf_status + '</p></div>';
            }
        },
        {
            "targets": [13],
            "visible": (localStorage.getItem('user_type') === 'admin' ||  localStorage.getItem('user_type') !== 'technician'),
            render: function (data, type, full, meta) {
                let edit_html = '';
                if (localStorage.getItem('user_type') === "admin") {
                    edit_html += '<a data-toggle="tooltip" title="Edit" class="btn white-color btn-sm btn-primary" onclick="updateRegion(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                } else {
                    edit_html += '<a data-toggle="tooltip" title="view" class="btn white-color btn-sm btn-primary" onclick="updateRegion(\'' + full.id + '\')"><i class="fa fa-eye"></i></a>';
                }
                return edit_html;
            }
        }
    ],
    order = [0, 'asc'],
    dataTable = callCaseCloudDataTable('region_table', 'region/tableList', filters, columns, '', columnDefs, order);

bindTimeZone();
let emailSubject = '{{REGION_CODE}} KBC Alert for {{YYYY}}-{{MM}}-{{DD}}';
let emailSignature = 'Thank you,<br/>KBC Answer System Team';
CKEDITOR.replace( 'email_signature' );
CKEDITOR.replace( 'email_text' );
$("#add_region_form").validate({
    rules: {
        region_name: "required",
        region_code: {
            required: true,
            maxlength: 10,
            minlength: 2
        },
        report_generation_time: "required",
        second_report_call_time: "required",
        isAnnotation: "required",
        isDefault: "required",
        battery_low_level: {

        },
        /*  battery_medium_level: {
              min: function () {
                  return parseInt($('#battery_low_level').val());
              }
          },*/
        battery_high_level: {
            min: function () {
                return parseInt($('#battery_low_level').val());
            }
        }
    },
    submitHandler: function (form) {
        var unindexed_array = $(form).serializeArray();
        var data = {};
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
            if (n['name'] === 'region_code') {
                data[n['name']] = n['value'].toUpperCase().replace(/[|~`@#%^*_+{}'"<>\[\]'\\]/g, "");
            }
        });
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
        data['email_text'] = CKEDITOR.instances.email_text.getData();
        data['email_signature'] = CKEDITOR.instances.email_signature.getData();
        if (data['id'] === "") {
            sendCaseCloudHTTPRequest("region/createRegion", "POST", data, function (result) {
                if (result) {
                    back();
                    reloadTable();
                }
            });
        } else {
            sendCaseCloudHTTPRequest("region/updateRegion/" + data['id'], "PUT", data, function (result) {
                if (result) {
                    back();
                    reloadTable();
                }
            });
        }
    }
});

function createRegion() {
    $('#form_header').html('Add');
    $('#add_region_form')[0].reset();
    $('#region_id').val('');
    $('#region_code').attr('readonly', false);
    $('.region_form_div').removeClass('d-none');
    $('.region_table_div').addClass('d-none');
    $('#isDefaultView').hide();
    $('#email_subject').val(emailSubject);
    CKEDITOR.instances['email_signature'].setData(emailSignature);
    CKEDITOR.instances['email_text'].setData();
}

function updateRegion(id) {
    $('#form_header').html('Edit');
    $('#add_region_form')[0].reset();
    sendCaseCloudHTTPRequest("region/getRegion/" + id, 'GET', "", function (result) {
        if (result.data) {
            var response = result.data;
            $('#region_id').val(id);
            $('#isDefaultView').hide();
            $('#region_name').val(response['region_name']);
            $('#region_code').val(response['region_code']).attr('readonly', !!(response['region_code']));
            $('#system_operator').val(response['system_operator']);
            $('#projects').val(response['projects']);
            $('#carrier').val(response['carrier']);
            $('#wireless_tech').val(response['wireless_tech']);
            $("#is_annotation").prop("checked", response['is_annotation'] === '1');
            $("#isDefault").prop("checked", response['isDefault'] === '1');
            $('#fail_to_checkin_day').val(response['fail_to_checkin_day'] != null ? response['fail_to_checkin_day'] : 0);
            $('#fail_to_checkin_hour').val(response['fail_to_checkin_hour'] != null ? response['fail_to_checkin_hour'] : 0);
            $('#fail_to_checkin_minute').val(response['fail_to_checkin_minute'] != null ? response['fail_to_checkin_minute'] : 0);
            $('#battery_low_level').val(response['battery_low_level'] != null ? response['battery_low_level'] : 0);
            //$('#battery_medium_level').val(response['battery_medium_level'] != null ? response['battery_medium_level'] : 0);
            $('#battery_high_level').val(response['battery_high_level'] != null ? response['battery_high_level'] : 0);
            $('#report_generation_time').val(response['report_generation_time']);
            $('#second_report_call_time').val(response['second_report_call_time']);
            $('#apn_level').val(response['apn_level']);
            let email_subject = response['email_subject'] ? response['email_subject'] : emailSubject;
            let email_signature = response['email_signature'] ? response['email_signature'] : emailSignature;
            CKEDITOR.instances['email_signature'].setData(email_signature);
            CKEDITOR.instances['email_text'].setData(response['email_text']);
            $('#email_subject').val(email_subject);
            $("#timezone").val(response['timezone']).trigger("change");
            $('.region_form_div').removeClass('d-none');
            $('.region_table_div').addClass('d-none');
        }
    }, false);
}

function back() {
    $('#add_region_form')[0].reset();
    $("#add_region_form").validate().resetForm();
    $('.region_form_div').addClass('d-none');
    $('.region_table_div').removeClass('d-none');
}

function reloadTable() {
    $('#region_table').DataTable().ajax.reload(null, false);
}

$("#region_table").on("change", ".checked-box", function (event) {
    var id = $(event.target).attr('value');
    sendCaseCloudHTTPRequest("region/updateRegion/" + id, "PUT", {'cf_status': this.checked ? "1" : "2"}, function (result) {
        if (result) {
            reloadTable();
        }
    }, true);
});

function checkModulePermission() {
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

function bindTimeZone() {
    let html = '';
    getTimeZoneList().forEach(function (value, index) {
        html += '<option value="'+ value +'">' + value + '</option>';
    });
    $('#timezone').append(html).select2({
        placeholder: "Select TimeZone",
        allowClear: true
    });
}


