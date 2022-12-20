let user_type = '';

function checkModulePermission() {
    user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    GetRegionList();
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

let filter_region_id = '';
let filters = {
        searchList: [
            {
                "field": "region_id",
                "operator": "is",
                "value": filter_region_id
            },
            {"field": "file_name", "operator": "contains", "value": ""}
        ]
    },
    columns = [
        {data: 'file_name', orderable: true},
        {data: 'created_by', orderable: true},
        {data: 'created_at', orderable: true},
        {data: 'description', orderable: false},
        {data: 'action', orderable: false},
    ],
    columnDefs = [
        {
            "targets": [1],
            render: function (data, type, full, meta) {
                let created_by = (full.TUD) ? full.TUD.name + '-' + full.TUD.email : '';
                return '<label class="">' + created_by + '</label>';
            }
        },
        {
            "targets": [2],
            render: function (data, type, full, meta) {
                let created_at = new Date(full.createdAt).toLocaleString();//.toLocaleDateString('lll');
                return `<span style="display:none;">${full.createdAt}</span>${created_at}`;
            }
        },
        {
            "targets": [4],
            "visible": (localStorage.getItem('user_type') === 'admin'),
            render: function (data, type, full, meta) {
                let edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="RollBack" class="btn btn-sm btn-primary white-color" onclick="update_btn(\'' + full.id + '\')"><i class="fa fa-undo"></i></a>';
                return edit_html;
            }
        }
    ],
    order = [[2, "desc"]],
    dataTable = callCaseCloudDataTable('rollback_table', 'callBox/importFiles/tableList', filters, columns, '', columnDefs, order);

function ReloadCsvImportTable() {
    filters.searchList[0]['value'] = filter_region_id;
    //filters.searchList[1]['value'] = $("#search_box").val();
    $('#rollback_table').DataTable().ajax.reload(null, false);
}

function update_btn(id) {
    $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + id + '" />');
    $('#csvImportCsvModal').modal('show');
    $('#import_form input[name="confirm"]').bind('keyup blur click', function () {
        if ($(this).val() === 'confirm') {
            $('#csvSubmit').removeClass('button_disabled').attr('disabled', false);
        } else {
            $('#csvSubmit').addClass('button_disabled').attr('disabled', true);
        }
    });
}

$.validator.addMethod("customRule", function (value, element, param) {
    return this.optional(element) || value === param;
}, "You must enter confirm");

$("#import_form").validate({
    rules: {
        id: {
            required: true,
        },
        description: {
            required: true,
        },
        confirm: {
            required: true,
            customRule: 'confirm'
        },
    },
    submitHandler: function (form) {
        let unindexed_array = $(form).serializeArray();
        let data = {};
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
        });
        sendCaseCloudHTTPRequest("callBox/importFiles/" + data['id'], "PUT", data, function (result) {
            if (result) {
                ReloadCsvImportTable();
                $('#import_csv').val('');
                $('#import_form')[0].reset();
                $('#csvImportCsvModal').modal('hide');
            }
        });
    }
});

$(document).on('change', '#admin_region_box', function (event) {
    let id = $(this).val();
    let regionCode = event.target.options[event.target.selectedIndex].dataset.code;
    if (id) {
        filter_region_id = id;
        localStorage.setItem("region_id", id);
        localStorage.setItem("region_code", regionCode);
        ReloadCsvImportTable();
    } else {
        toastr.error('Please Select region');
    }
});
