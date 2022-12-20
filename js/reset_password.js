//-OTP Input-//
var data = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.clientId
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
var CurcognitoUser = userPool.getCurrentUser();
var cognitoUser;
var sendOTPObj;
const renderResetPassword = () => {
    fetch('template/reset_password.mustache')
        .then((response) => response.text())
        .then((template) => {
            var rendered = Mustache.render(template, {});
            $('#resetPasswordModal').html(rendered).promise().done(function () {
                if (CurcognitoUser.username !== "" && isEmail(CurcognitoUser.username)) {
                    $("#recover_email").val(CurcognitoUser.username);
                    $("#recover_email").prop("readonly", true);
                }
                otpText();
                $('[data-toggle="tooltip"]').tooltip()
            });
        });
};
renderResetPassword();

const otpText = () => {
    'use strict';
    var body = $('#otp-inputs');

    function goToNextInput(e) {
        var key = e.which,
            t = $(e.target),
            sib = t.next('input');
        if (key != 9 && (key < 48 || key > 57)) {
            e.preventDefault();
            return false;
        }
        if (key === 9) {
            return true;
        }
        if (!sib || !sib.length) {
            sib = body.find('input').eq(0);
        }
        sib.select().focus();
    }

    function onKeyDown(e) {
        var key = e.which;
        if (key === 9 || (key >= 48 && key <= 57)) {
            return true;
        }
        e.preventDefault();
        return false;
    }

    function onFocus(e) {
        $(e.target).select();
    }

    body.on('keyup', 'input', goToNextInput);
    body.on('keydown', 'input', onKeyDown);
    body.on('click', 'input', onFocus);
    jQuery("#forgot_password").click(function () {
        jQuery(".reset-box").removeClass("active");
        jQuery("#fp_panel").addClass("active");
    });
    jQuery("#next_to_otp").click(function () {
        jQuery("#recover_email_warning").text("");
        if (!isEmail(document.getElementById("recover_email").value)) {
            jQuery("#recover_email_warning").text("Please enter proper email format.");
            return;
        }
        sendOTP();
    });
    jQuery("#resend_otp").click(function () {
        if (!isEmail(document.getElementById("recover_email").value)) {
            alert("Your email has been lost. Kindly refresh the window and try again.");
            return;
        }
        sendOTP();
    });
    jQuery("#update_password").click(function () {
        jQuery("#otp_warning").text("");
        jQuery(".otp_field").each(function () {
            if (jQuery(this).val() == "") {
                jQuery("#otp_warning").text("Please enter OTP");
                return;
            }
        });
        var newPwd = jQuery("#new_password").val();
        var confirmPwd = jQuery("#confirm_password").val();
        if (newPwd != confirmPwd) {
            jQuery("#otp_warning").val("Confirm password is not same as new password");
        }
        var verificationCode = "";
        for (var i = 1; i <= 6; i++) {
            verificationCode = verificationCode + jQuery(".otpval" + i).val();
        }
        console.log("verificationCode")
        console.log(verificationCode)
        cognitoUser.confirmPassword(verificationCode, newPwd, sendOTPObj);
    });
};

function sendOTP() {
    var userData = {
        Username: document.getElementById("recover_email").value,
        Pool: userPool,
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.forgotPassword({
        onSuccess: function (result) {
            $('#myModal').modal('hide');
        },
        onFailure: function (err) {
            console.log(err);
            if (err.code == "InvalidPasswordException") {
                jQuery("#otp_warning").text(err.message);
            } else if (err.code == "CodeMismatchException") {
                jQuery("#otp_warning").text(err.message);
            } else if (err.code == "ExpiredCodeException") {
                jQuery("#otp_warning").text(err.message);
            } else if (err.code === "LimitExceededException"){
                jQuery("#recover_email_warning").text(err.message);
            } else {
                console.log(err.message);
                alert(err.message);
            }
        },
        inputVerificationCode() {
            // cognitoUser.resendConfirmationCode(function(err, result) {
            //     if (err) {
            //         console.log(err);
            //         return;
            //     }
            //     console.log(result);
            // });
            jQuery(".reset-box").removeClass("active");
            jQuery("#otp_panel").addClass("active");
            jQuery(".otp_field").val("");
            jQuery("#otp_warning").text("");
            jQuery("#new_password").val("");
            jQuery("#confirm_password").val("");
            sendOTPObj = this;
        }
    });
}

function refreshWrnMsg() {
    jQuery("#warning_message").text("");
    jQuery("#otp_warning").text("");
    jQuery("#recover_email_warning").text("");
    jQuery("#recover_email").val("");
    jQuery(".otp_field").val("");
    jQuery("#new_password").val("");
    jQuery("#confirm_password").val("");
}

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

$(document).on('click', '#reset_password', function (event) {
    $('#myModal').modal('show');
});
