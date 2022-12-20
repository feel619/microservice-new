let caseCloudWebsocket = null;
const initCaseCloudWebSocket = () => {
    const url = _config.caseCloudWsURL;
    caseCloudWebsocket = new WebSocket(url);
    caseCloudWebsocket.onopen = function (evt) {
        onCaseCloudOpen(evt)
    };
    caseCloudWebsocket.onclose = function (evt) {
        onCaseCloudClose(evt)
    };
    caseCloudWebsocket.onmessage = function (evt) {
        onCaseCloudMessage(evt)
    };
    caseCloudWebsocket.onerror = function (evt) {
        onCaseCloudError(evt)
    };
};

const onCaseCloudOpen = (evt) => {
    CaseCloudWebSocketConfig.prototype = {
        onOpen: true,
        webSocket: caseCloudWebsocket
    };
    console.log("openSocket");
    const message = {
        "connection_type": connection_type,
    };
    chatCaseCloudMessage(message);
};

const onCaseCloudClose = (evt) => {
    CaseCloudWebSocketConfig.prototype = {
        onOpen: false,
        webSocket: caseCloudWebsocket
    };
    console.log("closeSocket");
    initCaseCloudWebSocket();
};

const onCaseCloudMessage = (evt) => {
    const publisherData = JSON.parse(evt.data);
    const connection_type = publisherData.connection_type;
    switch (connection_type) {
        case "updateLiveCallBoxStatus":
            if (activeModule === "home") updateLiveCallBoxStatus(publisherData['updateResult']);
            break;
        case "sendLiveStatusMessage":
            if (activeModule === "caseAlertRealTime") {
                sendLiveStatusMessage(publisherData['updateResult']['status']);
            }
            if (activeModule === "cbMessageLog") {
                sendLiveLogMessage(publisherData['updateResult']['log']);
            }
            break;
        case "sendLiveLogMessage":
            if (activeModule === "cbMessageLog") sendLiveLogMessage(publisherData['updateResult']);
            break;
        default:
            console.log(" default ", publisherData);
    }
};

const onCaseCloudError = (evt) => {
    console.log('caseCloudWebsocket ERROR:' + evt.data);
};

const chatCaseCloudMessage = (reqMsg) => {
    const message = {
        "action": "message",
        "data": reqMsg
    };
    const data = JSON.stringify(message);
    if (CaseCloudWebSocketConfig.prototype.onOpen === false) {
        console.log(CaseCloudWebSocketConfig.prototype, " resend Message because socket disconnect");//reload page because socket disconnect
        initCaseCloudWebSocket();
    } else {
        caseCloudWebsocket.send(data);
    }
};
window.addEventListener("load", initCaseCloudWebSocket, false);
