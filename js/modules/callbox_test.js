var publisherCallBox = {};
var runningCallBoxId = [];
var ActiveChannel = '';
var infoChat = {};
subUser = _config.subUser;
let pickUpTimeOut = 540000;//9(540000)min pickup call
let lastMsgTimeout = 300000;//300000
function checkModulePermission(){
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if(user_type === "region_admin"){
        $("#user_type option[value='"+user_type+"']").remove();
    }
    if(user_type !== "admin" && user_type !== "region_admin"){
        window.location = _config.domain+"index.html";
    }
    renderMenu('template/menu.mustache','nav-menu-container', user_type);
}
function initIndex() {
    $(".alert_sound_background").hide();
    console.log(_config.CryptoHas, " _config.CryptoHas ");
    if (_config.CryptoHas !== "" && _config.CryptoHas !== undefined) {
        GetRegionList();
        //getAllCallBox();
    }
}

$(document).on('change', '#admin_region_box', (event) => {
    let regionCode = event.target.options[event.target.selectedIndex].dataset.code;
    let regionName = event.target.options[event.target.selectedIndex].dataset.name;
    let id = $("#admin_region_box").val();
    localStorage.setItem("region_id", id);
    localStorage.setItem("region_code", regionCode);
    let combo_call_box = '<option value="">Select Call Box</option>';
    $("#combo_call_box").html(combo_call_box);
    sendHTTPRequest("region_callbox/user/" + id, "GET", "", (result) => {
        if (result) {
            let RegionBox = result.data;
            if (RegionBox && RegionBox instanceof Array && RegionBox.length) {
                RegionBox.map((callBoxValue) => {
                    if (callBoxValue.cf_status && callBoxValue.cf_status === "1") {
                        var regionId = callBoxValue.region_id;
                        var aniNumber = callBoxValue.ani_number;
                        var aniRegion = aniNumber + '_' + regionId;
                        callBoxValue.regionData = regionList[regionId];
                        publisherCallBox[aniRegion] = callBoxValue;
                        publisherCallBox[aniRegion]['receivedMsgTimeout'] = '';
                        publisherCallBox[aniRegion]['lastMsgTimeout'] = '';
                        publisherCallBox[aniRegion]['pickUp'] = false;
                        console.log(callBoxValue, " call Box ");
                        combo_call_box += '<option data-text="' + regionName + '-' + aniNumber + '" data-id="' + aniNumber + '" value="' + aniRegion + '" >' + regionName + '-' + aniNumber + '</option>';
                    }
                });
                $("#combo_call_box").html(combo_call_box);
            }
        }
    });
});


$('#combo_call_box').select2({
    placeholder: "Please select call box",
    allowClear: false
});
$('#combo_call_box').val(null).trigger('change');

$(document).on('change', '#combo_call_box', function (event) {
    var aniRegion = $(this).val();
    $('#callBoxView').html('');
    $('#chatView').html('');
    if (aniRegion) {
        $("#publisher_chat_view_box").removeClass('d-none');
        $("#combo_call_box").prop("disabled", true);
        let roomId = $(this).find(':selected').attr('data-id');
        ActiveChannel = aniRegion;
        let regionCode = localStorage.getItem("region_code");
        let phone = publisherCallBox[aniRegion].phone;
        let ani_number = publisherCallBox[aniRegion].ani_number;
        let regionName = publisherCallBox[aniRegion].regionData.region_name;
        publisherCallBox[aniRegion]['receivedMsgTimeout'] = '';
        publisherCallBox[aniRegion]['lastMsgTimeout'] = '';
        publisherCallBox[aniRegion]['pickUp'] = false;
        let callBoxName = regionName + '-' + ani_number;
        renderChatCallBox('template/chat_call_box.mustache', 'callBoxView', {
            callBoxName: callBoxName,
            phone: phone
        }, () => {
        });
        let reqMsg = {
            "connection_type": 'RPIMessage',
            "message": 'CB_TTY_TX~INVITE~' + phone + '~' + phone + '~' + ani_number + '~' + regionCode,
            "sub": subUser,//sessionStorage.getItem("subIdUser")
            "remoteAddress": '',
            "remotePort": '',
            "roomId": aniRegion,
            "regionId": publisherCallBox[aniRegion].region_id,
            "replayId": '',
            "name": localStorage.getItem('user_name'),
            "user_type": localStorage.getItem('user_type'),
            "reason":'',
            "RPI": "3"
        };
        console.log(publisherCallBox[aniRegion],'timeResetAll');
        publisherCallBox[aniRegion]['pickUpTimeOut'] = setTimeout(() => {
            console.log(publisherCallBox[aniRegion], " publisherCallBox_pickUpTimeOut ");
            if (!publisherCallBox[aniRegion]['pickUp']) {
                endChatBox('Pick Up TimeOut');
                clearInterval(publisherCallBox[aniRegion]['pickUpTimeOut']);
            }
        }, pickUpTimeOut);
        console.log(publisherCallBox[aniRegion], " publisherCallBox ");
        chatMessage(reqMsg);
        shortcutMessage();
    }
});


var shiftDown = false;
var messageBox = $("#sendMsg");
$(document).keypress(function (event) {
    let keyCode = (event.keyCode ? event.keyCode : event.which);
    console.log(keyCode," keyCode ",messageBox.is(":focus"),!shiftDown);
    if (keyCode === 13) {
        if (messageBox.is(":focus") && !shiftDown) {
            event.preventDefault();
            sendMessage();
        }
    }
});

$(document).keydown(function (e) {
    if (e.keyCode == 16) shiftDown = true;
});

$(document).keyup(function (e) {
    if (e.keyCode == 16) shiftDown = false;
});

const sendMessage = () => {
    let Msg = $('#sendMsg').val();
    let message = Msg.toUpperCase().replace(/[|~`@#%^*_+{}'"<>\[\]'\\]/g, "");//remove char from string
    let callBoxId = $('#combo_call_box').val();
    console.log(publisherCallBox[ActiveChannel], "ActiveChannel", ActiveChannel, infoChat);
    if (callBoxId !== '' && message.trim()) {
        let regionName = publisherCallBox[ActiveChannel].regionData.region_name;
        let aniNumber = publisherCallBox[ActiveChannel].ani_number;
        let reqMsg = {
            "connection_type": 'RPIMessage',
            "message": 'CB_TTY_TX~CHAR~' + message + ' GA ',
            "sub": subUser,
            "remoteAddress": '',
            "remotePort": '',
            "roomId": callBoxId,
            "regionId": publisherCallBox[ActiveChannel].region_id,
            "replayId": infoChat[ActiveChannel].replayId,
            "name": regionName + '-' + aniNumber,
            "user_type": localStorage.getItem('user_type'),
            "reason":'',
            "RPI": "0"
        };
        chatMessage(reqMsg);
        $('#sendMsg').val('');
        bottomScrolling();
        LastMessageTimeOut();
    } else {
        toastr.error('Please select call box!');
    }
};

const LastMessageTimeOut = () => {
    console.log("lastMsgTimeout", publisherCallBox[ActiveChannel]['lastMsgTimeout'],new Date().toLocaleString());
    clearTimeout(publisherCallBox[ActiveChannel]['lastMsgTimeout']);
    publisherCallBox[ActiveChannel]['lastMsgTimeout'] = setTimeout(() => {
        console.log("lastMsgTimeout-EndChat", publisherCallBox[ActiveChannel],new Date().toLocaleString());
        clearTimeout(publisherCallBox[ActiveChannel]['lastMsgTimeout']);
        endChatBox('Last Message Timeout');
    }, lastMsgTimeout);
};

const receivedMsgTimeout = () => {
    console.log("receivedMsgTimeout-->", publisherCallBox[ActiveChannel]['receivedMsgTimeout'],new Date().toLocaleString());
    clearTimeout(publisherCallBox[ActiveChannel]['receivedMsgTimeout']);
    publisherCallBox[ActiveChannel]['receivedMsgTimeout'] = setTimeout(() => {
        console.log("receivedMsgTimeout-EndChat", publisherCallBox[ActiveChannel],new Date().toLocaleString());
        clearTimeout(publisherCallBox[ActiveChannel]['receivedMsgTimeout']);
        endChatBox('Received Message Timeout');
    }, lastMsgTimeout);
};

const endChatBox = (message) => {
    console.log(infoChat, " endChatBox ",new Date().toLocaleString());
    if (infoChat[ActiveChannel]) {
        let regionName = publisherCallBox[ActiveChannel].regionData.region_name;
        let aniNumber = publisherCallBox[ActiveChannel].ani_number;
        let regionANI = regionName +'-'+ aniNumber;
        let reqMsg = {
            "connection_type": 'RPIMessage',
            "message": 'CB_TTY_CALL_END',
            "sub": subUser,
            "remoteAddress": '',
            "remotePort": '',
            "roomId": ActiveChannel,
            "regionId": publisherCallBox[ActiveChannel].region_id,
            "replayId": infoChat[ActiveChannel].replayId,
            "name": regionANI,
            "user_type": localStorage.getItem('user_type'),
            "reason":(message === true) ? "RPI": message,
            "RPI": "0"
        };
        chatMessage(reqMsg);
        resetCall();
    }
};
const resetCall = () => {
    $('#callBoxView').html('');
    $('#chatView').html('');
    runningCallBoxId = [];
    infoChat = {};
    ActiveChannel = '';
    clearAllTimeouts();
    $("#combo_call_box").select2("val", "");
    $('#combo_call_box').val(null).trigger('change');
    $("#combo_call_box").prop("disabled", false);
    $("#publisher_chat_view_box").addClass('d-none');
};
const deActiveChatCall = (publisherData) => {
    if (publisherData.roomId === ActiveChannel) {
        resetCall();
    }
};
function createClearAllTimeouts() {
    console.log("createClearAllTimeouts");
    const noop = () => {};
    let firstId = setTimeout(noop, 0);
    return () => {
        const lastId = setTimeout(noop, 0);
        while (firstId !== lastId) {
            firstId += 1;
            clearTimeout(firstId);
        }
    };
};
const   clearAllTimeouts = createClearAllTimeouts();
const shortcutMessage = () => {
    var shortcutHtml = '<table class="table table-hover">' +
        '  <thead>' +
        '    <tr>' +
        //    '      <th scope="col">region</th>' +
        '      <th scope="col">Key</th>' +
        '      <th scope="col">Message</th>' +
        '    </tr>' +
        '  </thead>' +
        '  <tbody>';
    var region_id = publisherCallBox[ActiveChannel].region_id;
    sendHTTPRequest("shortcuts/region?id=" + region_id, 'GET', "", function (result) {
        if (result.data) {
            $('#shortcutListPanel').html('');
            var ResponseData = result.data;
            $.each(ResponseData, function (index, value) {
                shortcutHtml += '<tr>';
                //    shortcutHtml+='<td>'+value.region+'</td>';
                shortcutHtml += '<td>' + value.shortcut_key + '</td>';
                shortcutHtml += '<td style="cursor: pointer;" onclick="selectMessage(\'' + value.message + '\')">' + value.message + '</td>';
                shortcutHtml += '</tr>';
                shortcut.add(value.shortcut_key, function () {
                    $('#sendMsg').val(value.message);
                });
            });
            shortcutHtml += '</tbody></table>';
            $('#shortcutListPanel').html(shortcutHtml);
        }
    }, true);
};

const infoMessage = () => {
    $('#shortcutKeyModal').modal('show');
};
const selectMessage = (value) => {
    $('#sendMsg').val(value);
    $('#shortcutKeyModal').modal('hide');
};
const instructionModalOpen = () => {
    $('#InstructionModal').modal('show');
};

const viewerChat = (publisherData) => {
    var roomId = publisherData.roomId;
    if (runningCallBoxId.indexOf(roomId) === -1) {
        runningCallBoxId.push(roomId);
    }
    infoChat[roomId] = publisherData;
    if (ActiveChannel === roomId && publisherData.type !== "INVITE") {
        AddPubAudio();
        renderChatCallBox('template/chat_message.mustache', 'chatView', {response: publisherData}, () => {
        });
        console.log(publisherData.created_by,"!==!",subUser);
        if (publisherData.created_by !== subUser) { receivedMsgTimeout(); }
    }
};

const callBusy = (publisherData) => {
    if (publisherData.roomId === ActiveChannel) {
        toastr.error("CB TTY CALL BUSY!");
        resetCall();
    }
};

const pickUpCall = (publisherData) => {
    console.log(publisherData, " pickUpCall ");
    if (publisherData.roomId === ActiveChannel) {
        publisherCallBox[ActiveChannel]['pickUp'] = ((publisherData.type === "INVITE" && publisherData.RPI === '0')) ? true : publisherCallBox[ActiveChannel]['pickUp'];
        LastMessageTimeOut();
        receivedMsgTimeout();
    }
};
