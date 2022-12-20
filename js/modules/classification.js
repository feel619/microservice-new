var data = {
    UserPoolId: _config.cognito.userPoolId,
};
var subIdUser = localStorage.getItem("subIdUser");
GetRegionList();

$("#add_classification_form").validate({
    rules: {
        classification_name: "required",
        classification_type: "required",
        classification_order: "required",
        classification_region: "required"
    },
    submitHandler: function (form) {
        var unindexed_array = $(form).serializeArray();
        var arr = $("#region_id").val();
        var region_id = '';
        if (arr.length > 0) {
            var region_id = arr.toString();
        } else {
            $("#region_id").addClass('invalid');
        }
        var data = {};
        $.map(unindexed_array, function (n, i) {
            if (n['name'] === 'classification_region') {
                n['value'] = region_id
            }
            data[n['name']] = n['value'];
        });
        let classificationTypeName = $("#classification_type").find('option:selected').attr("data-name");
        let classification_types = {
            id: data['classification_type'],
            name: classificationTypeName
        };
        data['classification_type'] = classification_types;
        if (data['email'] !== 'casesystem@casees.com') {
            if (!data['id']) {
                sendHTTPRequest("classification/create", "POST", data, function (result) {
                    if (result) {
                        $('.cancelBtn, .backBtn').click();
                        ReloadUserTable();
                    }
                });
            } else {
                sendHTTPRequest("classification/update?id=" + data['id'], "PUT", data, function (result) {
                    if (result) {
                        $('.cancelBtn, .backBtn').click();
                        ReloadUserTable();
                    }
                });
            }
        } else {
            toastr.error("You Can't Change master administrator!");
        }
    }
});

function add_btn() {
    $('.hidden_field').html('');
    $(".edit_box").show();
    $('#add_classification_form')[0].reset();
    var region_select = $("#region_id option:eq(1)").val();
    $("#region_id").val([region_select]).trigger("change");
    $("#classification_type").prop("selectedIndex", 1);
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
}

$('.cancelBtn, .backBtn').click(function () {
    $('#add_classification_form')[0].reset();
    var validator = $("#add_classification_form").validate();
    validator.resetForm();
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});
var filters = {
        //    region_id:region_id
    }, columns = [
        {data: 'classification_name', orderable: true},
        {data: 'classification_type', orderable: true},
        {data: 'classification_region', orderable: true},
        {data: 'classification_order', orderable: true},
        {data: 'cf_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                var region_box = '';
                var region_list = full.region_list;
                region_box += '<div class="">';
                region_list.forEach(function (value, index) {
                    var region = value['region_name'];
                    region_box += '<label class="">' + region + ', </label>';
                });
                region_box += '</div>';
                return region_box;
            }
        },
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                var classification_type = full.classification_type.name;
                return classification_type;
            }
        },
        {
            "targets": [4],
            "visible": (localStorage.getItem('user_type') === 'admin'),
            render: function (data, type, full, meta) {
                var id = full.id;
                var checked = full.cf_status === '1' ? 'checked' : '';
                var status_box = '';
                status_box = '<div class="material-switch"><input id="' + id + '" name="someSwitchOption001" class="checked-box" type="checkbox" ' + checked + ' value="' + id + '"><label for="' + id + '" class="label-primary"></label><p style="display:none;">' + full.cf_status + '</p></div>';
                return status_box;
            }
        },
        {
            "targets": [5],
            "visible": (localStorage.getItem('user_type') === 'admin'),
            render: function (data, type, full, meta) {
                var edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="Edit" class="btn btn-sm btn-primary white-color" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';

                return edit_html;
            }
        }
    ],
    order = [0, 'asc'],
    dataTable = callDataTable('classification_table', 'classification/listing', filters, columns, '', columnDefs, order);

function ReloadUserTable() {
    $('#classification_table').DataTable().ajax.reload();
}

function update_btn(id) {
    $('#add_classification_form')[0].reset();
    sendHTTPRequest("classification?id=" + id, 'GET', "", function (result) {
        if (result.data) {
            var ResponseData = result.data;
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
            renderData(ResponseData);
        }
    }, true);
}

function renderData(ResponseData) {
    $('#region_id').attr("disabled", false);
    $('#classification_name').val(ResponseData['classification_name']);
    $('#classification_type').val(ResponseData['classification_type'].id);
    $('#classification_order').val(ResponseData['classification_order']);
    var region_id = ResponseData['classification_region'];
    var region_arr = region_id.split(",");
    $('#region_id').val(region_arr);
    $('#region_id').trigger('change');
    $(".edit_box").hide();
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
}


function remove_btn(id, email) {
    var param = {};
    param['id'] = data.UserPoolId;
    param['Username'] = email;
    removeCognitoUserData("classification?id=" + id, 'DELETE', param, function (result) {
        if (result) {
            ReloadUserTable();
            doSocketStatusUpdate(id, "2");
        }
    }, true);
}

$("#classification_table").on("change", ".checked-box", function (event) {
    var id = $(event.target).attr('value');
    var data = {};
    if (this.checked) {
        data['cf_status'] = "1";
    } else {
        data['cf_status'] = "2";
    }
    sendHTTPRequest("classification/status?id=" + id, "PUT", data, function (result) {
        if (result) {
            ReloadUserTable();
        }
    }, true);
});


$('#region_id').select2({
    placeholder: "Please select Region",
    allowClear: false
});
$('#region_id').val(null).trigger('change');

$("#selectAllCheckbox").click(function () {
    if ($("#selectAllCheckbox").is(':checked')) {
        $("#region_id > option").prop("selected", "selected");
        $("#region_id").trigger("change");
    } else {
        $("#region_id > option").removeAttr("selected");
        $("#region_id").trigger("change");
    }
});

function checkModulePermission() {
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".user_add_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

