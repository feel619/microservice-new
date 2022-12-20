let groupId = '';
$("#add_shortcuts_form").validate({
    rules: {
        special_keys: {
            required: true
        },
        shortcut_key: {
            required: true
        },
        message: "required",
        group_id: "required"
    },
    messages: {
        special_keys: {
            required: "Please select special keys.",
        },
        shortcut_key: {
            required: "Please select minimum 1 Keys.",
        },
    },
    errorPlacement: function (error, element) {
        if (element.attr("name") === "special_keys") {
            error.insertAfter("#special_keys");
        } else if (element.attr("name") === "shortcut_key") {
            error.insertAfter("#shortcut_key");
        } else {
            error.insertAfter(element);
        }
    },
    submitHandler: function (form) {
        var unindexed_array = $(form).serializeArray();
        var data = {};
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
            if (n['name'] === 'message') {
                data[n['name']] = n['value'].toUpperCase().replace(/[|~`@#%^*_+{}'"<>\[\]'\\]/g, "");
            }
            /*if(n['name'] === 'group_id'){
                data[n['name']] = $("#group_id").val().toString();
            }*/
        });
        var shortcutKey = '';
        $('input[name="special_keys"]:checked').each(function () {
            shortcutKey += this.value + '+';
        });
        var mergeShortcutKey = shortcutKey + data['shortcut_key'];
        data['shortcut_key'] = mergeShortcutKey;
        //data['region_name'] = region;
        data['group_name'] = $('#group_id option:selected').text().toLowerCase();
        console.log("SHORTCUT_KEY_DATA", data);
        if (!data['id']) {
            sendHTTPRequest("shortcuts/create", "POST", data, function (result) {
                if (result) {
                    $('.cancelBtn, .backBtn').click();
                    ReloadShortcutTable();
                }
            });
        } else {
            sendHTTPRequest("shortcuts/update?id=" + data['id'], "PUT", data, function (result) {
                if (result) {
                    $('.cancelBtn, .backBtn').click();
                    ReloadShortcutTable();
                }
            });
        }
    }
});

const copyGroup = () => {
    if (groupId) {
        // let groupName = $('#admin_group_box option:selected').text().replace(/\s/g, '_').toLowerCase();
        // let region_id = $('#region_id').val();
        $('#add_group_form')[0].reset();
        $('#editGroupModal').modal('show');
    } else {
        toastr.error('Please select group!');
    }
};
const editGroup = () => {
    if (groupId) {
        sendHTTPRequest("group?id=" + groupId, 'GET', "", function (result) {
            if (result.data) {
                var ResponseData = result.data;
                $('#editGroupModal').modal('show');
                $('.group_hidden_field').html('<input type="hidden" name="group_hidden_id" id="group_hidden_id" value="' + groupId + '" />');
                $('#group_name').val(ResponseData['group_name']);
                var selectedRegionBox = ResponseData['region_id'] ? ResponseData['region_id'] : '';
                $('#region_id').val(selectedRegionBox);
                GroupList();
            }
        }, true);
    } else {
        toastr.error('Please select group!');
    }
};
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
        var indexed_array = $(form).serializeArray();
        var data = {};
        var isTemplate = $('#isTemplate').prop('checked');
        $.map(indexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
            if (n['name'] === 'group_name' && isTemplate) {
                data[n['name']] = 'Template-' + n['value'];
            }
        });
        let url = "shortcuts/copy";
        data['group_id'] = groupId;
        sendHTTPRequest(url, "POST", data, function (result) {
            $('#editGroupModal').modal('hide');
            console.log(result, " add_group_form ");
            GroupList(result.data.id);
            groupId = (result.data.id) ? result.data.id : groupId;
            ReloadShortcutTable();
        });
    }
});
//GroupList
const GroupList = (selId = "") => {
    let url = "group/listing";
    sendHTTPRequest(url, "POST", "", function (result) {
        if (result) {
            var ResponseData = result.data;
            var admin_region_box_html = '<option value="" >Select Group</option>';
            var region_box_html = '<option value="" >Select Group</option>';
            ResponseData.map((group) => {
                let selectedText = "";
                if (group.cf_status === "1") {
                    if (selId === group.id) {
                        selectedText = "selected"
                    }
                    admin_region_box_html += '<option data-name="' + group.group_name + '" value="' + group.id + '" ' + selectedText + '>' + group.group_name + '</option>';
                    if (localStorage.getItem('user_type') === 'region_admin' && group.isTemplate === '2') {
                        region_box_html += '<option data-name="' + group.group_name + '" value="' + group.id + '" ' + selectedText + '>' + group.group_name + '</option>';
                    } else if (localStorage.getItem('user_type') === 'admin') {
                        region_box_html += '<option data-name="' + group.group_name + '" value="' + group.id + '" ' + selectedText + '>' + group.group_name + '</option>';
                    }
                }
            });
            $("#group_id").html(region_box_html);
            $("#admin_group_box").html(admin_region_box_html);
        }
    });
};
GroupList();
$(document).on('change', '#admin_group_box', function (event) {
    var id = $(this).val();
    console.log("admin_group_box", id);
    groupId = id;
    ReloadShortcutTable();
});

function add_btn() {
    $('#cardAddOrEdit').html('Add');
    $('#add_shortcuts_form')[0].reset();
    $('.hidden_field').html('');
    $("#group_id").val(groupId);
    $('.f-add').css('display', 'block');
    $('.f-app').hide();
}

$('.cancelBtn, .backBtn').click(function () {
    $('#add_shortcuts_form')[0].reset();
    var validator = $("#add_shortcuts_form").validate();
    validator.resetForm();
    $("#admin_group_box").val(groupId);
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});
var filters = {
        group_id: groupId
    },
    columns = [
        // {data: 'id', orderable: true},
        {data: 'region_name', orderable: true},
        {data: 'shortcut_key', orderable: true},
        {data: 'message', orderable: true},
        {data: 'cf_status', orderable: true},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [0],
            render: function (data, type, full, meta) {
                return full.groups.group_name ? full.groups.group_name : '';
            }
        },
        {
            "targets": [3],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let edit_html = '';
                if ((localStorage.getItem('user_type') === 'region_admin' || localStorage.getItem('user_type') === 'project') && full.groups.isTemplate === '1') {
                    edit_html += '';
                } else {
                    let id = full.id;
                    let checked = full.cf_status === '1' ? 'checked' : '';
                    let isDisabled = (localStorage.getItem('user_type') === 'project' || localStorage.getItem('user_type') === 'technician' ? 'disabled' : '');
                    edit_html += '<div class="material-switch"><input '+isDisabled+' id="' + id + '" name="someSwitchOption001" class="checked-box" type="checkbox" ' + checked + ' value="' + id + '"><label for="' + id + '" class="label-primary"></label><p style="display:none;">' + full.cf_status + '</p></div>';
                }
                return edit_html;
            }
        },
        {
            "targets": [4],
            "visible": (localStorage.getItem('user_type') !== 'viewer' && localStorage.getItem('user_type') !== 'observer'),
            render: function (data, type, full, meta) {
                let edit_html = '';
                console.log(localStorage.getItem('user_type'),"ShortCut isTemplate",full);
                if ((localStorage.getItem('user_type') === 'region_admin' || localStorage.getItem('user_type') === 'project') && full.groups.isTemplate === '1') {
                    edit_html += '';
                } else {
                    if (full.cf_status === '3') {
                        edit_html += '<a data-toggle="tooltip" title="Ban" class="btn btn-sm btn-primary white-color" ><i class="fa fa-ban"></i></a>';
                    } else if (full.cf_status === '2') {
                        edit_html += '<a data-toggle="tooltip" title="Edit" class="btn white-color btn-sm btn-primary" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                        if(localStorage.getItem('user_type') === 'admin') { edit_html += '<a data-toggle="tooltip" title="Delete" class="btn ml-1 btn-sm btn-danger white-color" onclick="remove_btn(\'' + full.id + '\')"><i class="fa fa-trash"></i></a>';}
                    } else {
                        edit_html += '<a data-toggle="tooltip" title="Edit" class="btn white-color btn-sm btn-primary" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-edit"></i></a>';
                    }
                }
                return edit_html;
            }
        }
    ],
    order = [0, 'asc'],
    dataTable = callDataTable('shortcuts_table', 'shortcuts/listing', filters, columns, '', columnDefs, order);

function ReloadShortcutTable() {
    filters['group_id'] = groupId;
    $('#shortcuts_table').DataTable().ajax.reload(null, false);
}

function update_btn(id) {
    $('#cardAddOrEdit').html('Edit');
    $('#add_shortcuts_form')[0].reset();
    GroupList();
    sendHTTPRequest("shortcuts?id=" + id, 'GET', "", function (result) {
        if (result.data) {
            var ResponseData = result.data;
            $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
            $('#shortcut_name').val(ResponseData['shortcut_name']);
            var shortcut_key = ResponseData['shortcut_key'];
            var shortcutKey = shortcut_key.split("+");
            shortcutKey.forEach(function (value, index) {
                $('input[value="' + value + '"]').prop('checked', true);
            });
            $('#message').val(ResponseData['message']);
            //$('#region_id').val(ResponseData['region_id']);
            $('.f-add').css('display', 'block');
            $('.f-app').hide();
            setTimeout(() => {
                let group_id = (ResponseData['group_id']) ? ResponseData['group_id'] : '';
                console.log("update_btn_group_id", group_id);
                $("#group_id").val(group_id);
                $("#group_id").trigger('change');
            }, 1000);
        }
    }, true);
}

function remove_btn(id) {
    removeData("shortcuts/delete", 'DELETE', id, function (data) {
        if (data) {
            ReloadShortcutTable();
        }
    }, true);
}

$("#shortcuts_table").on("change", ".checked-box", function (event) {
    var id = $(event.target).attr('value');
    var data = {};
    if (this.checked) {
        data['cf_status'] = "1";
    } else {
        data['cf_status'] = "2";
    }
    sendHTTPRequest("shortcuts/status?id=" + id, "PUT", data, function (result) {
        if (result) {
            ReloadShortcutTable();
        }
    }, true);
});


function checkModulePermission() {
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".user_add_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
        $('.hideRegionAdminAccess').hide();
    }
    // if (user_type !== "admin") {
    //     window.location = _config.domain + "index.html";
    // }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
    GetRegionList();
}

/*$('#group_id').select2({
    placeholder: "Please select group",
    allowClear: false
});*/
