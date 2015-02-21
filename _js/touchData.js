$(window).on("load", setup);

// Spacebrew Object
var sb,
    app_name = 'Touch Draw Canvas Publisher';

var cnvW = window.innerWidth;
var cnvH = window.innerHeight - $('#disconnect').height();
var delay = 100;
var vMultiplier = 0.01;
var ongoingTouches = new Array;
var session = Math.floor((Math.random() * 100000000) + 1);

//code for random rgb colors
var r = Math.random();
var g = Math.random();
var b = Math.random();
var sizespd = Math.random();

var touchData = {};
var userData = {};

/**
 * setup Configure spacebrew connection and adds the mousedown listener.
 */
function setup (){

    $('#canvas').attr({'width':cnvW,'height':cnvH});

    userdata = {
            'ss': sizespd,
            'r': r,
            'g': g,
            'b': b,
            'w': cnvW,
            'h': cnvH
        };

    // create spacebrew client object
    sb = new Spacebrew.Client();

    // set the base description
    sb.name(app_name);
    sb.description("Mobile Web App for Touch Draw Application");

    // configure the publication and subscription feeds
    sb.addPublish( "touch", "touches", touchData );

    // override Spacebrew events - this is how you catch events coming from Spacebrew
    // sb.onCustomMessage = onCustomMessage;
    // sb.onOpen = onOpen;

    // connect to spacbrew
    sb.connect();

    var el = document.getElementsByTagName("canvas")[0];
        el.addEventListener("touchstart", handleStart, false);
        el.addEventListener("touchend", handleEnd, false);
        el.addEventListener("touchcancel", handleCancel, false);
        el.addEventListener("touchleave", handleEnd, false);
        el.addEventListener("touchmove", handleMove, false);
    log("initialized.");
}

// $(document).ready(function() {


//     $('#broadcast').hide();

//     $('#sendname').click(function() {
//         startup();

//         $('#signin').hide();
//         $('#broadcast').show();

//         var name = String($('#name').val());
//         $('#name').val('');
//         userdata = {
//             'ss': sizespd,
//             'r': r,
//             'g': g,
//             'b': b,
//             'w': cnvW,
//             'h': cnvH
//         };

//         $('#header h2').html(name).css('color', 'rgb(' + parseInt(r * 255) + ',' + parseInt(g * 255) + ',' + parseInt(b * 255) + ')');

//     });

//     $('#sendquit').click(function() {
//         sockexit();
//         window.location.reload(true);
//     });
// });


// function startup() {


// }

function handleStart(evt) {
    evt.preventDefault();
    log("touchstart.");
    var el = document.getElementsByTagName("canvas")[0];
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        log("touchstart:" + i + "...");
        ongoingTouches.push(copyTouch(touches[i]));
        var color = colorForTouch(touches[i]);
        ctx.beginPath();
        ctx.arc(touches[i].pageX, touches[i].pageY, 4, 0, 2 * Math.PI, false); // a circle at the start
        ctx.fillStyle = color;
        ctx.fill();
        log("touchstart:" + i + ".");
        touchData[touches[i].identifier] = {
            'startX': touches[i].pageX,
            'startY': touches[i].pageY
        };
        touchData.user = userdata;
        sb.send("touch", "touches", JSON.stringify(touchData));
    }
}

function handleMove(evt) {
    evt.preventDefault();
    var el = document.getElementsByTagName("canvas")[0];
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        var color = colorForTouch(touches[i]);
        var idx = ongoingTouchIndexById(touches[i].identifier);

        if (idx >= 0) {
            log("continuing touch " + idx);
            ctx.beginPath();
            log("ctx.moveTo(" + ongoingTouches[idx].pageX + ", " + ongoingTouches[idx].pageY + ");");
            ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
            log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");
            ctx.lineTo(touches[i].pageX, touches[i].pageY);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();

            ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record
            log(".");

            $.extend(touchData[touches[i].identifier], {
                'moveToX': ongoingTouches[idx].pageX,
                'moveToY': ongoingTouches[idx].pageY,
                'lineToX': touches[i].pageX,
                'lineToY': touches[i].pageY
            });

            touchData.user = userdata;
            sb.send("touch", "touches", JSON.stringify(touchData));

        } else {
            log("can't figure out which touch to continue");
        }
    }
}

function handleEnd(evt) {
    evt.preventDefault();
    log("touchend/touchleave.");
    var el = document.getElementsByTagName("canvas")[0];
    var ctx = el.getContext("2d");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        var color = colorForTouch(touches[i]);
        var idx = ongoingTouchIndexById(touches[i].identifier);

        if (idx >= 0) {
            ctx.lineWidth = 4;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
            ctx.lineTo(touches[i].pageX, touches[i].pageY);
            ctx.fillRect(touches[i].pageX - 4, touches[i].pageY - 4, 8, 8); // and a square at the end
            ongoingTouches.splice(idx, 1); // remove it; we're done
            delete touchData[touches[i].identifier];
        } else {
            log("can't figure out which touch to end");
        }
    }
}

function handleCancel(evt) {
    evt.preventDefault();
    log("touchcancel.");
    var touches = evt.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        delete touchData[touches[i].identifier];
        ongoingTouches.splice(i, 1); // remove it; we're done
    }
}

function colorForTouch(touch) {
    var r = touch.identifier % 16;
    var g = Math.floor(touch.identifier / 3) % 16;
    var b = Math.floor(touch.identifier / 7) % 16;
    r = r.toString(16); // make it a hex digit
    g = g.toString(16); // make it a hex digit
    b = b.toString(16); // make it a hex digit
    var color = "#" + r + g + b;
    log("color for touch with identifier " + touch.identifier + " = " + color);
    return color;
}

function copyTouch(touch) {
    return {
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY
    };
}

function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
        var id = ongoingTouches[i].identifier;

        if (id == idToFind) {
            return i;
        }
    }
    return -1; // not found
}

function log(msg) {
    // var p = document.getElementById('log');
    // p.innerHTML = msg + "\n" + p.innerHTML;
    console.log(msg);
}

function cleanStr(str) {
    if (str !== null) {
        str = str.replace(/\s+/g, '');
        str = str.replace(/,/g, '');
        str = str.replace(/\./g, '');
        str = str.toLowerCase();
        return str;
    }
}
