function initIndex() {
    $(".alert_sound_background").hide();
    console.log(_config.CryptoHas, " _config.CryptoHas ");
    if (_config.CryptoHas !== "" && _config.CryptoHas !== undefined) {
        GetRegions();
    }
}

let regionCallBox = {};
let publisherCallBox = {};
let regionListBox = {};
let regionCodeList = {};
let allCallBox = {};
const xAniCallBox = {
    totalCallBox: 0,
    xCallBoxes: {},
    xBlue:0,
    xYellow:0,
    xRed:0,
        xStatus: {
        '1000': 'blue',
        '0400':  'blue',
        '2000': {
            '10': 'blue',
            '20': 'yellow',
            '30': 'red',
        },
        '0100': {
            '10': 'blue',
            '20': 'yellow',
            '30': 'red',
        },
        '0010': {
            '60': 'blue',
            '120': 'yellow',
            '180': 'red',
        },
        '0002': 'red',
        '0200':'yellow',
        '0040': 'red',
        '0020': 'red',
        '0004': 'yellow',
        '4000': 'blue',
        '0001': 'red',
    }
};
const xCallBoxStatus = {
    'status': '1',
};
const GetRegions = () => {
    sendCaseCloudHTTPRequest('users/region', "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let region_box = '<option value="">All</option>';
            let regionId = localStorage.getItem('region_id');
            $.each(ResponseData, function (index, value) {
                regionListBox[value.id] = value;
                regionCodeList[value.region_code] = value;
                regionCodeList[value.region_code]['callBox'] = [];
                let selected = (regionId && value.id === regionId) ? 'selected' : '';
                region_box += '<option '+selected+' data="'+value.id+'" data-id="' + value.id + '" value="' + value.region_code + '">' + value.region_name + '</option>';
            });
            $('#region_id').html(region_box);
            //localStorage.setItem("region_id", '');
            //localStorage.setItem("region_code", '');
            getAllCallBox();
        }
    });
};

const getAllCallBox = () => {
    let call_box_html = '';
    let sub_box_html = '';
    ActiveChannel = '';
    runningPublisherId = [];
    deleteMarkers();
    //removeAllStream();
    sendCaseCloudHTTPRequest("users/region/callBox", "GET", "", function (result) {
        if (result) {
            let RegionBox = result.data;
            if (RegionBox && RegionBox instanceof Array && RegionBox.length) {
                allCallBox['callBox'] = RegionBox;
                $.each(RegionBox, function (callBoxInd, callBoxValue) {
                    let regionId = callBoxValue.region_id;
                    let aniNumber = parseInt(callBoxValue.ani_number);
                    let aniRegion = aniNumber + '_' + regionId;
                    callBoxValue.regionData = regionListBox[regionId];
                    callBoxValue.callBoxStatus = xCallBoxStatus;
                    regionCallBox[regionId] = callBoxValue;
                    publisherCallBox[aniRegion] = callBoxValue;
                    let aniCallBoxName = callBoxValue.regionData.region_code + '-' + aniNumber;
                    xAniCallBox.xCallBoxes[aniRegion] = callBoxValue;
                    xAniCallBox.xCallBoxes[aniRegion]['meta_type'] = [];
                    xAniCallBox.xCallBoxes[aniRegion]['map_pin'] = [];
                    //Only active callbox with lat/long not null must be shown
                    /*if (callBoxValue.cf_status && callBoxValue.cf_status === '1') {
                        addMarker(callBoxValue);
                    }*/
                    regionCodeList[callBoxValue.regionData.region_code]['callBox'].push(callBoxValue);

                    /*if (callBoxInd === (RegionBox.length - 1)) {
                        setFitBound();
                        getLiveChatBox();
                        getListingOfCallBoxStatus();
                        xAniCallBox.totalCallBox = callBoxInd + 1;
                        let message = {
                            "connection_type": connection_type,
                        };
                        chatMessage(message);
                    }*/
                });
                markerRegionReset(localStorage.getItem('region_code'));
            }
        }
    });
    $("#bottom-callbox-view").html(call_box_html);
    $("#side_bar_video_view").html(sub_box_html);
};
