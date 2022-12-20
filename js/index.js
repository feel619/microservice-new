window.map;
let whichView = "";
let IsSafari = false;
let isIPhoneDevice = false;
let ActiveChannel = "";
let LastActiveChannel = "";
let infoChat = {};
let centerCords = {
    lat: 29.7265904,
    lng: -95.5635037
};
let markers = [];
let markersPlay = [];
let runningPublisherId = [];
let runningCallBoxId = [];
let iconBase = 'images/map-pin-blue.png';
let playingIcon = "images/map-pin-play.gif";
let playIcon = "images/map-pin.gif";
let redIcon = "images/map-Red-pin.png";
let yellowIcon = "images/map-Yellow-pin.png";
let stopIcon = "images/map-pin.png";
let infowindow, marker;
let info_content = [];
let acceptCalls = [];
let annotateReplayId = '';
let msgQueueTimeout = 500;
let markerGroups = {
    "Red": [],
    "Yellow": [],
    "Blue": [],
    "LightBlue": [],
    "Construct": [],
    "Black": [],
};

function Queue() {
    this._oldestIndex = 1;
    this._newestIndex = 1;
    this._storage = {};
}

Queue.prototype.size = function () {
    return this._newestIndex - this._oldestIndex;
};
Queue.prototype.enqueue = function (data) {
    this._storage[this._newestIndex] = data;
    this._newestIndex++;
};
Queue.prototype.dequeue = function () {
    let oldestIndex = this._oldestIndex,
        newestIndex = this._newestIndex,
        deletedData;

    if (oldestIndex !== newestIndex) {
        deletedData = this._storage[oldestIndex];
        delete this._storage[oldestIndex];
        this._oldestIndex++;

        return deletedData;
    }
};
// check if the queue is empty
Queue.prototype.isEmpty = function () {
    return (this._newestIndex - this._oldestIndex) === 0;
};
Queue.prototype.length = function () {
    return this._storage.length;
};
let msgQueue = new Queue();
let outMsgQueue = new Queue();

initMap();
let bounds = new google.maps.LatLngBounds();

function initMap() {
    let myOptions = {
        restriction: {
            latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180
            }
        },
        zoom: 14,
        disableDefaultUI: true,
        center: centerCords,
        mapTypeId: 'roadmap',
        streetViewControl: true,
        mapTypeControl: true,
        scaleControl: true,
        zoomControl: true,
        styles:[
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.business",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }
        ]
        //fullscreenControl: true
    };
    window.map = new google.maps.Map(document.getElementById("map"), myOptions);
    infowindow = new google.maps.InfoWindow({maxWidth: 900});
}

function addMarker(callBoxValue) {
    let lat = callBoxValue.lat;
    let long = callBoxValue.long;
    let publisherId = parseInt(callBoxValue.ani_number) + '_' + callBoxValue.region_id;
    let regionName = callBoxValue.regionData.region_name;
    let regionCode = callBoxValue.regionData.region_code;
    let callBoxName = regionName + '-' + callBoxValue.ani_number;
    // let regionIdANI = regionCode + '-' + callBoxValue.ani_number;
    let myLatLng = new google.maps.LatLng(lat, long);
    marker = new google.maps.Marker({
        position: myLatLng,
        map: window.map,
        icon: stopIcon,
        customInfo: "video"
    });
    let contentString = '';
    markers.push(marker);
    markersPlay[publisherId] = marker;
    info_content[publisherId] = contentString;
    bounds.extend(marker.position);
    //map.setZoom(14);
    google.maps.event.addListener(marker, 'click', function (event) {
        let pub_id = ((ActiveChannel) ? ActiveChannel : publisherId);
        resetPlayIcon(pub_id);
        const isCallBoxLive = runningPublisherId.indexOf(pub_id);
        console.log(callBoxValue, " addMarker_marker ", pub_id, isCallBoxLive);
        if (isCallBoxLive > -1) {
            openMapPage(pub_id, markersPlay[publisherId]["customInfo"]);
        } else {
            window.location.href = _config.domain + "caseAlertClassic.html?ani="+callBoxValue.ani_number+"&region="+regionCode+"&id="+callBoxValue.id;
        }
    });

    google.maps.event.addListener(marker, 'mouseover', (function (marker, contentString, infowindow) {
        return function () {
            let phone = callBoxValue.source_phone_number;
            let box_number = callBoxValue.box_number;
            let account_number = (callBoxValue.account_number ? callBoxValue.account_number : 'None') + '/' + (callBoxValue.account_name ? callBoxValue.account_name : 'None');
            let callBoxStatus = xAniCallBox.xCallBoxes[publisherId]['meta_type'].toString().split(",").join("<br />");
            if (infoChat[publisherId] && infoChat[publisherId].callBoxData !== undefined) {
                phone = infoChat[publisherId].callBoxData.callBox.source_phone_number;
                box_number = infoChat[publisherId].callBoxData.callBox.box_number;
                account_number = (infoChat[publisherId].callBoxData.callBox.account_number ? infoChat[publisherId].callBoxData.callBox.account_number : 'None') + '/' + (infoChat[publisherId].callBoxData.callBox.account_name ? infoChat[publisherId].callBoxData.callBox.account_name : 'None');
            }
            contentString = '<div id="content">' +
                '<h6 id="firstHeading" style="word-break: break-all;" class="firstHeading">' + account_number + '</h6>' +
                '<h6 style="word-break: break-all;" class="firstHeading">Boxno:' + box_number + '</h6>' +
                '<div id="bodyContent">' +
                '<p><b>Ph: ' + phone + '</b>' +
                '<p style="word-break: break-all;" ><b>' + callBoxName + '</b>' +
                '<p style=""><b>' + callBoxStatus + '</b>' +
                '</div>' +
                '</div>';
            infowindow.setContent(contentString);
            infowindow.open(window.map, marker);

            // Hide all other icons and show only same color icons
            let color = marker['icon']['color'];
            hideShowAllIcons('hide');
            showOnlySameColorIcon(color);
        };
    })(marker, contentString, infowindow));
    google.maps.event.addListener(marker, 'mouseout', (function (marker, contentString, infowindow) {
        return function () {
            infowindow.close();
            hideShowAllIcons('show');
        };
    })(marker, contentString, infowindow));
}

function hideShowAllIcons(type) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setVisible(type === 'show');
    }
}

function showOnlySameColorIcon(color) {
    for (var i = 0; i < markerGroups[color].length; i++) {
        markerGroups[color][i].setVisible(true);
    }
}

function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function clearMarkers() {
    setMapOnAll(null);
}

function deleteMarkers() {
    clearMarkers();
    markers = [];
    bounds = new google.maps.LatLngBounds();
}

function setMapCenter(pub_id) {
    let mark = markersPlay[pub_id];
    let lat = mark.getPosition().lat();
    let long = mark.getPosition().lng();
    let mapNode = window.map.getDiv();
    $('#chat_browser_map').append(mapNode);
    window.map.setCenter({lat: lat, lng: long});
    // google.maps.event.trigger(window.map, 'resize');
    window.map.setZoom(15);
    // map.setTilt(45);
    setPlayingIcon(pub_id);
}

function resetMapZoom() {
    window.map.setCenter(bounds.getCenter());
    window.map.setZoom(14);
    window.map.initialZoom = true;
    window.map.fitBounds(bounds);
    window.map.panToBounds(bounds);
}

function setPlayIcon(pub_id) {
    console.log(markersPlay[pub_id], " markersPlay[pub_id] ", playIcon);
    markersPlay[pub_id].setIcon(playIcon);
}

function setMapIcon(pub_id) {
    let mapPinColor = 'Blue';
    console.log(xAniCallBox.xCallBoxes[pub_id]['map_pin'],"xAniCallBox.xCallBoxes[pub_id]['map_pin']");
    let mapPinSize = new google.maps.Size(20, 25);
    if(xAniCallBox.xCallBoxes[pub_id]['cf_status'] === '2') {
        mapPinColor = 'Construct';
        mapPinSize = new google.maps.Size(28, 32)
    } else if(xAniCallBox.xCallBoxes[pub_id]['is_test']) {
        mapPinColor = 'Black';
        mapPinSize = new google.maps.Size(28, 32)
    } else {
        if (xAniCallBox.xCallBoxes[pub_id]['map_pin'].indexOf('Red') !== -1) {
            mapPinColor = 'Red';
            mapPinSize = new google.maps.Size(27, 30)
        } else if (xAniCallBox.xCallBoxes[pub_id]['map_pin'].indexOf('Yellow') !== -1) {
            mapPinColor = 'Yellow';
            mapPinSize = new google.maps.Size(23, 27)
        } else if (xAniCallBox.xCallBoxes[pub_id]['map_pin'].indexOf('LightBlue') !== -1) {
            mapPinColor = 'LightBlue';
            mapPinSize = new google.maps.Size(23, 27)
        } else {
        }
    }
    let mapPin = 'images/map-' + mapPinColor + '-pin.png';
    let icon = {url: mapPin, scaledSize: mapPinSize, color: mapPinColor};
    markersPlay[pub_id].setIcon(icon);
    markerGroups[mapPinColor].push(markersPlay[pub_id]);
}

function setYellowIcon(pub_id) {
    console.log(markersPlay[pub_id], " setYellowIcon[pub_id] ", yellowIcon);
    markersPlay[pub_id].setIcon(yellowIcon);
}

function setFitBound() {
    window.map.setCenter(bounds.getCenter());
    window.map.fitBounds(bounds);
    window.map.panToBounds(bounds);
    //map.setZoom(14);
    //bounds = new google.maps.LatLngBounds();
}

function setPlayingIcon(pub_id) {
    let found = runningPublisherId.indexOf(pub_id);
    if (found !== -1) {
        markersPlay[pub_id].setIcon(playingIcon);
        console.log(info_content[pub_id], " info pub ");
        infowindow.setContent(info_content[pub_id]);
        infowindow.open(window.map, markersPlay[pub_id]);
    }
}

function resetPlayIcon(pub_id) {
    let found = runningPublisherId.indexOf(pub_id);
    if (found !== -1) {
        setPlayIcon(pub_id);
    } else if (pub_id) {
        setMapIcon(pub_id);
        //markersPlay[pub_id].setIcon(stopIcon);
    }
}

window.onload = function () {
    initMap();
};

$(document).on('click', '.videoViewBtn', function (event) {
    let pub_id = $(event.currentTarget).data('id');
    event.stopPropagation();
    event.stopImmediatePropagation();
    let remoteStream = document.getElementById('remote_video_viewer_' + pub_id);
    if (remoteStream.readyState > 0) {
        openMapPage(pub_id, "video");
    }
});
$(document).on('click', '.chat-box-btn', function (event) {
    let pub_id = event.currentTarget.title;
    event.stopPropagation();
    event.stopImmediatePropagation();
    openMapPage(pub_id, "chat");
});

function openMapPage(pub_id, type) {
    deActiveBox();
    //let mapNode = window.map.getDiv();
    $('#endChatBox').show();
    ActiveChannel = pub_id;
    enLargeMap = true;
    const observer = ['technician', 'project', 'observer'];
    const user_type = localStorage.getItem("user_type");
    if (type === "video") {
        //$('#browser_map').append(mapNode);
        //$(".video-play-view").show();
        //activeBox();
        //setMapCenter(pub_id);
    } else {
        console.log(observer.indexOf(user_type), "observer.indexOf(user_type)", infoChat[pub_id]['isAccept']);
        console.log(infoChat[pub_id], " observer.indexOfIN[pub_id]", pub_id);
        if (observer.indexOf(user_type) === -1) {
            viewChatBox(pub_id);
        } else if (observer.indexOf(user_type) > -1 && infoChat[pub_id]['isAccept']) {
            viewChatBox(pub_id);
            $('#endChatBox').hide();
        }
    }
}

const viewChatBox = (pub_id) => {
    $(".home_page, .all-box-view").hide();
    //$('#chat_browser_map').append(mapNode);
    $("#chat-panel-view, #side-chat-list-view").show();
    setMapCenter(pub_id);
    activeChatBox(pub_id);
    $('#sendMsg').val('');
    $('#chatView').html('');
    $('#chat_TCP_panel').html('');
    msgQueue._storage = {};
    outMsgQueue._storage = {};
    getChatMessageByRoom(pub_id);
    acceptInviteMessage(pub_id);
    GetClassification(pub_id);
};

$(document).on('click', ".map-close-btn", function () {
    closeMapView();
});

$(document).on('click', ".status-close-btn", function () {
    $('#callBoxStatusOpenPanel').show();
    $('#callBoxStatusPanel').hide();
});
$(document).on('click', ".status-open-btn", function () {
    $('#callBoxStatusOpenPanel').hide();
    $('#callBoxStatusPanel').show();
});

function closeMapView() {
    $(".home_page").show();
    $(".video-play-view, .chat-panel-view").hide();
    let mapNode = window.map.getDiv();
    resetPlayIcon(ActiveChannel);
    $('#home_map').append(mapNode);
    enLargeMap = false;
    resetMapZoom();
    $("#local-viewer_demo-signaling_channel").prop('muted', true);
    ActiveChannel = '';
    infowindow.close();
    deActiveBox();
}

$(document).on('click', '.videos-click', function (event) {
    deActiveBox();
    resetPlayIcon(ActiveChannel);
    let channel = event.currentTarget.title;
    ActiveChannel = channel;
    setMapCenter(ActiveChannel);
    //activeBox();
});

function deActiveBox() {
    $(".chat-box-btn").removeClass("active");
}

const activeChatBox = () => {
    setPlayingIcon(ActiveChannel);
    $(".child_chat_" + ActiveChannel).addClass("active");
    let callboxName = $("#chat_sign_" + ActiveChannel).html();
    $("#chat_viewer_demo_channel").html(callboxName);
    let callBoxNames = '';
    let boxNumber = publisherCallBox[ActiveChannel]['box_number'] !== '' ? publisherCallBox[ActiveChannel]['box_number'] : '';
    let accountNo = publisherCallBox[ActiveChannel]['account_number'] !== '' ? publisherCallBox[ActiveChannel]['account_number'] : 'None';
    let accountName = publisherCallBox[ActiveChannel]['account_name'] !== '' ? publisherCallBox[ActiveChannel]['account_name'] : 'None';
    let sourcePhone = (infoChat[ActiveChannel] && infoChat[ActiveChannel].callBoxData !== undefined) ? infoChat[ActiveChannel].callBoxData.callBox.source_phone_number : publisherCallBox[ActiveChannel]['source_phone_number'];
    let callBoxName = publisherCallBox[ActiveChannel]['regionData']['region_name'] + '-' + publisherCallBox[ActiveChannel]['ani_number'];
    let description = publisherCallBox[ActiveChannel]['description'] !== '' ? publisherCallBox[ActiveChannel]['description'].replace("||||", "\r\n").split(/\n/)[0] : '';//.replace("||||", "<br>");
    callBoxNames += '<h5>Acc:<span id="acc">' + accountNo + '/' + accountName + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(acc)"></i></h5>';
    callBoxNames += '<h5>BoxNo:<span id="bxno">' + boxNumber + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(bxno)"></i></h5>';
    callBoxNames += '<p>Ph:<span id="ph">' + sourcePhone + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(ph)"></i></p>';
    callBoxNames += '<p>Desc:<span id="Desc">' + description + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(Desc)"></i></p>';
    callBoxNames += '<p>CB:<span id="cbname">' + callBoxName + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(cbname)"></i></p>';
    $("#chat_viewer_demo_channel").html(callBoxNames);
    shortcutMessage();
    getAnnotateList();
};

function GetClassification(pubId) {
    let regionId = infoChat[pubId].regionId;
    let url = "replay/classification?id=" + regionId;
    sendHTTPRequest(url, "GET", "", function (result) {
        if (result) {
            let ResponseData = result.data;
            let box_html = '<option value="" >All Classification</option>';
            let classification_box_html = '<option value="" >Select Classification</option>';
            $.each(ResponseData, function (index, value) {
                let name = value.classification_type.name + '-' + value.classification_name;
                if (value.id !== "1") {
                    classification_box_html += '<option data-name="' + name + '" value="' + value.id + '" >' + name + '</option>';
                }
                box_html += '<option data-name="' + name + '" value="' + value.id + '" >' + name + '</option>';
            });
            $("#annotate_classification_id").html(box_html);
            $("#classification_box").html(classification_box_html);
            $("#set_classification_box").html(classification_box_html);
        }
    });
}

$(document).on('change', '.annotate_filter', function (event) {
    getAnnotateList();
});

function getAnnotateList() {
    let url = "replay/annotate_listing";
    let annotate_classification_id = $("#annotate_classification_id").val();
    let user_id = $("#annotate_user_id").val();
    let data = {
        'user_id': user_id,
        'classification': annotate_classification_id,
        'video_id': infoChat[ActiveChannel].replayId
    };
    $("#annotate_listing").html('');
    if (infoChat[ActiveChannel].replayId) {
        sendHTTPRequest(url, "POST", data, function (result) {
            if (result) {
                let annotate_list = result.data;
                if (annotate_list && annotate_list instanceof Array && annotate_list.length) {
                    let annotate_box_html = '';
                    $.each(annotate_list, function (annotateInd, annotateValue) {
                        let region_name = annotateValue.region_name;
                        let date_time = new Date(annotateValue.created_at);
                        let date_format = date_time.toLocaleString();
                        let classification_name = annotateValue.classification_name;
                        let note = annotateValue.note;
                        let enter_by = annotateValue.user_data.name + '(' + annotateValue.user_data.user_type + ')';
                        let annotateId = annotateValue.id;
                        let note_time = annotateValue.note_time;
                        annotate_box_html += '<li class="admin clearfix annotate_list" data-id="' + annotateId + '" data-time="' + note_time + '" >';
                        annotate_box_html += '<div class="chat-body clearfix">';
                        annotate_box_html += '<div class=" clearfix">';
                        annotate_box_html += '<small class="left ">';
                        annotate_box_html += '<span class="fa fa-clock-o"></span> ' + date_format;
                        annotate_box_html += '</small>';
                        annotate_box_html += '<strong class="right primary-font" style="padding-left: 5px;">' + enter_by + '</strong>';
                        annotate_box_html += '</div>';
                        annotate_box_html += '<p>';
                        annotate_box_html += classification_name + ':- ' + note;
                        annotate_box_html += '</p>';
                        annotate_box_html += '</div>';
                        annotate_box_html += '</li>';
                    });
                    $("#annotate_listing").html(annotate_box_html);
                    $('#annotate_listing').scrollTop(0);
                }
            }
        });
    } else {
        console.log(" No call box found! ");
    }
}

$('form').each(function () {
    if (this.id === 'add_annotate_form' || this.id === 'set_annotate_form') {
        $(this).validate({
            rules: {
                classification_id: "required",
                note: "required"
            },
            submitHandler: function (form) {
                let unindexed_array = $(form).serializeArray();
                let data = {};
                $.map(unindexed_array, function (n, i) {
                    data[n['name']] = n['value'].trim();
                });
                let classification_name = $(this.currentForm).find('select option:selected').data('name');
                let videoId = annotateReplayId !== '' ? annotateReplayId : infoChat[ActiveChannel].replayId;
                console.log(ActiveChannel, videoId, "set_annotate_form_add_annotate_form", publisherCallBox, infoChat);
                if (videoId) {
                    data['callBox'] = publisherCallBox[ActiveChannel];
                    data['classification_name'] = classification_name;
                    data['chatRoomId'] = ActiveChannel;
                    data['video_id'] = videoId;
                    sendHTTPRequest("replay/annotate_create", "POST", data, function (result) {
                        $(form)[0].reset();
                        //checking call count and then redirect to replay
                        if ($(form)[0].id === 'set_annotate_form') {
                            console.log("SET set_annotate_form Replay.html");
                            redirectToReply(videoId);
                            // window.location.href = _config.domain + "replay.html?id=" + infoChat[ActiveChannel].replayId;
                        }
                        getAnnotateList();
                    });
                } else {
                    toastr.error("No call box found!");
                }
            }
        });
    }
});

const getTimeRemaining = (endtime) => {
    const total = Date.parse(new Date()) - Date.parse(endtime);
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    let hDisplay = hours > 0 ? hours + (hours === 1 ? " hour, " : " hours, ") : "";
    let mDisplay = minutes > 0 ? minutes + (minutes === 1 ? " minute, " : " minutes, ") : "";
    let sDisplay = seconds > 0 ? seconds + (seconds === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
    // return {total, days, hours, minutes, seconds};
};

const initializeClock = (id, endtime, acceptCall) => {
    const classArr = document.querySelectorAll('.chat_time_' + id);
    console.log(classArr, " classArr ");
    if (acceptCall) {
        console.log(acceptCall, " chat_time_acceptCall_pickUpCall ");
        clearInterval(infoChat[id]['ringTimer']);
        //infoChat[id]['ringTimer'].forEach(clearInterval);
        clearInitInterval(classArr, false);
        return;
    }
    infoChat[id]['ringTimer'] = setInterval(() => {
        const t = getTimeRemaining(endtime);
        clearInitInterval(classArr, t);
        console.log(t.total, " getTimeRemainingTotls ");
        if (t.total <= 0) {
            clearInterval(infoChat[id]['ringTimer']);
        }
    }, 1000);
};
const clearInitInterval = (classArr, t) => {
    $.each(classArr, function (index, value) {
        console.log(index, "classAEE", value);
        // value.innerHTML = (t) ? t.hours + ':' + t.minutes + ':' + t.seconds : 'Received';
        value.innerHTML = (t) ? t : 'Received';
    });
};
const viewerChat = (publisherData) => {
    let roomId = publisherData.roomId;
    let isAcceptCall = infoChat[roomId] ? !!(infoChat[roomId]['isAccept'] !== undefined && infoChat[roomId]['isAccept']) : false;
    infoChat[roomId] = publisherData;
    infoChat[roomId]['isAccept'] = isAcceptCall;
    console.log(roomId, " publisherDataRooms ", publisherData, infoChat[roomId]);
    if (runningPublisherId.indexOf(roomId) === -1) {
        const user_type = localStorage.getItem('user_type');
        const observer = ['technician', 'project', 'observer'];
        let isAccept = '';
        runningPublisherId.push(roomId);
        let account = publisherCallBox[roomId].account_number + '/' + publisherCallBox[roomId].account_name;
        let callBoxName = publisherCallBox[roomId]['regionData'].region_name + '-' + publisherCallBox[roomId].ani_number;
        let phone = (infoChat[roomId].callBoxData) ? infoChat[roomId].callBoxData.callBox.source_phone_number : publisherCallBox[roomId].source_phone_number;
        let box_number = (infoChat[roomId].callBoxData) ? infoChat[roomId].callBoxData.callBox.box_number : publisherCallBox[roomId].box_number;
        infoChat[roomId]['countIndex'] = 0;
        infoChat[roomId]['isAccept'] = false;
        console.log(publisherCallBox[roomId], " runningPublisherId ", infoChat[roomId].callBoxData);
        renderChatCallBox('template/chat_call_box_view.mustache', 'bottom_chat_call_box_view', {
            id: roomId,
            callBoxName: callBoxName,
            phone: phone,
            bottomView: true,
            user_type: user_type,
            isAccept: isAccept,
            onStatus: 'shakeActive'
        }, () => {
            infoChat[roomId]['countIndex'] = infoChat[roomId]['countIndex'] + 1;
            if (infoChat[roomId]['countIndex'] === 2) {
                let createTime = infoChat[roomId].createTime;
                let deadline = new Date(createTime);
                initializeClock(roomId, deadline, false);
            }
        });
        renderChatCallBox('template/chat_call_box_view.mustache', 'side_bar_video_view', {
            id: roomId,
            callBoxName: callBoxName,
            phone: phone,
            bottomView: false,
            user_type: user_type,
            isAccept: isAccept,
            onStatus: 'shakeActive'
        }, () => {
            infoChat[roomId]['countIndex'] = infoChat[roomId]['countIndex'] + 1;
            if (infoChat[roomId]['countIndex'] === 2) {
                let createTime = infoChat[roomId].createTime;
                let deadline = new Date(createTime);
                initializeClock(roomId, deadline, false);
            }
        });
        $(".chat-list #pub_" + roomId).removeClass('video-hide');
        $(".chat-list #pub_child_" + roomId).removeClass('video-hide');
        let contentString = '<div id="content">' +
            '<h6 style="word-break: break-all;" id="firstHeading" class="firstHeading">' + account + '</h6>' +
            '<h6 style="word-break: break-all;" class="firstHeading">' + box_number + '</h6>' +
            '<div id="bodyContent">' +
            '<p><b>Ph: ' + phone + '</b>' +
            '<p style="word-break: break-all;"><b>' + callBoxName + '</b>' +
            '</div>' +
            '</div>';
        console.log(contentString, "contentString");
        info_content[roomId] = contentString;
        infowindow.setContent(info_content[roomId]);
    } else if (ActiveChannel === roomId) {
        renderChatCallBox('template/chat_message.mustache', 'chatView', {response: publisherData}, () => {
        });
        AddPubAudio();
        CopyText(publisherData);
    }
    resetPlayIcon(roomId);
    markersPlay[roomId]['customInfo'] = 'chat';
};

const CopyText = (jsonData) => {
    console.log(jsonData, "JSONDATA");
    let subIdUser = sessionStorage.getItem("subIdUser");
    let strMessage = jsonData.message;
    if (jsonData.created_by === subIdUser) {
        singleCharMessage(strMessage);
    } else {
        for (let char of strMessage) {
            outMsgQueue.enqueue(char);
        }
        singleChar(strMessage);
    }
    // $('#chat_TCP_panel').html(msg);
};

const singleCharMessage = (strMessage) => {
    // strMessage = strMessage.replace(/ GA /g, '\r\n');
    for (let char of strMessage) {
        msgQueue.enqueue(char);
    }
    renderCharMessage();
};
let outIntervals = [];
const singleChar = (str) => {
    $('#chat_TCP_panel').append('<br />');
    infoChat[ActiveChannel]['outMsgTimeout'] = setInterval(function () {
        console.log("singleChar", infoChat[ActiveChannel]['outMsgTimeout']);
        $('#chat_TCP_panel').append(outMsgQueue.dequeue());
        if (outMsgQueue.size() === 0) {
            outIntervals.forEach(clearInterval);
            // clearInterval(infoChat[ActiveChannel]['outMsgTimeout']);
        }
    }, msgQueueTimeout);
    outIntervals.push(infoChat[ActiveChannel]['outMsgTimeout']);
};
let inIntervals = [];
const renderCharMessage = () => {
    $('#chat_TCP_panel').append('<br />');
    infoChat[ActiveChannel]['msgTimeout'] = setInterval(function () {
        console.log("renderCharMessage", infoChat[ActiveChannel]['msgTimeout']);
        $('#chat_TCP_panel').append(msgQueue.dequeue());
        if (msgQueue.size() === 0) {
            inIntervals.forEach(clearInterval);
            // clearInterval(infoChat[ActiveChannel]['msgTimeout']);
        }
    }, msgQueueTimeout);
    inIntervals.push(infoChat[ActiveChannel]['msgTimeout']);
};

let shiftDown = false;
let messageBox = $("#sendMsg");
$(document).keypress(function (e) {
    if (e.keyCode === 13) {
        if (messageBox.is(":focus") && !shiftDown) {
            e.preventDefault();
            sendMessage();
        }
    }
});
$(document).keydown(function (e) {
    if (e.keyCode === 16) shiftDown = true;
});
$(document).keyup(function (e) {
    if (e.keyCode === 16) shiftDown = false;
});
const sendMessage = () => {
    let Msg = $('#sendMsg').val();
    let message = Msg.toUpperCase().replace(/[|~`@#%^*_+{}'"<>\[\]'\\]/g, "");
    let subIdUser = sessionStorage.getItem("subIdUser");
    if (ActiveChannel !== '' && message.trim()) {
        let reqMsg = {
            "connection_type": 'RPIMessage',
            "message": 'CB_TTY_RX~' + message + ' GA \r\n',
            "sub": subIdUser,
            "remoteAddress": infoChat[ActiveChannel].remoteAddress,
            "remotePort": infoChat[ActiveChannel].remotePort,
            "roomId": ActiveChannel,
            "regionId": infoChat[ActiveChannel].regionId,
            "replayId": infoChat[ActiveChannel].replayId,
            "name": localStorage.getItem('user_name'),
            "user_type": localStorage.getItem('user_type'),
            "reason": '',
            "RPI": "0"
        };
        chatMessage(reqMsg);
        $('#sendMsg').val('');
        bottomScrolling();
    }
};

const shortcutMessage = () => {
    let shortcutHtml = '<table class="table table-hover">' +
        '  <thead>' +
        '    <tr>' +
        //'      <th scope="col">Region</th>' +
        '      <th scope="col">Key</th>' +
        '      <th scope="col">Message</th>' +
        '    </tr>' +
        '  </thead>' +
        '  <tbody>';
    let region_id = publisherCallBox[ActiveChannel].region_id;
    sendHTTPRequest("shortcuts/region?id=" + region_id, 'GET', "", function (result) {
        if (result.data) {
            $('#shortcutListPanel').html('');
            let ResponseData = result.data;
            $.each(ResponseData, function (index, value) {
                shortcutHtml += '<tr>';
                //    shortcutHtml+='<td>'+value.region_name+'</td>';
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

const acceptInviteMessage = (ActiveChannel) => {
    console.log("acceptInviteMessage", ActiveChannel, infoChat);
    if (ActiveChannel !== '') {
        let reqMsg = {
            "connection_type": 'RPIMessage',
            "message": 'CB_TTY_RX~    \r\n',
            "sub": sessionStorage.getItem("subIdUser"),
            "remoteAddress": infoChat[ActiveChannel].remoteAddress,
            "remotePort": infoChat[ActiveChannel].remotePort,
            "roomId": ActiveChannel,
            "regionId": infoChat[ActiveChannel].regionId,
            "replayId": infoChat[ActiveChannel].replayId,
            "name": infoChat[ActiveChannel].name,
            "user_type": localStorage.getItem('user_type'),
            "RPI": "0",
            "reason": '',
            "accept": "accept",
        };
        chatMessage(reqMsg);
        acceptCallList(ActiveChannel);
        stopInviteAudio();
    }
};


const endChatBox = () => {
    console.log("endChatBox:", ActiveChannel, infoChat[ActiveChannel]);
    let reqMsg = {
        "connection_type": 'RPIMessage',
        "message": 'CB_TTY_CALL_END',
        "sub": sessionStorage.getItem("subIdUser"),
        "remoteAddress": infoChat[ActiveChannel].remoteAddress,
        "remotePort": infoChat[ActiveChannel].remotePort,
        "roomId": ActiveChannel,
        "regionId": infoChat[ActiveChannel].regionId,
        "replayId": infoChat[ActiveChannel].replayId,
        "name": infoChat[ActiveChannel].name,
        "user_type": localStorage.getItem('user_type'),
        "reason": sessionStorage.getItem("subIdUser"),
        "RPI": "0"
    };
    chatMessage(reqMsg);
};

const removeAcceptCall = (roomId) => {
    const acceptIndex = acceptCalls.indexOf(roomId);
    if (acceptIndex > -1) {
        console.log("removeAcceptCall1");
        acceptCalls.splice(acceptIndex, 1);
    }
};

const deActiveChatCall = (publisherData) => {
    const index = runningPublisherId.indexOf(publisherData.roomId);
    const acceptIndex = acceptCalls.indexOf(publisherData.roomId);
    console.log(infoChat[ActiveChannel], "  deActiveChatCalls ", publisherData.roomId);
    initializeClock(publisherData.roomId, null, true);
    clearAllInterval();
    stopInviteAudio();
    clearTimeout(ringTimeOut);

    if (index > -1) {
        runningPublisherId.splice(index, 1);
        $(".chat-list #pub_" + publisherData.roomId).remove();
        $(".chat-list #pub_child_" + publisherData.roomId).remove();
        resetPlayIcon(publisherData.roomId);
    }
    //if user pickup call then ask annotation
    console.log(acceptIndex, " removeAcceptCall3 ", acceptCalls);
    if (acceptIndex > -1) {
        acceptCalls.splice(acceptIndex, 1);
        AnnotateExist(publisherData.replayId);
    }
};
const existActiveChatCall = (publisherData) => {
    console.log(infoChat[ActiveChannel], "  existActiveChatCall ", publisherData.roomId);
    removeAcceptCall(publisherData.roomId);
    initializeClock(publisherData.roomId, null, true);
    clearAllInterval();
    stopInviteAudio();
    closeMapView();
};
const clearAllInterval = () => {
    outIntervals.forEach(clearInterval);
    inIntervals.forEach(clearInterval);
};
const callBusy = (publisherData) => {
};
const pickUpCall = (publisherData) => {
    let deadline = new Date().getTime();
    console.log(deadline, " removeAcceptCall2 ", publisherData.roomId);
    initializeClock(publisherData.roomId, deadline, true);
    stopInviteAudio();
    clearTimeout(ringTimeOut);
    acceptCallList(publisherData.roomId);
};

const acceptCallList = (callId) => {
    console.log(callId, "isInArray(ActiveChannel,acceptCalls)");
    infoChat[callId]['isAccept'] = true;
    $('.child_chat_' + callId).addClass('show');
    if (!isInArray(callId, acceptCalls)) acceptCalls.push(callId);
};

const AnnotateExist = (replayId) => {
    annotateReplayId = replayId;
    // let id = infoChat[ActiveChannel].replayId;
    let url = "annotate/exist?id=" + annotateReplayId;
    sendHTTPRequest(url, "GET", "", function (result) {
        console.log("AnnotateExists", result);
        if (result.data.last_classification_id !== "" || result.data.regionData.isAnnotation === '2') {
            redirectToReply(annotateReplayId);
        } else {
            let callBoxName = result.data.regionData.region_code + '-' + result.data.callBoxData.ani_number;
            $('#AnnotateModalLabel').html('Add Annotate for ' + callBoxName);
            $('#AnnotateModal').modal('show');
        }
    });
};
$('#AnnotateModal').on('hidden.bs.modal', function (e) {
    AnnotateExist(annotateReplayId);
    annotateReplayId = infoChat[acceptCalls[0]].replayId;
});
const redirectToReply = (id) => {
    if (acceptCalls.length <= 0) {
        window.location.href = _config.domain + "replay.html?id=" + id;
    } else {
        $('#AnnotateModal').modal('hide');
        openMapPage(acceptCalls[0], "chat");
        console.log("reset call and redirect to another", acceptCalls[0]);
    }
};

function checkModulePermission() {
    let user_type = localStorage.getItem("user_type");
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
}

function getListingOfCallBoxStatus() {
    let url = "liveMessage/list";
    let region = $('#region_id').val();
    sendCaseCloudHTTPRequest(url + `?id=${region}`, "GET", "", function (result) {
        $('#callBoxStatusListRed').html('<div id="callBoxStatusListRedTotal"></div>');
        $('#callBoxStatusListYellow').html('<div id="callBoxStatusListYellowTotal"></div>');
        $('#callBoxStatusListBlueTotal,#callBoxStatusListRedTotal,#callBoxStatusListYellowTotal').html('');
        let ResponseData = result.data;
        renderCallBoxStatus(ResponseData);
    });
}

$(document).on('change', '#region_id', function (event) {
    let regionCode = $(this).val();
    let regionId = $(this).find(':selected').data('id');
    markerRegionReset(regionCode);
    regionId = regionId ? regionId : '';
    regionCode = regionCode ? regionCode : '';
    console.log(regionId, " Regon ", regionCode);
    localStorage.setItem("region_id", regionId);
    localStorage.setItem("region_code", regionCode);
});

const markerRegionReset = (regionCode) => {
    deleteMarkers();
    let RegionBox = regionCode ? regionCodeList[regionCode].callBox : allCallBox.callBox;
    $.each(RegionBox, function (callBoxInd, callBoxValue) {
        addMarker(callBoxValue);
        if (callBoxInd === (RegionBox.length - 1)) {
            setFitBound();
           // getLiveChatBox();
            getListingOfCallBoxStatus();
            xAniCallBox.totalCallBox = callBoxInd + 1;
            let message = {"connection_type": connection_type};
            chatMessage(message);
        }
    });
};

function renderCallBoxStatus(ResponseData) {
    $.each(ResponseData, function (index, value) {
        viewRenderLiveCallBoxStatus(value);
    });
    calculationCallBoxStatus();
}

const viewRenderLiveCallBoxStatus = (ResponseData) => {
    let liveMessagesData = ResponseData.TCAR != null ? ResponseData.TCAR.TLMD : '';
    let regionId = ResponseData.region_id;
    let ani = parseInt(ResponseData.ani_number);//for 0000
    let regionANI = ani + '_' + regionId;
    $('.status_' + regionANI).remove();
    if (xAniCallBox.xCallBoxes[regionANI]) {
        xAniCallBox.xCallBoxes[regionANI].callBoxStatus = ResponseData;
        if (ResponseData['cf_status'] === '2' || ResponseData['p_status'] === '0') {
            xAniCallBox.xCallBoxes[regionANI].callBoxStatus['pin'] = 'construct';
            xAniCallBox.xCallBoxes[regionANI]['map_pin'].push('construct');
            xAniCallBox.xCallBoxes[regionANI]['meta_type'].push('Inactive');
        } else {
            let messagesData = liveMessagesData.TMD;
            xAniCallBox.xCallBoxes[regionANI]['meta_type'] = [];
            xAniCallBox.xCallBoxes[regionANI]['map_pin'] = [];
            messagesData.map((val, key) => {
                let aniMetaInfo = val.TAMI;
                let aniMetaData = val.TAMD;
                xAniCallBox.xCallBoxes[regionANI].callBoxStatus['pin'] = aniMetaInfo.color;
                xAniCallBox.xCallBoxes[regionANI]['map_pin'].push(aniMetaInfo.color);
                xAniCallBox.xCallBoxes[regionANI]['meta_type'].push(aniMetaData.meta_type);
            });
        }
        setMapIcon(regionANI);
    } else {
        console.log(regionANI, " RegionANINotFoundMessagesData ", liveMessagesData);
    }
};

const updateLiveCallBoxStatus = (ResponseData) => {
    viewRenderLiveCallBoxStatus(ResponseData);
    calculationCallBoxStatus();
};

const calculationCallBoxStatus = () => {
    let url = "liveMessage/count";
    let region = $('#region_id').val();
    sendCaseCloudHTTPRequest(url + `?id=${region}`, "GET", "", function (result) {
        $('#callBoxStatusListTotal,#callBoxStatusListBlueTotal,#callBoxStatusListRedTotal,#callBoxStatusListYellowTotal,#callBoxStatusListLightBlueTotal,#callBoxStatusListGreyTotal').html('');
        let rowsData = result.data;
        console.log('rowsData', rowsData);
        console.log('callBoxData(Total Call Box)', rowsData.callBoxData);
        // let totalAlarm = parseInt(rowsData.alarmCounting[0]['TotalCount']);
        let total = rowsData.callBoxData;
        let totalAlarm = parseInt(total['active']);
        let totalInactive = parseInt(total['inactive']);
        let totalTest = parseInt(total['test']);
        let TotalCallBoxes = totalAlarm + totalInactive;
        let totalBlueAlarm = parseInt(rowsData.alarmCounting[0]['BlueColor']);
        let totalLightBlueAlarm = parseInt(rowsData.alarmCounting[0]['LightBlueColor']);
        let totalRedAlarm = parseInt(rowsData.alarmCounting[0]['RedColor']);
        let totalYellowAlarm = parseInt(rowsData.alarmCounting[0]['YellowColor']);
        let totalGreyColor = parseInt(rowsData.alarmCounting[0]['GreyColor']);
        let percentageBlue = isNaN((totalBlueAlarm * 100 / totalAlarm)) ? 0 : (totalBlueAlarm * 100 / totalAlarm).toFixed(2);
        let percentageLightBlue = isNaN((totalLightBlueAlarm * 100 / totalAlarm)) ? 0 : (totalLightBlueAlarm * 100 / totalAlarm).toFixed(2);
        let percentageRed = isNaN((totalRedAlarm * 100 / totalAlarm)) ? 0 : (totalRedAlarm * 100 / totalAlarm).toFixed(2);
        let percentageYellow = isNaN((totalYellowAlarm * 100 / totalAlarm)) ? 0 : (totalYellowAlarm * 100 / totalAlarm).toFixed(2);
        let percentageGrey = isNaN(((totalGreyColor + totalInactive) * 100 / TotalCallBoxes)) ? 0 : ((totalGreyColor + totalInactive) * 100 / TotalCallBoxes).toFixed(2);
        let callBoxTotalHtml = 'Total Call Boxes ' + TotalCallBoxes + ' (' + totalAlarm + ' Active + ' + totalInactive + ' Inactive)';
        // let callBoxStatusBlueHtml = 'Blue (' + percentageBlue + '%)  ' + totalBlueAlarm + ' of ' + totalAlarm;
        let callBoxStatusBlueHtml = (isNaN(totalBlueAlarm) ? 0 : totalBlueAlarm) + ' of ' + totalAlarm + '(' + percentageBlue + '%) Operational';
        let callBoxStatusLightBlueHtml = (isNaN(totalLightBlueAlarm) ? 0 : totalLightBlueAlarm) + ' of ' + totalAlarm + '(' + percentageLightBlue + '%) Informational';
        let callBoxStatusRedHtml = (isNaN(totalRedAlarm) ? 0 : totalRedAlarm) + ' of ' + totalAlarm + '(' + percentageRed + '%) Service Required';
        let callBoxStatusYellowHtml = (isNaN(totalYellowAlarm) ? 0 : totalYellowAlarm) + ' of ' + totalAlarm + '(' + percentageYellow + '%) Degraded Operations';
        let callBoxStatusGreyHtml = (isNaN((totalGreyColor + totalInactive)) ? 0 : (totalGreyColor + totalInactive)) + ' of ' + TotalCallBoxes + ' (' + percentageGrey + '%) Inactive/Bagged';
        $('#callBoxStatusListTotal').html(callBoxTotalHtml);
        $('#callBoxStatusListBlueTotal').prepend(callBoxStatusBlueHtml);
        $('#callBoxStatusListLightBlueTotal').prepend(callBoxStatusLightBlueHtml);
        $('#callBoxStatusListRedTotal').prepend(callBoxStatusRedHtml);
        $('#callBoxStatusListYellowTotal').prepend(callBoxStatusYellowHtml);
        $('#callBoxStatusListGreyTotal').prepend(callBoxStatusGreyHtml);
    });
};

