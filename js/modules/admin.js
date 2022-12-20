var data = {
    UserPoolId: _config.cognito.userPoolId,
};
var subIdUser = localStorage.getItem("subIdUser");
let userRegionData = [];
GetRegionList();

$.validator.addMethod("pwcheck", function (value) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{6,30}$/.test(value)
    //  /^[A-Za-z0-9\d=!\-@._*]*$/.test(value) // consists of only these
    //  && /[a-z]/.test(value) // has a lowercase letter
    //  && /\d/.test(value)
    //  has a digit Invalid Password, <br/> 1] Min 1 uppercase letter.<br/>  2] Min 1 lowercase letter.<br/>   3] Min 1 special character.<br/>  4] Min 1 number.
}, "Password not match with Password Policy.");

jQuery.validator.addMethod("phoneUS", function (phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || phone_number.length > 9 &&
        phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

$("#add_user_form").validate({
    rules: {
        email: {
            required: true,
            email: true
        },
        name: "required",
        phone_number: {
            required: true,
            minlength: 10,
            maxlength: 10
            //    phoneUS: true
        },
        password: {
            minlength: 8,
            pwcheck: true
        },
        admin_confirm_password: {
            minlength: 8,
            equalTo: "#password"
        },
        user_type: "required",
        region: "required"
    },
    submitHandler: function (form) {
        let unindexed_array = $(form).serializeArray();
        let arr = $("#region_id").val();
        let region_id = '';
        if (arr && arr.length > 0) {
            region_id = arr.toString();
        } else {
            $("#region_id").addClass('invalid');
        }
        let data = {};
        data = $('input[name^="notify_alert\\["]').serializeControls();
        $.map(unindexed_array, function (n, i) {
            let name = n['name'];
            if (name.indexOf('notify_alert') === -1) {
                if (n['name'] === 'region') {
                    n['value'] = region_id
                }
                data[n['name']] = n['value'];
            }
        });
        (data['user_type'] === 'admin' || data['user_type'] === 'technician' ? data['region'] = 'All' : '');
        data['region_ids'] = arr;
        data['created_by'] = localStorage.getItem('subIdUser');
        delete data['admin_confirm_password'];
        let userId = data['id'];
        if (data['email'] !== 'casesystem@casees.com') {
            if (!userId) {
                sendCaseCloudHTTPRequest("users/createUsers", "POST", data, function (result) {
                    if (result) {
                        $('.cancelBtn, .backBtn').click();
                        ReloadUserTable();
                    }
                });
            } else {
                if (subIdUser !== userId) {
                    delete data['password'];
                    delete data['email'];
                    delete data['id'];
                    sendCaseCloudHTTPRequest("users/updateUsers/" + userId, "PUT", data, function (result) {
                        if (result) {
                            $('.cancelBtn, .backBtn').click();
                            ReloadUserTable();
                        }
                    });
                } else {
                    toastr.error("You Can't Change Your Own Account!");
                }
            }
        } else {
            toastr.error("You Can't Change master administrator!");
        }
    }
});

$("#setUserPasswordForm").validate({
    rules: {
        set_email: {
            required: true,
            email: true
        },
        set_new_password: {
            minlength: 8,
            pwcheck: true
        },
        set_confirm_password: {
            minlength: 8,
            equalTo: "#set_new_password"
        },
    },
    submitHandler: function (form) {
        console.log(form, "setUserPassword");
        var unindexed_array = $(form).serializeArray();
        var data = {};
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'];
        });
        console.log("set", data);
        if (data['set_email'] !== 'casesystem@casees.com') {
            if (subIdUser !== data['id']) {
                sendCaseCloudHTTPRequest("users/reset/password", "PUT", data, function (result) {
                    console.log(result, " users/reset/password ");
                    if (result) {
                        toastr.success("Password reset email sent!");
                        $('#setUserPassword').modal('hide');
                    }
                });
            } else {
                toastr.error("You Can't Change Your Own Account!");
            }
        } else {
            toastr.error("You Can't Change master administrator!");
        }
    }
});

function add_btn() {
    $('.hidden_field').html('');
    $('#cardAddOrEdit').html('Add');
    $(".edit_box").show();
    $(".set-password").hide();
    $('#add_user_form')[0].reset();
    $('#setUserPasswordForm')[0].reset();
    // let region_select = $("#region_id option:eq(1)").val();
    // $("#region_id").val([region_select]).trigger("change");
    // $("#user_type").prop("selectedIndex", 1);
    userTypeChange();
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
}

$('.cancelBtn, .backBtn').click(function () {
    userRegionData = [];
    $('#add_user_form')[0].reset();
    var validator = $("#add_user_form").validate();
    validator.resetForm();
    $('#setUserPasswordForm')[0].reset();
    $("#region_id").val(['']).trigger("change");
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});
var filters = {
        searchList: [
            {"field": "name", "operator": "is", "value": ''},
        ],
        search: {value: "", regex: false},
    },
    columns = [
        {data: 'live_status', orderable: false},
        {data: 'email', orderable: true},
        {data: 'name', orderable: true},
        {data: 'phone_number', orderable: true},
        {data: 'user_type', orderable: true},
        {data: 'confirm_status', orderable: true},
        {data: 'system_operator', orderable: false},
        {data: 'region', orderable: false},
        {data: 'cf_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                let activeInActive = '';
                let live_status = 'deactive';
                let tooltip = ((live_status === 'active') ? 'Online' : "Offline");
                activeInActive += '<div class="ring-container">';
                activeInActive += '    <div data-toggle="tooltip" data-placement="top" title="' + tooltip + '" class="' + live_status + '_circle"></div>';
                activeInActive += '    <span style="display:none;">' + live_status + '</span>';
                activeInActive += '</div>';
                return activeInActive;
            }
        },
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let email = full.email;
                return '<a href="mailto:' + email + '">' + email + '</a>';
            }
        },
        {
            "targets": [4],
            render: function (data, type, full, meta) {
                return (full.user_type === 'viewer') ? 'Operator' : full.user_type;
            }
        },
        {
            "targets": [5],
            render: function (data, type, full, meta) {
                return (full.confirm_status === '0') ? 'Yes' : 'No';
            }
        },
        {
            "targets": [6],
            render: function (data, type, full, meta) {
                let system_operator_box = '';
                let region_list = full.TUR;
                system_operator_box += '<div class="region_list text-cvs-wrap">';
                region_list.forEach(function (value, index, array) {
                    let userRegion = value.TRU;
                    let system_operator = userRegion['system_operator'] !== undefined ? userRegion['system_operator'] : '';
                    system_operator_box += '<label class="">' + system_operator;
                    if (index !== array.length - 1) {
                        system_operator_box += ',';
                    }
                    system_operator_box += '</label>';
                });
                system_operator_box += '</div>';
                return system_operator_box;
            }
        },
        {
            "targets": [7],
            render: function (data, type, full, meta) {
                let region_box = '';
                if (full.user_type === 'admin' || full.user_type === 'technician') {
                    region_box += '<div class="region_list">';
                    region_box += '<label class="">All</label>';
                    region_box += '</div>';
                } else {
                    let region_list = full.TUR;
                    region_box += '<div class="region_list text-cvs-wrap">';
                    region_list.forEach(function (value, index, array) {
                        let userRegion = value.TRU;
                        region_box += '<label class="">' + userRegion.region_code;
                        if (index !== array.length - 1) {
                            region_box += ',';
                        }
                        region_box += '</label>';
                    });
                    region_box += '</div>';
                }
                return region_box;
            }
        },
        {
            "targets": [8],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let id = full.id;
                let checked = full.cf_status === '1' ? 'checked' : '';
                let status_box = '';
                let isDisabled = (localStorage.getItem('user_type') === 'project' || localStorage.getItem('user_type') === 'technician' ? 'disabled' : '');
                if (full.email !== 'casesystem@casees.com') { //&& full.sub !== subIdUser
                    status_box = '<div class="material-switch"><input ' + isDisabled + ' id="' + id + '" name="someSwitchOption001" class="checked-box" type="checkbox" ' + checked + ' value="' + id + '"><label for="' + id + '" class="label-primary"></label><p style="display:none;">' + full.cf_status + '</p></div>';
                }
                return status_box;
            }
        },
        {
            "targets": [9],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let edit_html = '';
                if (full.email !== 'casesystem@casees.com') { //&& full.sub !== subIdUser
                    edit_html += '<a data-toggle="tooltip" title="Edit" class="btn btn-sm btn-primary white-color" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                }
                return edit_html;
            }
        }
    ],
    order = [1, 'asc'],
    dataTable = callCaseCloudDataTable('user_table', 'users/tableList', filters, columns, '', columnDefs, order);

function ReloadUserTable() {
    filters.search['value'] = $('#user_search').val() ? $('#user_search').val() : "";
    $('#user_table').DataTable().ajax.reload(null, false);
}

$("#userSearch input").on("keyup", function (event) {
    let search = event.target.value;
    ReloadUserTable();
});

function update_btn(id) {
    $('#cardAddOrEdit').html('Edit');
    $(".set-password").show();
    $('#add_user_form')[0].reset();
    $('#setUserPasswordForm')[0].reset();
    sendCaseCloudHTTPRequest("users/getUser/" + id, 'GET', "", function (result) {
        if (result.data) {
            var ResponseData = result.data;
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
            renderData(ResponseData);
        }
    }, true);
}

function update_user_type_btn(id) {
    var param = {
        user_type: 'region_admin'
    };
    sendCaseCloudHTTPRequest("users/type/update?id=" + id, 'PUT', param, function (result) {
        if (result.data) {
            var ResponseData = result.data;
            console.log(ResponseData);
            ReloadUserTable();
        }
    }, true);
}

function renderData(ResponseData) {
    $('#region_id').attr("disabled", false);
    $("#region_id").prop("disabled", false);
    $('#email').val(ResponseData['email']);
    $('#set_email').val(ResponseData['email']);
    $('#name').val(ResponseData['name']);
    let r_user_type = ResponseData['user_type'];
    $('#user_type').val(r_user_type);
    $('#phone_number').val(ResponseData['phone_number']);

    userTypeChange();
    let region_list = ResponseData['TUR'];
    if (r_user_type === 'admin' || r_user_type === 'technician') {
        $('#region_id').attr("disabled", true);
    }
    let region_arr = [];
    region_list.forEach(function (value, index, array) {
        let regionData = value['TRU'];
        region_arr.push(regionData.id);
        userRegionData[regionData.id] = value;
    });
    $('#region_id').val(region_arr);
    /*region_list.forEach(function (value, index, array) {
        let regionData = value['TRU'];
        userRegionData[regionData.id]= value;
    });*/
    $('#region_id').trigger('change');
    $("#alert_email").prop("checked", ResponseData['alert_email'] === '1');
    $("#voice_call_email").prop("checked", ResponseData['voice_call_email'] === '1');
    $("#voice_text_email").prop("checked", ResponseData['voice_text_email'] === '1');
    $("#tty_call_email").prop("checked", ResponseData['tty_call_email'] === '1');
    $("#tty_text_email").prop("checked", ResponseData['tty_text_email'] === '1');
    $('#user_type').attr("disabled", false);
    if (ResponseData.sub === subIdUser) {
        $('#user_type').attr("disabled", true);
        $("#region_id").prop("disabled", true);
    }
    $(".edit_box").hide();
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
}

function isAlreadyMember() {
    var email = $('#email').val();
    var param = {
        email: email.toLowerCase()
    };
    sendCaseCloudHTTPRequest("users/exists", 'POST', param, function (result) {
        $('.hidden_field').html('');
        if (result.data) {
            var ResponseData = result.data;
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + ResponseData.id + '" />');
            renderData(ResponseData);
        }
    }, true);
}

$(function () {
    $("#alert_email_all").on("click", function () {
        $('input.alert_email_check').prop('checked', $(this).prop("checked"));
    });
    $("#voice_call_email_all").on("click", function () {
        $('input.voice_call_email_check').prop('checked', $(this).prop("checked"));
    });
    $("#voice_text_email_all").on("click", function () {
        $('input.voice_text_email_check').prop('checked', $(this).prop("checked"));
    });
    $("#tty_call_email_all").on("click", function () {
        $('input.tty_call_email_check').prop('checked', $(this).prop("checked"));
    });
    $("#tty_text_email_all").on("click", function () {
        $('input.tty_text_email_check').prop('checked', $(this).prop("checked"));
    });
});

$(document).on('change', '#region_id', function () {
    let region_ids = [];
    var id_type = $("#user_type").val();
    let regionEmailAuth = ``;
    if (id_type === 'admin' || id_type === 'technician') {
        for (var key in regionList) {
            //console.log(key);
            regionEmailAuth += regionAlertRender(regionList[key]);
        }
    } else {
        region_ids = $('#region_id').val();

        for (var key in region_ids) {
            let regionId = region_ids[key];
            regionEmailAuth += regionAlertRender(regionList[regionId]);
        }
    }
    $('#regionEmailPermission').html(regionEmailAuth);
});

function regionAlertRender(value) {
    if (value) {
        let userRes = userRegionData[value.id] ? userRegionData[value.id] : {};
        return `<tr role="row" class="odd">
            <td>${value.region_name}</td>
            <td >
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.id}][alert_email]" type="hidden" value="2">
                    <input ${userRes.alert_email === '1' ? 'checked' : ''} id="alert_email_${value.id}" name="notify_alert[${value.id}][alert_email]" class="checked-box alert_email_check" type="checkbox" value="1">
                    <label for="alert_email_${value.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.id}][voice_call_email]" type="hidden" value="2">
                    <input ${userRes.voice_call_email === '1' ? 'checked' : ''}  id="voice_call_email_${value.id}" name="notify_alert[${value.id}][voice_call_email]" class="checked-box voice_call_email_check" type="checkbox" value="1">
                    <label for="voice_call_email_${value.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.id}][voice_text_email]" type="hidden" value="2">
                    <input ${userRes.voice_text_email === '1' ? 'checked' : ''}  id="voice_text_email_${value.id}" name="notify_alert[${value.id}][voice_text_email]" class="checked-box voice_text_email_check" type="checkbox" value="1">
                    <label for="voice_text_email_${value.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.id}][tty_call_email]" type="hidden" value="2">
                    <input ${userRes.tty_call_email === '1' ? 'checked' : ''} id="tty_call_email_${value.id}" name="notify_alert[${value.id}][tty_call_email]" class="checked-box tty_call_email_check" type="checkbox" value="1">
                    <label for="tty_call_email_${value.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.id}][tty_text_email]" type="hidden" value="2">
                    <input ${userRes.tty_text_email === '1' ? 'checked' : ''} id="tty_text_email_${value.id}" name="notify_alert[${value.id}][tty_text_email]" class="checked-box tty_text_email_check" type="checkbox" value="1">
                    <label for="tty_text_email_${value.id}" class="label-primary"></label>
                </div>
            </td>
            </tr>`;
    } else {
        return '';
    }
}

function remove_btn(id, email) {
    var param = {};
    param['id'] = data.UserPoolId;
    param['Username'] = email;
    removeCognitoUserData("user?id=" + id, 'DELETE', param, function (result) {
        if (result) {
            ReloadUserTable();
            doSocketStatusUpdate(id, "2");
        }
    }, true);
}

$("#user_table").on("change", ".checked-box", function (event) {
    var id = $(event.target).attr('value');
    var data = {};
    if (this.checked) {
        data['cf_status'] = "1";
    } else {
        data['cf_status'] = "2";
    }
    sendCaseCloudHTTPRequest("users/updateUsers/" + id, "PUT", data, function (result) {
        if (result) {
            ReloadUserTable();
            //doSocketStatusUpdate(id,data['cf_status']);
        }
    }, true);
});
$(document).on("change", "#user_type", function (event) {
    userTypeChange();
});

function userTypeChange() {
    var id_type = $("#user_type").val();
    if (id_type === 'admin' || id_type === 'technician') {
        $("#admin_region_view").show();
        $("#region_view").hide();
        $('#region_id').attr("disabled", true);
        $('#region_id').select2("val", "0");//.val(null).trigger('change');
    } else {
        $("#admin_region_view").hide();
        $("#region_view").show();
        $('#region_id').attr("disabled", false);
    }
}

$('#region_id').select2({
    placeholder: "Please select Region",
    allowClear: false
});
$('#region_id').val(null).trigger('change');

$(".toggle-password").click(function () {
    $(this).toggleClass("fa-eye fa-eye-slash");
    var Pwd_view = document.getElementById("password");
    var conPwd_view = document.getElementById("admin_confirm_password");
    if (Pwd_view.type === "password") {
        Pwd_view.type = "text";
        conPwd_view.type = "text";
    } else {
        Pwd_view.type = "password";
        conPwd_view.type = "password";
    }
});
const deActiveChatCall = (publisherData) => {
    stopInviteAudio();
    clearTimeout(ringTimeOut);
};

function checkModulePermission() {
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".user_add_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    // if (user_type === "region_admin") {
    //     $("#user_type option[value='" + user_type + "']").remove();
    // }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

function resetPassword() {
    $('#set_new_password').val('');
    $('#set_confirm_password').val('');
    $('#setUserPassword').modal('show');
}

