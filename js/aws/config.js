var pathname = getAbsolutePath();
window._config = {
    cognito: {
        userPoolId: pathname.cognitoPath.userPoolId,
        region: pathname.cognitoPath.region,
        clientId: pathname.cognitoPath.clientId
    },
    domain: pathname.domain,
    apiURL: pathname.apiURL,
    caseCloudAdminApiURL: pathname.caseCloudAdminApiURL,
    caseCloudWsURL: pathname.caseCloudWsURL,
    wsURL: pathname.wsUrl,
    csvPath: pathname.csvPath,
    subUser: pathname.subUser,
    failToCheckinFrequency: pathname.failToCheckinFrequency,
    BATTERY_LOW_LEVEL: pathname.BATTERY_LOW_LEVEL,
    BATTERY_MEDIUM_LEVEL: pathname.BATTERY_MEDIUM_LEVEL,
    BATTERY_HIGH_LEVEL: pathname.BATTERY_HIGH_LEVEL,
};

let WebSocketConfig = {};
let CaseCloudWebSocketConfig = {};

function getAbsolutePath() {
    let loc = window.location;
    let pathName = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
    let fullpath = loc.pathname;
    let url = loc.href;
    let origin = loc.origin;
    fullpath.indexOf(1);
    fullpath.toLowerCase();
    fullpath = fullpath.split("/")[1];
    console.log(fullpath, " Full fullpath ", origin);
    let stages = '', apiURL = '', wsUrl = '', caseCloudAdminApiURL = '', caseCloudWsURL = '', clientId = '',
        region = '', userPoolId = '', csvPath = '', subUser = 'f12d8472-8093-4e8d-9bc1-1422d0ba7131',
        failToCheckinFrequency = 60, BATTERY_LOW_LEVEL = 10, BATTERY_MEDIUM_LEVEL = 30, BATTERY_HIGH_LEVEL = 50;
    if (fullpath === "caseanswersystem-microservice") {
        stages = 'test/';
        clientId = '27av6neknrp7ul9oshj2sq53pv';
        userPoolId = 'us-west-2_szPHmhW1Q';
        region = 'us-west-2';
        csvPath = 'test-case-answer-system-table-csv';
        wsUrl = 'wss://y16w4ga62l.execute-api.us-west-2.amazonaws.com/test/';
        caseCloudAdminApiURL = 'http://localhost:3000/local/';
        //caseCloudAdminApiURL = 'https://cvs-test-api.casees.cloud/';
        caseCloudWsURL = 'wss://33kop2qtwe.execute-api.us-west-2.amazonaws.com/dev';
        apiURL = 'https://9wdkgllfc7.execute-api.us-west-2.amazonaws.com/test/';
        subUser='c768bd26-3ff0-4db2-ad08-148160e83933';
    } else {
        stages = 'test/';
        clientId = '27av6neknrp7ul9oshj2sq53pv';
        userPoolId = 'us-west-2_szPHmhW1Q';
        region = 'us-west-2';
        csvPath = 'test-case-answer-system-table-csv';
        wsUrl = 'wss://y16w4ga62l.execute-api.us-west-2.amazonaws.com/test/';
        //caseCloudAdminApiURL = 'https://8vmw8ogco6.execute-api.us-west-2.amazonaws.com/dev/';
        caseCloudAdminApiURL = 'https://cvs-test-api.casees.cloud/';
        caseCloudWsURL = 'wss://33kop2qtwe.execute-api.us-west-2.amazonaws.com/dev';
        apiURL = 'https://9wdkgllfc7.execute-api.us-west-2.amazonaws.com/test/';
        subUser='c768bd26-3ff0-4db2-ad08-148160e83933';
    }

    let path = {
        domain: loc.href.substring(0, loc.href.length - ((loc.pathname + loc.search + loc.hash).length - pathName.length)),
        pathName: pathName,
        stages: stages,
        apiURL: apiURL,
        wsUrl: wsUrl,
        caseCloudAdminApiURL: caseCloudAdminApiURL,
        caseCloudWsURL: caseCloudWsURL,
        origin: origin,
        cognitoPath: {
            userPoolId: userPoolId,
            region: region,
            clientId: clientId
        },
        url: url,
        csvPath: csvPath,
        fullpath: fullpath,
        subUser: subUser,
        failToCheckinFrequency: failToCheckinFrequency,
        BATTERY_LOW_LEVEL: BATTERY_LOW_LEVEL,
        BATTERY_MEDIUM_LEVEL: BATTERY_MEDIUM_LEVEL,
        BATTERY_HIGH_LEVEL: BATTERY_HIGH_LEVEL,
    };
    console.log(path, " pathName ");
    return path;
}
