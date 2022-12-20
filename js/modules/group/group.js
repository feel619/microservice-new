var filters = {
        //region_id:region_id
    },
    columns = [
        {data: 'group_name', orderable: true},
        {data: 'region_name', orderable: true},
        {data: 'isTemplate', orderable: true},
        {data: 'cf_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                var checked = full.isTemplate === '1' ? 'Yes' : 'No';
                return checked;
            }
        },
        {
            "targets": [3],
            "visible": (localStorage.getItem('user_type') !== 'viewer'),
            render: function (data, type, full, meta) {
                var edit_html = '';
                if (localStorage.getItem('user_type') === 'region_admin' && full.isTemplate === '1') {
                    edit_html += '';
                } else {
                    var id = full.id;
                    var checked = full.cf_status === '1' ? 'checked' : '';
                    edit_html += '<div class="material-switch"><input id="' + id + '" name="someSwitchOption001" class="checked-box" type="checkbox" ' + checked + ' value="' + id + '"><label for="' + id + '" class="label-primary"></label><p style="display:none;">' + full.cf_status + '</p></div>';
                }
                return edit_html;
            }
        },
        {
            "targets": [4],
            "visible": (localStorage.getItem('user_type') !== 'viewer'),
            render: function (data, type, full, meta) {
                var edit_html = '';
                if (localStorage.getItem('user_type') === 'region_admin' && full.isTemplate === '1') {
                    edit_html += '';
                } else {
                    if (full.cf_status === '3') {
                        edit_html += '<a data-toggle="tooltip" title="Ban" class="btn btn-sm btn-primary white-color" ><i class="fa fa-ban"></i></a>';
                    } else if (full.cf_status === '2') {
                        edit_html += '<a data-toggle="tooltip" title="Edit" class="btn white-color btn-sm btn-primary" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                        edit_html += '<a data-toggle="tooltip" title="Delete" class="btn ml-1 btn-sm btn-danger white-color" onclick="remove_btn(\'' + full.id + '\')"><i class="fa fa-trash"></i></a>';
                    } else {
                        edit_html += '<a data-toggle="tooltip" title="Edit" class="btn white-color btn-sm btn-primary" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                    }
                }
                return edit_html;
            }
        }
    ],
    order = [0, 'asc'],
    dataTable = callDataTable('group_table', 'group/listing', filters, columns, '', columnDefs, order);

const checkModulePermission = () => {
    let user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".user_add_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
        $('.hideRegionAdminAccess').hide();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
    GetRegionList();
}

const AddBtn = () => {
    $('#cardAddOrEdit').html('Add');
    $('#add_group_form')[0].reset();
    $('.hidden_field').html('');
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
}

$('.cancelBtn, .backBtn').click(function () {
    $('#add_group_form')[0].reset();
    var validator = $("#add_group_form").validate();
    validator.resetForm();
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});

function ReloadTable() {
    $('#group_table').DataTable().ajax.reload(null, false);
}

function update_btn(id) {
    $('#cardAddOrEdit').html('Edit');
    $('#add_group_form')[0].reset();
    sendHTTPRequest("group?id=" + id, 'GET', "", function (result) {
        if (result.data) {
            var ResponseData = result.data;
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
            $('#group_name').val(ResponseData['group_name']);
            $('#region_id').val(ResponseData['region_id']);
            console.log(ResponseData.isTemplate, "isTemplate");
            if (ResponseData.isTemplate === "1") {
                $('#isTemplate').prop('checked', true);
            }
            $('.f-add').css('display', 'block');
            $('.f-app').hide();
        }
    }, true);
}

function remove_btn(id) {
    removeData("group/delete", 'DELETE', id, function (data) {
        if (data) {
            ReloadTable();
        }
    }, true);
}

$("#add_group_form").validate({
    rules: {
        group_name: "required",
        region_id: {
            required: function () {
                console.log(localStorage.getItem('user_type') === 'region_admin', "localStorage.getIte ");
                return localStorage.getItem('user_type') === 'region_admin';
            }
        },
    },
    submitHandler: function (form) {
        var unindexed_array = $(form).serializeArray();
        var data = {};
        var isTemplate = $('#isTemplate').prop('checked');
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
            if (n['name'] === 'group_name' && isTemplate) {
                data[n['name']] = 'Template-' + n['value'];
            }
        });
        if (!data['id']) {
            sendHTTPRequest("group/create", "POST", data, function (result) {
                if (result) {
                    $('.cancelBtn, .backBtn').click();
                    ReloadTable();
                }
            });
        } else {
            sendHTTPRequest("group/update?id=" + data['id'], "PUT", data, function (result) {
                if (result) {
                    $('.cancelBtn, .backBtn').click();
                    ReloadTable();
                }
            });
        }
    }
});

$("#group_table").on("change", ".checked-box", function (event) {
    let id = $(event.target).attr('value');
    let data = {};
    if (this.checked) {
        data['cf_status'] = "1";
    } else {
        data['cf_status'] = "2";
    }
    sendHTTPRequest("group/status?id=" + id, "PUT", data, function (result) {
        if (result) {
            ReloadTable();
        }
    }, true);
});
