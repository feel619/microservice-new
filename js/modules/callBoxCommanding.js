
let firmwareRepoFilters = {
        searchList: [
            {"field": "firmware_rev", "operator": "is", "value": ''},
            {"field": "rfw_code", "operator": "is", "value": ''},
        ]
    },
    firmwareRepoColumns = [
        {data: 'rfw_code', orderable: true, "width": "10%",},
        {data: 'firmware_revision_number', orderable: true, "width": "10%"},
        {data: 'filename', orderable: true, "width": "10%"},
        {data: 'path', orderable: true, "width": "10%"},
        {data: 'description', orderable: false, "width": "10%"},
        {data: 'Action', orderable: false, "width": "10%"},
    ],
    firmwareRepoColumnDefs = [
        {
            "targets": [5],
            render: function (data, type, full, meta) {
                let edit_html = '';
                edit_html += '<a data-toggle="tooltip" title="RollBack" class="btn btn-sm btn-primary white-color"  ><i class="fa fa-undo"></i></a>';
                return edit_html;
            }
        },
    ],
    firmwareRepoOrder = [1, 'asc'],
    firmwareRepoDataTable = callCaseCloudDataTable('firmware_repo_table', 'firmwareRepository/tableList', firmwareRepoFilters, firmwareRepoColumns, '', firmwareRepoColumnDefs, firmwareRepoOrder);

// Reload System code listing
function reloadFirmwareRepoTable() {
    $('#firmware_repo_table').DataTable().ajax.reload(null, false);
}

const sendLiveStatusMessage = (ResponseData) => {
    console.log("updateLiveCallBoxStatusResponseData", ResponseData);
};
$(document).on('change', '#fx_firmware_revision_number', function (event) {
    reloadFirmwareRepoTable();
});
$(document).on('change', '#fx_rfw_code', function (event) {
    reloadFirmwareRepoTable();
});

$('.resetFn').click(function () {
    $('#fx_rfw_code').val('');
    $('#fx_firmware_revision_number').val('');
    reloadFirmwareRepoTable();
});

function GetFirmwareList() {
    sendCaseCloudHTTPRequest('firmwareRepository/list', "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let fx_rfw_code = '<option value="" >All</option>';
            let fx_firmware_revision_number = '<option value="" >All</option>';
            $.each(ResponseData, function (index, value) {
                fx_rfw_code += '<option  data-code="' + value.rfw_code + '"  data-name="' + value.rfw_code + '"  value="' + value.rfw_code + '" >'+ value.rfw_code+'</option>';
                fx_firmware_revision_number += '<option  data-code="' + value.firmware_revision_number + '"  data-name="' + value.firmware_revision_number + '"  value="' + value.firmware_revision_number + '" >' + value.firmware_revision_number + '</option>';
            });
            $("#fx_firmware_revision_number").html(fx_firmware_revision_number);
            $("#fx_rfw_code").html(fx_rfw_code);
        }
    });
}
GetFirmwareList();

function checkModulePermission() {
    let user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

$('.cancelBtn, .backBtn').click(function (e) {
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});

