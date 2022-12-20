var data = {
    UserPoolId: _config.cognito.userPoolId,
};
var subIdUser = localStorage.getItem("subIdUser");
GetRegionList();

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
        },
    },
    submitHandler: function (form) {
        let unindexed_array = $(form).serializeArray();
        let data = {};
        data= $('input[name^="notify_alert\\["]').serializeControls();
        $.map(unindexed_array, function (n, i) {
            let name = n['name'];
            if(name.indexOf('notify_alert') === -1){
                data[n['name']] = n['value'];
            }
        });
        let userId = data['id'];
        data['user_type'] = $('#user_type').val();
        data['region_ids'] = $('#region_id').val();
        //delete data['user_type'];
        delete data['email'];
        delete data['id'];
        console.log(data,"data");
        sendCaseCloudHTTPRequest("users/updateUsers/" + userId, "PUT", data, function (result) {
            if (result) {
                toastr.success('Profile updated successfully', 'Success!');
            }
        });
    }
});


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


$('.cancelBtn, .backBtn').click(function () {
    $('#add_user_form')[0].reset();
    var validator = $("#add_user_form").validate();
    validator.resetForm();
    $('#setUserPasswordForm')[0].reset();
    $("#region_id").val(['']).trigger("change");
    $('.f-add').hide();
    $('.m-add').hide();
    $('.f-app').show();
});

function renderData(ResponseData) {
    $('.hidden_field').html('<input type="hidden" name="id" id="id" value="' + ResponseData.id + '" />');
    $('#region_id').attr("disabled", false);
    $('#email').val(ResponseData['email']);
    $('#set_email').val(ResponseData['email']);
    $('#name').val(ResponseData['name']);
    let r_user_type = ResponseData['user_type'];
    $('#user_type').val(r_user_type);
    $('#phone_number').val(ResponseData['phone_number']);
    $('#region_id').attr("disabled", true);
    let region_list = ResponseData['TUR'];
    let region_arr = [];
    let regionEmailAuth =  ``;
    region_list.forEach(function (value, index, array) {
        let regionData = value['TRU'];
        region_arr.push(regionData.id);
        regionEmailAuth+= `<tr role="row" class="odd">
            <td>${value.TRU.region_name}</td>
            <td >
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.TRU.id}][alert_email]" type="hidden" value="2">
                    <input ${value.alert_email === '1' ? 'checked' : '' } id="alert_email_${value.TRU.id}" name="notify_alert[${value.TRU.id}][alert_email]" class="checked-box alert_email_check" type="checkbox" value="1">
                    <label for="alert_email_${value.TRU.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.TRU.id}][voice_call_email]" type="hidden" value="2">
                    <input ${value.voice_call_email === '1' ? 'checked' : '' }  id="voice_call_email_${value.TRU.id}" name="notify_alert[${value.TRU.id}][voice_call_email]" class="checked-box voice_call_email_check" type="checkbox" value="1">
                    <label for="voice_call_email_${value.TRU.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.TRU.id}][voice_text_email]" type="hidden" value="2">
                    <input ${value.voice_text_email === '1' ? 'checked' : '' }  id="voice_text_email_${value.TRU.id}" name="notify_alert[${value.TRU.id}][voice_text_email]" class="checked-box voice_text_email_check" type="checkbox" value="1">
                    <label for="voice_text_email_${value.TRU.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.TRU.id}][tty_call_email]" type="hidden" value="2">
                    <input ${value.tty_call_email === '1' ? 'checked' : '' } id="tty_call_email_${value.TRU.id}" name="notify_alert[${value.TRU.id}][tty_call_email]" class="checked-box tty_call_email_check" type="checkbox" value="1">
                    <label for="tty_call_email_${value.TRU.id}" class="label-primary"></label>
                </div>
            </td>
            <td>
                <div class="col-md-3 material-switch">
                    <input name="notify_alert[${value.TRU.id}][tty_text_email]" type="hidden" value="2">
                    <input ${value.tty_text_email === '1' ? 'checked' : '' } id="tty_text_email_${value.TRU.id}" name="notify_alert[${value.TRU.id}][tty_text_email]" class="checked-box tty_text_email_check" type="checkbox" value="1">
                    <label for="tty_text_email_${value.TRU.id}" class="label-primary"></label>
                </div>
            </td>
            </tr>`;
    });
    $('#regionEmailPermission').html(regionEmailAuth);
    $("#alert_email").prop("checked", ResponseData['alert_email'] === '1');
    $("#voice_call_email").prop("checked", ResponseData['voice_call_email'] === '1');
    $("#voice_text_email").prop("checked", ResponseData['voice_text_email'] === '1');
    $("#tty_call_email").prop("checked", ResponseData['tty_call_email'] === '1');
    $("#tty_text_email").prop("checked", ResponseData['tty_text_email'] === '1');
    $('#region_id').val(region_arr);
    $('#region_id').trigger('change');
}


$('#region_id').select2({
    placeholder: "Please select Region",
    allowClear: false
});
$('#region_id').val(null).trigger('change');

function checkModulePermission(profile, responseData) {
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".user_add_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    renderData(responseData);
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}
