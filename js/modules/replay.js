var map;
var ActiveChannel = "";
//var LastActiveChannel = "";
var centerCords = {
    lat: 29.7265904,
    lng: -95.5635037
};
var markers = [];
var markersPlay = [];
var lastMarkersId = [];
var runningPublisherId = [];
var iconBase = 'images/map-pin-blue.png';
var playingicon = "images/map-pin-play.gif";//images/map-pin-play.gif
var playicon = "images/map-pin.png";//images/map-pin.gif
var stopIcon = "images/map-pin.png";
var infowindow, marker;
var info_content = [];
var filter_region_id = '';
var lastClassification = 1;
initMap();
var bounds = new google.maps.LatLngBounds();

function initMap() {
    var myOptions = {
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
    };
    map = new google.maps.Map(document.getElementById("browser_map"), myOptions);
    infowindow = new google.maps.InfoWindow();
}

function addMarker(callBoxValue) {
    var lat = callBoxValue.callBoxData.lat;
    var long = callBoxValue.callBoxData.long;
    var publisherId = callBoxValue.id;
    //var board_id = callBoxValue.board_id;
    var myLatlng = new google.maps.LatLng(lat, long);
    var date_time = new Date(callBoxValue.created_at);
    var date_format = date_time.toLocaleString();
    marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        icon: stopIcon,
    });
    let boxNumber = callBoxValue.callBoxData.box_number !== '' ? callBoxValue.callBoxData.box_number : '';
    let accountNo = callBoxValue.callBoxData?.account_number ? callBoxValue.callBoxData.account_number : 'None';
    let accountName = callBoxValue.callBoxData?.account_name ? callBoxValue.callBoxData.account_name : 'None';
    let phone = callBoxValue.callBoxData?.source_phone_number !== '' ? callBoxValue.callBoxData.source_phone_number : 'None';
    let callBoxName = (callBoxValue.regionData) ? callBoxValue.regionData.region_name+'-'+callBoxValue.callBoxData.ani_number: callBoxValue.callBoxData.call_box_name;
    var contentString = '<div id="content">' +
        '<h6 id="firstHeading" style="word-break: break-all;" class="firstHeading">' + accountNo +'/'+ accountName +'</h6>' +
        '<h6 id="firstHeading" style="word-break: break-all;" class="firstHeading">' + boxNumber +'</h6>' +
        '<div id="bodyContent">' +
        '<p><b> ph: ' + phone + '</b>' +
        '<p style="word-break: break-all;" ><b> ' + callBoxName  + '</b>' +
        '</div>' +
        '</div>';
    // infowindow = new google.maps.InfoWindow({
    //    content: contentString
    // });
    markers.push(marker);
    markersPlay[publisherId] = marker;
    //lastMarkersId[board_id] = marker;
    info_content[publisherId] = contentString;
    google.maps.event.addListener(marker, 'click', function (event) {
        var pub_id = ((ActiveChannel) ? ActiveChannel : publisherId);
        resetPlayIcon(pub_id);
        openMapPage(publisherId);
    });
    google.maps.event.addListener(marker, 'mouseover', (function (marker, contentString, infowindow) {
        return function () {
            infowindow.setContent(contentString);
            infowindow.open(map, marker);
        };
    })(marker, contentString, infowindow));
    google.maps.event.addListener(marker, 'mouseout', (function (marker, contentString, infowindow) {
        return function () {
            infowindow.close();
            /*if (ActiveChannel != '') {
                infowindow.setContent(info_content[ActiveChannel]);
                infowindow.open(map, markersPlay[ActiveChannel]);
            }*/
        };
    })(marker, contentString, infowindow));
}

function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
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
    console.log(pub_id, " pub_id ");
    var mark = markersPlay[pub_id];
    var lat = mark.getPosition().lat();
    var long = mark.getPosition().lng();
    map.setCenter({lat: lat, lng: long});
    // map.setCenter(latlngbounds.getCenter());
    // map.setZoom(14); // remove zoom level default 4 dec
}

function resetMapZoom() {
    map.setCenter(latlngbounds.getCenter());
    map.setZoom(14);
}

function setPlayIcon(pub_id) {
    markersPlay[pub_id].setIcon(playicon);
    // var board_id = replayCallBox[pub_id].board_id;
    // lastMarkersId[board_id].setIcon(playicon);
}

function setPlayingIcon(pub_id) {
    var found = runningPublisherId.indexOf(pub_id);
    if (found !== -1) {
        //var board_id = replayCallBox[pub_id].board_id;
        //lastMarkersId[board_id].setIcon(playingicon);
        markersPlay[pub_id].setIcon(playingicon);
        infowindow.setContent(info_content[pub_id]);
        infowindow.open(map, markersPlay[pub_id]);
    }
}

function resetPlayIcon(pub_id) {
    var found = runningPublisherId.indexOf(pub_id);
    if (found !== -1) {
        setPlayIcon(pub_id);
    } else if (pub_id) {
        markersPlay[pub_id].setIcon(stopIcon);
    }
}

var replayCallBox = {};
$(document).on('change', '#admin_region_box', function (event) {
    var id = $(this).val();
    filter_region_id = id;
    // localStorage.setItem("region_id", id);
    resetVideoTags();
    callBoxListing(id);
    GetReplayUser();
    ReloadVideosList(10);
    GetClassification(filter_region_id);
});

function resetVideoTags() {
    $("#bottom-callbox-view").html('');
    $("#annotate_listing").html('');
    $(".video-play-view").hide();
    deleteMarkers();
    ActiveChannel = null;
}

var startDate = moment().subtract(7, 'days');
var endDate = moment();
//$('.card-body').scrollTop(1000000);
$('#created_at').daterangepicker({
    autoUpdateInput: false,
    drops: 'auto',
    timePicker: true,
    locale: {
        cancelLabel: 'Clear',
        format: 'YYYY-MM-DD h:mm A'
    },
    //startDate: startDate,
    //minDate: currentTime,
    maxDate: new Date()
});
$('#created_at').on('apply.daterangepicker', function (ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD  h:mm A') + ' - ' + picker.endDate.format('YYYY-MM-DD  h:mm A'));
    resetVideoTags();
    ReloadVideosList('');
});
$('#created_at').on('cancel.daterangepicker', function (ev, picker) {
    $(this).val('');
    ReloadVideosList(10);
});
$("#created_at").click(function (e) {
    e.preventDefault();
    $('html, body').animate({
        scrollTop: $('#chat-list-view').offset().top - 120
    }, '250');
});

//$("#created_at").val(startDate.format('YYYY-MM-DD')+ ' - ' +endDate.format('YYYY-MM-DD'));
function GetClassification(region_id) {
    var box_html = '<option value="" >All Classification</option><option value="1" >Missed Call</option>';
    $("#search_classification").html(box_html);
    $("#search_classification").val();
    if (filter_region_id) {
        var url = "replay/classification?id=" + filter_region_id;
        sendHTTPRequest(url, "GET", "", function (result) {
            if (result) {
                var ResponseData = result.data;
                //box_html = '<option value="" >All Classification</option><option value="1" >Missed Call</option>';
                $.each(ResponseData, function (index, value) {
                    var name = value.classification_type.name + '-' + value.classification_name;
                    if(value.id !== '1') box_html += '<option data-name="' + name + '" value="' + value.id + '" >' + name + '</option>';
                });
                $("#search_classification").html(box_html);
            }
        });
    }
}

const GetActiveRegionClassification = (pubId) => {
    var url = "replay/classification?id=" + replayCallBox[ActiveChannel].callBoxData.region_id;
    sendHTTPRequest(url, "GET", "", function (result) {
        if (result) {
            var ResponseData = result.data;
            var box_html = '<option value="" >All Classification</option>';
            var classification_box_html = '<option value="" >Select Classification</option>';
            $.each(ResponseData, function (index, value) {
                var name = value.classification_type.name + '-' + value.classification_name;
                box_html += '<option data-name="' + name + '" value="' + value.id + '" >' + name + '</option>';
                if (value.id !== "1") {
                    classification_box_html += '<option data-name="' + name + '" value="' + value.id + '" >' + name + '</option>';
                }
            });
            $("#classification_box").html(classification_box_html);
            $("#annotate_classification_id").html(box_html);
        }
    });
};

// $('#admin_region_box').change(function(){
//     filter_region_id= $(this).val();
//     GetReplayUser();
// });
const GetReplayUser = () => {
    var no_user_html = '<option value="" >No Users</option>';
    $("#search_user_by").html(no_user_html);
    sendHTTPRequest("replay/annotate/user", "GET", null, function (result) {
        if (result) {
            var ResponseData = result.data;
            var user_box_html = '<option value="" >All User</option>';
            $.each(ResponseData, function (index, value) {
                user_box_html += '<option data-name="' + value.name + '" value="' + value.id + '" >' + value.name + '</option>';
            });
            $("#search_user_by").html(user_box_html);
        }
    });
};
GetReplayUser();

$(".search_videos").change(function () {
    resetVideoTags();
    ReloadVideosList('');
});

const callBoxListing = () => {
    var no_call_box_html = '<option value="" >No Call Box</option>';
    $("#search_call_box").html(no_call_box_html);
    $("#search_call_box").val();
    if (filter_region_id) {
        var region_name = $("#admin_region_box option:selected").data('name');
        sendHTTPRequest("region_callbox/user/" + filter_region_id, "GET", "", function (result) {
            if (result) {
                var RegionBox = result.data;
                console.log('RegionBox',RegionBox);
                if (RegionBox && RegionBox instanceof Array && RegionBox.length) {
                    var call_box_html = '<option value="" >All Call Box</option>';
                    $.each(RegionBox, function (callBoxInd, callBoxValue) {

                        var callBoxName = region_name+'-'+callBoxValue.ani_number;
                        call_box_html += '<option data-name="' + callBoxName + '" value="' + callBoxValue.id + '" >' + callBoxName + '</option>';
                    });
                    $("#search_call_box").html(call_box_html);
                }
            }
        });
    }
};
callBoxListing();

$("#search_videos").on("change", ".checked-box", function (event) {
    lastClassification = 0;
    if (this.checked) {
        lastClassification = 1;
    }
    ReloadVideosList('');
});

function ReloadVideosList(limit) {
    var url = "replay/chat";
    var created_at = $('#created_at').val().split(' - ');
    var sdate = created_at ? created_at[0] : startDate;
    var edate = created_at ? created_at[1] : endDate;
    var search_classification = (($("#search_classification").val() == null) ? "" : $("#search_classification").val());
    var search_call_box = (($("#search_call_box").val() == null) ? "" : $("#search_call_box").val());
    var search_user_by = $("#search_user_by").val();
    var data = {
        'sdate': sdate,
        'edate': edate,
        'region_id': filter_region_id,
        'classification': search_classification,
        'call_box_id': search_call_box,
        'user_id': search_user_by,
        'last_classification': lastClassification,
        'Limit': limit
    };
    $("#bottom-callbox-view").html('');
    sendHTTPRequest(url, "POST", data, function (result) {
        if (result) {
            const recorded_videos = result.data;
            const recorded_des_videos = result.data;
            let noCallBoxHtml = '';
            if (recorded_videos && recorded_videos instanceof Array && recorded_videos.length) {
                $.each(recorded_videos, function (callBoxInd, callBoxValue) {
                    var main_id = callBoxValue.id;
                    replayCallBox[main_id] = callBoxValue;
                    //console.log(callBoxValue.regionData,"callBoxValue",callBoxValue.callBoxData.ani_number);
                    var testCallBox = (callBoxValue.is_test) ? 'Test-' : '';
                    var call_box_name = (callBoxValue.regionData) ? callBoxValue.regionData.region_name+'-'+callBoxValue.callBoxData.ani_number: callBoxValue.callBoxData.call_box_name;
                    var callBoxName = testCallBox + call_box_name;
                    var date_time = new Date(callBoxValue.created_at);
                    var date_format = date_time.toLocaleString();
                    var activeClass = (main_id === replay_id) ? 'active' : '';

                    var pickedUp = (callBoxValue.acceptAt) ? getTimeRemaining(callBoxValue.created_at, callBoxValue.acceptAt) :'-';
                    var callDuration =  (callBoxValue.acceptAt) ? getTimeRemaining(callBoxValue.created_at, callBoxValue.callEndAt) :'-';
                    renderChatCallBox('template/replay_callbox_view.mustache', 'bottom-callbox-view', {
                        id: main_id,
                        callBoxName: callBoxName,
                        date_format: date_format,
                        onStatus: 'shakeReplay shake' + testCallBox,
                        activeClass: activeClass,
                        pickedUp:pickedUp,
                        callDuration:callDuration
                    },()=>{});
                    if (runningPublisherId.indexOf(main_id) === -1) {
                        runningPublisherId.push(main_id);
                    }
                });
                recorded_des_videos.sort(function (a, b) {
                    return a.created_at - b.created_at;
                });
                $.each(recorded_des_videos, function (callBoxInd, callBoxValue) {
                    var main_id = callBoxValue.id;
                    addMarker(callBoxValue);
                    resetPlayIcon(main_id);
                });
                if (replay_id) {
                    openMapPage(replay_id);
                }
            } else {
                noCallBoxHtml += '<div class="col-12 col-sm-12 col-md-12 col-lg-12 " >';
                noCallBoxHtml += '<h1>No Call Replays exist for the selection criteria</h1>';
                noCallBoxHtml += '</div>';
                $('#bottom-callbox-view').html(noCallBoxHtml);
            }
        }
    });
}

const getTimeRemaining = (date1,date2) =>{
    var difference = date2 - date1;
    var daysDifference = Math.floor(difference/1000/60/60/24);
    difference -= daysDifference*1000*60*60*24
    var hoursDifference = Math.floor(difference/1000/60/60);
    difference -= hoursDifference*1000*60*60
    var minutesDifference = Math.floor(difference/1000/60);
    difference -= minutesDifference*1000*60
    var secondsDifference = Math.floor(difference/1000);
    var hDisplay = hoursDifference > 0 ? hoursDifference + (hoursDifference === 1 ? " hour, " : " hours, ") : "";
    var mDisplay = minutesDifference > 0 ? minutesDifference + (minutesDifference === 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = secondsDifference > 0 ? secondsDifference + (secondsDifference === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
    //return hoursDifference+':'+minutesDifference+':'+secondsDifference;
};

$(document).on('change', '.annotate_filter', function (event) {
    getAnnotateList();
});

function getAnnotateList() {
    var url = "replay/annotate_listing";
    var annotate_classification_id = $("#annotate_classification_id").val();
    var user_id = $("#annotate_user_id").val();

    var data = {
        'user_id': user_id,
        'classification': annotate_classification_id,
        'video_id': ActiveChannel
    };
    $("#annotate_listing").html('');
    if (ActiveChannel) {
        sendHTTPRequest(url, "POST", data, function (result) {
            if (result) {
                var annotate_list = result.data;
                if (annotate_list && annotate_list instanceof Array && annotate_list.length) {
                    var annotate_box_html = '';
                    $.each(annotate_list, function (annotateInd, annotateValue) {
                        var region_name = annotateValue.region_name;
                        var date_time = new Date(annotateValue.created_at);
                        var date_format = date_time.toLocaleString();
                        var classification_name = annotateValue.classification_name;
                        var note = annotateValue.note;
                        var enter_by = annotateValue.user_data.name + '(' + annotateValue.user_data.user_type + ')';
                        var annotateId = annotateValue.id;
                        var note_time = annotateValue.note_time;
                        annotate_box_html += '<li class="admin clearfix annotate_list" data-id="' + annotateId + '" data-time="' + note_time + '" >';
                        annotate_box_html += '<div class="chat-body clearfix">';
                        annotate_box_html += '<div class=" clearfix">';
                        annotate_box_html += '<small class="left ">';
                        annotate_box_html += '<span class="fa fa-clock-o"></span> ' + date_format;
                        annotate_box_html += '</small>';
                        annotate_box_html += '<strong class="right primary-font" style="padding-left: 5px;">' + enter_by + '</strong>';
                        annotate_box_html += '</div>';
                        annotate_box_html += '<p>';
                        annotate_box_html +=  classification_name + ':- ' + note;
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
        toastr.error("Please select video!");
    }
}

function AnnotateUser() {
    var no_user_html = '<option value="" >No Users</option>';
    $("#annotate_user_id").html(no_user_html);
    var data = {
        'video_id': ActiveChannel
    };
    /*sendHTTPRequest("/annotate/user", "POST", data, function (result) {
        if (result) {
            var UserData = result.data;
            if (UserData && UserData instanceof Array && UserData.length) {
                var user_html = '<option value="" >All User</option>';
                $.each(UserData, function (UserInd, UserValue) {
                    user_html += '<option data-name="' + UserValue.name + '" value="' + UserValue.id + '" >' + UserValue.name + '</option>';
                });
                $("#annotate_user_id").html(user_html);
            }
        }
    });*/
}

function latestAnnotate() {
    var url = "replay/latestAnnotate?id=" + ActiveChannel;
    sendHTTPRequest(url, "GET", "", function (result) {
        if (result) {
            var ResponseData = result.data;
            console.log(ResponseData, " latestAnnotate ");
            var last_annotate = ResponseData.last_annotate;
            var last_user_classification = last_annotate.user_data.name + ', ' + last_annotate.classification_name;
            $("#last_user_classification").html('Last Annotate: ' + last_user_classification);
            $("#accept_by").html('Accept call By: ' + ((ResponseData.acceptBy) ? ResponseData.acceptBy.name : ''));
            $("#call_end_by").html('End call by: ' +  ResponseData.callEndReason);
        }
    });
}

/*$(document).on('click', '.annotate_list', function (event) {
    let currentTime = $(this).data('time');
    var vid = document.getElementById("local-viewer_demo-signaling_channel");
    vid.currentTime = currentTime;
    vid.play();
});*/
$(document).on('click', '.chat-box-btn', function (event) {
    deActiveBox();
    resetPlayIcon(ActiveChannel);
    ActiveChannel = event.currentTarget.title;
    setMapCenter(ActiveChannel);
    activeBox(ActiveChannel);
});

function openMapPage(pub_id) {
    deActiveBox();
    setMapCenter(pub_id);
    ActiveChannel = pub_id;
    activeBox(ActiveChannel);
}

function deActiveBox() {
    $(".chat-box-btn").removeClass("active");
}

function activeBox(ActiveChannel) {
    $('#chatView').html('');
    $(".video-play-view").show();
    setPlayingIcon(ActiveChannel);
    $(".child-video_" + ActiveChannel).addClass("active");
    reAttach(ActiveChannel);
    let callboxName = '';
    let boxNumber = replayCallBox[ActiveChannel].callBoxData.box_number !== '' ? replayCallBox[ActiveChannel].callBoxData.box_number : '';
    let AccountNo = replayCallBox[ActiveChannel].callBoxData?.account_number ? replayCallBox[ActiveChannel].callBoxData.account_number : 'None';
    let AccountName = replayCallBox[ActiveChannel].callBoxData?.account_name ? replayCallBox[ActiveChannel].callBoxData.account_name : 'None';
    let callBoxName = (replayCallBox[ActiveChannel].regionData) ? replayCallBox[ActiveChannel].regionData.region_name+'-'+replayCallBox[ActiveChannel].callBoxData.ani_number: replayCallBox[ActiveChannel].callBoxData.call_box_name;
    let description = replayCallBox[ActiveChannel].callBoxData.description !== '' ? replayCallBox[ActiveChannel].callBoxData.description.replace("||||", "\r\n").split(/\n/)[0]: '';
    console.log(replayCallBox[ActiveChannel].callBoxData.description,"  replayCallBox[ActiveChannel].callBoxData ",replayCallBox[ActiveChannel].callBoxData.description.split('||||')[0]);
    callboxName += '<h5 class="font-weight-bold">Account No:<span id="accNo">'+ AccountNo + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(accNo)"></i></h5>';
    callboxName += '<h5 class="font-weight-bold">Account Name:<span id="accName">'+ AccountName + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(accName)"></i></h5>';
    callboxName += '<h5 class="font-weight-bold">BoxNo:<span id="bxno"> ' + boxNumber + '</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(bxno)"></i></h5>';
    callboxName += '<small class="d-block font-weight-bold">Ph:<span id="ph">' + replayCallBox[ActiveChannel].callBoxData.source_phone_number +' </span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(ph)"></i></small>';
    callboxName += '<small class="d-block font-weight-bold" >Desc:<span id="Desc">' + description +'</span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(Desc)"></i></small>';
    callboxName += '<small class="d-block font-weight-bold">CB:<span id="callBoxNames">' + callBoxName +' </span><i class="fa fa-clone" style="cursor: pointer;" data-toggle="tooltip" data-html="true" title="click to copy" onclick="copyData(callBoxNames)"></i></small>';
    $("#box-viewer_demo-signaling_channel").html(callboxName);
    getAnnotateList();
    AnnotateUser();
    GetActiveRegionClassification(ActiveChannel);
}

const urlParams = new URLSearchParams(window.location.search);
const replay_id = urlParams.get('id');
const reAttach = (pub_id) => {
    $("#last_user_classification").html("None");
    getChatMessageUsingRoom(pub_id);
    console.log(replayCallBox[pub_id], " replayCallBox[pub_id] ");
    $("#accept_by").html('Accept call by: ' + (replayCallBox[pub_id].acceptBy ? replayCallBox[pub_id].acceptBy.name : ''));
    $("#call_end_by").html('End call by: ' + (replayCallBox[pub_id].callEndReason));
    if (replayCallBox[pub_id].last_annotate !== undefined && Object.keys(replayCallBox[pub_id].last_annotate).length !== 0) {
        var last_annotate = replayCallBox[pub_id].last_annotate;
        var last_user_classification = "Last Annotate:" + last_annotate.user_data.name + ', ' + last_annotate.classification_name;
        $("#last_user_classification").html(last_user_classification);
    }
};
const getChatMessageUsingRoom = (pub_id) => {
    console.log(pub_id, " getChatMessageUsingRoom ");
    sendHTTPRequest("chat?id=" + pub_id, "GET", "", function (result) {
        if (result) {
            var ResponseData = result.data;
            renderChatCallBox('template/chat_message.mustache', 'chatView', {response: ResponseData},()=>{});
        }
    });
};

$("#add_annotate_form").validate({
    rules: {
        classification_id: "required",
        note: "required"
    },
    submitHandler: function (form) {
        console.log("sdds");
        var unindexed_array = $(form).serializeArray();
        var data = {};
        $.map(unindexed_array, function (n, i) {
            data[n['name']] = n['value'].trim();
        });
        var classification_name = $("#classification_box option:selected").data('name');
        var region_name = $("#admin_region_box option:selected").data('name');
        // var ourVideo = document.getElementById("local-viewer_demo-signaling_channel");
        if (ActiveChannel) {
            data['callBox'] = replayCallBox[ActiveChannel].callBoxData;
            data['classification_name'] = classification_name;
            data['region_name'] = region_name;
            data['chatRoomId'] = replayCallBox[ActiveChannel].chatRoomId;
            data['video_id'] = replayCallBox[ActiveChannel].id;
            console.log(data, " replayCallBox ")
            sendHTTPRequest("replay/annotate_create", "POST", data, function (result) {
                console.log("annotate_create-", result);
                $('#add_annotate_form')[0].reset();
                getAnnotateList();
                AnnotateUser();
                // GetClassification();
                GetReplayUser();
                latestAnnotate();
            });
        } else {
            toastr.error("Please select call box!");
        }
    }
});


$('#mute').click(toggleMute);

function toggleMute() {
    var main_video = document.getElementById("local-viewer_demo-signaling_channel");
    var muted = main_video.muted;
    if (muted) {
        console.log("muted", muted);
        $("#local-viewer_demo-signaling_channel").prop('muted', false); //unmute
        //allowed_audio = true;
    } else {
        console.log("not_muted", muted);
        $("#local-viewer_demo-signaling_channel").prop('muted', true); //mute
        //allowed_audio = false;
    }
    muted = document.getElementById("local-viewer_demo-signaling_channel").muted;
    $('#mute').html(muted ? "Unmute" : "Mute");
}

function checkModulePermission() {
    var user_type = localStorage.getItem('user_type');
    $(".user_role_permission").addClass(user_type);
    $(".admin_role_permission").addClass(user_type);
    if (user_type === "region_admin") {
        $("#user_type option[value='" + user_type + "']").remove();
    }
    GetRegionList();
    renderMenu('template/menu.mustache', 'nav-menu-container', user_type);
    //resetVideoTags();
    ReloadVideosList(10);
}
