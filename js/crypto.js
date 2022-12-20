function encryptString(cipherText) {
    let plaintext = CryptoJS.AES.encrypt(JSON.stringify(cipherText), _config.CryptoHas);
    console.log(plaintext.toString(), " encodedData_plaintext ", plaintext);
    return plaintext;
}

function decryptString(ciphertext) {
    let bytes = CryptoJS.AES.decrypt(ciphertext.toString(), _config.CryptoHas);
    let plaintext = bytes.toString(CryptoJS.enc.Utf8);
    let decodeKey = JSON.parse(plaintext);
    //console.log(decodeKey," decryptString ",plaintext);
    return decodeKey;
}

function base64Encode(Key) {
    let encodedData = window.btoa(Key);
    return encodedData;
}

function base64Decode(Key) {
    let encodedData = window.atob(Key);
    return encodedData;
}

function encrypt64AES(Key) {
    let ciphertext = CryptoJS.AES.encrypt(Key, _config.CryptoHas);
    let encodedData = window.btoa(ciphertext);
    return encodedData;
}

function decrypt64AES(Key) {
    let decodedData = window.atob(Key);
    let bytes = CryptoJS.AES.decrypt(decodedData.toString(), _config.CryptoHas);
    let plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext;
}

function decrypt() {
    let decodedData = 'U2FsdGVkX1+sb/pHwnBaWDZJPDccyH8+PZRm5sguiKE=';
    let bytes = CryptoJS.AES.decrypt(decodedData, 'secret key 123');
    let plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext;
}

function getConfigSettings() {
    sendCaseCloudHTTPRequest("users/config/list", "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            _config.webData = [];
            $.each(ResponseData, function (index, res) {
                let name = res.name;
                let value = res.value;
                _config.webData[name] = value;
            });
            let baseKey = window.atob(_config.webData.baseKey);
            let cryptoKey = window.atob(_config.webData.cryptoKey);
            let bytes = CryptoJS.AES.decrypt(cryptoKey.toString(), baseKey);
            let plaintext = bytes.toString(CryptoJS.enc.Utf8);
            _config.CryptoHas = plaintext;
            if (activeModule === "publisher" || activeModule === "home") {
                initIndex();
            }
        }
    });
}
