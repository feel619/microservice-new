
//-OTP Input-//
var data = {
    UserPoolId : _config.cognito.userPoolId,
    ClientId : _config.cognito.clientId
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
var CurcognitoUser = userPool.getCurrentUser();
// Make the call to obtain credentials
window.onload = function(){
    var subIdUser = sessionStorage.getItem("subIdUser");
    if (CurcognitoUser != null && subIdUser != null) {
        locateToIndex();
    }
};
var cognitoUser;
var userAttr;
function signInButton() {
    jQuery("#warning_message").text("");
    if (!isEmail( document.getElementById("username").value)) {
        jQuery("#warning_message").text("Please enter proper email format.");
        return;
    }
   	var authenticationData = {
        Username : document.getElementById("username").value,
        Password : document.getElementById("password").value,
    };
	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    var userData = {
        Username : document.getElementById("username").value,
        Pool : this.userPool,
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            var subIdUser = result.accessToken.payload.sub;
            sessionStorage.setItem("subIdUser", subIdUser);
            //var accessToken = result.getAccessToken().getJwtToken();
            var idToken = result.idToken.jwtToken;// session.getIdToken().getJwtToken();
            console.log(idToken," ID ",result.getIdToken().getJwtToken());
            var url = _config.caseCloudAdminApiURL + 'users/getUser/'+subIdUser;
            console.log(url," url ");
            var settings = {
                "url": url.trim(),
                "method": 'GET',
                "data": JSON.stringify(''),
                "headers": {
                    "Authorization": "Bearer " + idToken,
                    "Content-Type": "application/json"
                },
                "crossDomain": true
            };
            console.log(settings,"settings ");
            $.ajax(settings).done(function (response) {
                console.log(response,"response ");
                var ResponseData = response.data;
                console.log(response,"response ");
                if (ResponseData.cf_status === '1') {
                    window.location = _config.domain+"index.html"
                } else {
                    jQuery("#warning_message").text("Sorry, your account is inactive. please contact admin");
                }
            }).fail(function (response) {
                jQuery("#warning_message").text("Sorry, your account is inactive. please contact admin");
            });
        },
        newPasswordRequired: function(result){
            jQuery("#new_password_warning").text("");
            jQuery(".login-box").removeClass("active");
            jQuery("#fp_panel").removeClass("active");
            jQuery("#new_user_password_panel").addClass("active");
            jQuery("#new_user_new_password").val("");
            jQuery("#new_user_confirm_password").val("");
            delete result.email_verified;
            userAttr = result;
            stateCognitoUser = cognitoUser;
            console.log(userAttr," userAttr ",result);
        },
        onFailure: function(err) {
            console.log(err," newpassword ");
            if (err.code=="NotAuthorizedException"){
                jQuery("#warning_message").text("Invalid email or password");
            }else{
                if (err == "NEW_PASSWORD_REQUIRED"){
                    jQuery("#warning_message").text("NEW_PASSWORD_REQUIRED.");
                }else{
                    jQuery("#warning_message").text("Something went wrong. Please try again later.");
                }
            }
        },
    });
}
$('.login_filed').keypress(function (e) {
    if (e.which == 13) {
        signInButton();
        return false;    //<---- Add this line
    }
});
jQuery("#new_reset_password").click(function(){
    jQuery("#new_password_warning").text("");
    var newPassword = jQuery("#new_user_new_password").val();
    var confirmPassword = jQuery("#new_user_confirm_password").val();
    if(newPassword == ""){
        jQuery("#new_password_warning").text("Password is required");
        return;
    }
    if(newPassword != confirmPassword){
        jQuery("#new_password_warning").text("Confirm password is not same as new password");
        return;
    }
    cognitoUser.completeNewPasswordChallenge(newPassword, userAttr, {
        onSuccess: result => {
            console.log("result", result);
            locateToIndex();
        },
        onFailure: function(err) {
            if (err.code=="InvalidPasswordException"){
                jQuery("#new_password_warning").text(err.message);
            }else if(err.code=="InvalidParameterException"){
                jQuery("#new_password_warning").text(err.message);
            }else{
                alert(err.message);
                jQuery("#new_password_warning").text(err.message);
                backToLogin();
            }
        }
    });
});

var sendOTPObj;
$(document).ready(function(){
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
    jQuery("#forgot_password").click(function(){
        jQuery(".login-box").removeClass("active");
        jQuery("#fp_panel").addClass("active");
    });
    jQuery(".back_to_signin").click(function(){
        backToLogin();
    });
    jQuery("#next_to_otp").click(function(){
        jQuery("#recover_email_warning").text("");
        if (!isEmail( document.getElementById("recover_email").value)) {
            jQuery("#recover_email_warning").text("Please enter proper email format.");
            return;
        }
        sendOTP();
    });
    jQuery("#resend_otp").click(function(){
        if (!isEmail( document.getElementById("recover_email").value)) {
            alert("Your email has been lost. Kindly refresh the window and try again.")
            return;
        }
        sendOTP();
    });
    jQuery("#update_password").click(function(){
        jQuery("#otp_warning").text("");
        jQuery(".otp_field").each(function(){
            if (jQuery(this).val()==""){
                jQuery("#otp_warning").text("Please enter OTP");
                return;
            }
        });
        var newPwd = jQuery("#new_password").val();
        var confirmPwd = jQuery("#confirm_password").val();
        if(newPwd!= confirmPwd){
            jQuery("#otp_warning").val("Confirm password is not same as new password");
        }
        var verificationCode = "";
        for (var i=1; i<=6; i++){
            verificationCode = verificationCode+jQuery(".otpval"+i).val();
        }
        console.log("verificationCode")
        console.log(verificationCode)
        cognitoUser.confirmPassword(verificationCode, newPwd, sendOTPObj);
    });
});

function refreshLogin(){
    jQuery("#warning_message").text("");
    jQuery("#otp_warning").text("");
    jQuery("#recover_email_warning").text("");
    jQuery("#username").val("");
    jQuery("#password").val("");
    jQuery("#recover_email").val("");
    jQuery(".otp_field").val("");
    jQuery("#new_password").val("");
    jQuery("#confirm_password").val("");
}

function sendOTP(){
    var userData = {
        Username : document.getElementById("recover_email").value,
        Pool : userPool,
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.forgotPassword({
        onSuccess: function (result) {
            backToLogin();
        },
        onFailure: function(err) {
            console.log(err," Forgot password ");
            if (err.code=="InvalidPasswordException"){
                jQuery("#otp_warning").text(err.message);
            }else if(err.code=="CodeMismatchException"){
                jQuery("#otp_warning").text(err.message);
            }else{
                alert(err.message);
                backToLogin();
            }
        },
        inputVerificationCode() {
            jQuery(".login-box").removeClass("active");
            jQuery("#otp_panel").addClass("active");
            jQuery(".otp_field").val("");
            jQuery("#otp_warning").text("");
            jQuery("#new_password").val("");
            jQuery("#confirm_password").val("");
            sendOTPObj = this;
        }
    });
}

function backToLogin(){
    jQuery(".login-box").removeClass("active");
    jQuery("#login_panel").addClass("active");
    refreshLogin();
}
function locateToIndex(){
    window.location = _config.domain+"index.html";
}

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}
$('[data-toggle="tooltip"]').tooltip();


