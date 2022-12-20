var data = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.clientId
};

var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
var cognitoUser = userPool.getCurrentUser();

const initWebSocket = () => {
    var subIdUser = sessionStorage.getItem("subIdUser");
    if (cognitoUser != null && subIdUser != null) {
        cognitoUser.getSession(function (err, session) {
            var idToken = session.getIdToken().getJwtToken();
            var subIdUser = cognitoUser.signInUserSession.idToken.payload.sub;
            var url = _config.wsURL + "?Authorization=" + idToken + "&sub=" + subIdUser + "&credential=false";
            websocket = new WebSocket(url);
            websocket.onopen = function (evt) {
                onOpen(evt)
            };
            websocket.onclose = function (evt) {
                onClose(evt)
            };
            websocket.onmessage = function (evt) {
                onMessage(evt)
            };
            websocket.onerror = function (evt) {
                onError(evt)
            };
        });
    }
};

const onOpen = (evt) => {
    WebSocketConfig.prototype = {
        onOpen: true,
        webSocket: websocket
    };
    console.log("openSocket");
    var message = {
        "connection_type": connection_type,
    };
    chatMessage(message);
};

const onClose = (evt) => {
    WebSocketConfig.prototype = {
        onOpen: false,
        webSocket: websocket
    };
    console.log("closeSocket");
    // initWebSocket();
};

let count = 0;
const onMessage = (evt) => {
    var publisherJson = JSON.parse(evt.data);
    console.log(evt, " connection_type ", evt.data);
    var publisherData = publisherJson;
    var connection_type = publisherData.connection_type;
    var type = publisherData.type;
    if (activeModule === "home" || activeModule === "publisher") {
        switch (connection_type) {
            case "status_update":
                (publisherData.status === '2') ? signOut() : "";
                break;
            case "chatMessage":
                    viewerChat(publisherData);
                break;
            case "RPIMessage":
                    if (type === "INVITE") {
                        viewerChat(publisherData);
                    } else if (type === 'CB_TTY_CALL_BUSY') {
                        callBusy(publisherData);
                    } else if (type === 'CB_TTY_CALL_BOX_NOT_FOUND') {
                        toastr.error('Call box not Found!');
                    }
                break;
            case "CB_TTY_CALL_END":
                    deActiveChatCall(publisherData);
                break;
            case "CB_TTY_USER_COUNT":
                console.log("CB_TTY_USER_COUNT", publisherData);
                existActiveChatCall(publisherData);
                break;
            case "CB_TTY_CALL_ACCEPT":
                pickUpCall(publisherData);
                break;
            case "CB_TTY_RING":
                rotatingQueue(publisherData);
                stopInviteAudio();
                break;
            case "CB_TTY_RINGING":
                AddInviteAudio(publisherData);
                break;
            case "PONG":
                console.log("PONG", publisherData);
                break;
            case "CB_TTY_CONNECT":
                localStorage.setItem('connectionId',publisherData.connectionId);
                break;
            default:
                console.log(" default ", publisherData);
        }
    } else {
        switch (connection_type) {
            case "status_update":
                (publisherData.status === '2') ? signOut() : "";
                break;
            case "CB_TTY_CALL_END":
                stopInviteAudio(publisherData);
                break;
            case "CB_TTY_USER_COUNT":
                stopInviteAudio(publisherData);
                break;
            case "CB_TTY_CALL_ACCEPT":
                stopInviteAudio(publisherData);
                break;
            case "CB_TTY_RING":
                rotatingQueue(publisherData);
                stopInviteAudio();
                break;
            case "CB_TTY_RINGING":
                AddInviteAudio(publisherData);
                break;
            case "CB_TTY_ON_OFF":
                if(activeModule === "admin") ReloadUserTable(publisherData);
                break;
            case "CB_TTY_CONNECT":
                localStorage.setItem('connectionId',publisherData.connectionId);
                break;
            default:
                console.log(" default ", publisherData);
        }
    }
};

const onError = (evt) => {
    console.log('websocket2 ERROR:' + evt.data);
};

const doSocketStatusUpdate = (subId, status) => {
    var message = {
        "action": "message",
        "data": {
            "connection_type": "status_update",
            "status": status,
            "subId": subId
        }
    };
    var data = JSON.stringify(message);
    websocket.send(data);
};

const chatMessage = (reqMsg) => {
    var message = {
        "action": "message",
        "data": reqMsg
    };

    var data = JSON.stringify(message);
    if (WebSocketConfig.prototype.onOpen === false) {
        console.log(WebSocketConfig.prototype, " resend Message because socket disconnect");//reload page because socket disconnect
        initWebSocket();
    } else {
        websocket.send(data);
    }
};
window.addEventListener("load", initWebSocket, false);
window.onbeforeunload = function () {
    websocket.onclose = function () {

    }; // disable onclose handler first
    websocket.close();
};
const pingPong = () => {
    if (WebSocketConfig.prototype.onOpen === false) return;
    let message = {
        "action": "message",
        "data": {
            "connection_type": 'pingPong',
        }
    };
    let data = JSON.stringify(message);
    websocket.send(data);
    setTimeout(pingPong, 20000);
};
