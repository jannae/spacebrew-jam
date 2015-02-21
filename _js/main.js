$(window).on("load", setup);

var width = Math.max(960, innerWidth),
    height = Math.max(500, innerHeight);

var touchData = {};
var users = {};
var session = {};
var user;

// Spacebrew Object
var sb,
    app_name = "Draw Canvas Subscriber";

/**
 * setup Configure spacebrew connection and adds the mousedown listener.
 */
function setup (){

    // create spacebrew client object
    sb = new Spacebrew.Client();

    // set the base description
    sb.name(app_name);
    sb.description("Desktop Canvas for Touch Draw Application");

    // configure the publication and subscription feeds
    sb.addSubscribe( "touch", "touches" );

    // override Spacebrew events - this is how you catch events coming from Spacebrew
    sb.onCustomMessage = onCustomMessage;
    // sb.onOpen = onOpen;

    // connect to spacbrew
    sb.connect();
}

/**
 * onCustomMessage Function that is called whenever new spacebrew custom messages are received.
 *          It accepts three parameters:
 * @param  {String} name    Holds name of the subscription feed channel
 * @param  {String} value   Holds value received from the subscription feed
 * @param  {String} type    Holds the custom message type
 */

function onCustomMessage( name, value, type ){
    if (type == "touches") {
        data = JSON.parse(value);
        $.each(data, function(key, val) {
            console.log(key, val);
            if ( key != "user" ){
                moveX = mapToRange(val.moveToX,0,data.user.w,0,width);
                moveY = mapToRange(val.moveToY,0,data.user.h,0,height);
            }
        });
    }
    if (moveX && moveY) particle(moveX,moveY);
}

// socket.on('update', function(session, username, userdata, data) {
//     if (data !== null) {
//         $.each(data, function(key, value) {
//             console.log(key+', '+value);
//             moveX = mapToRange(value.moveToX,0,userdata.w,0,width);
//             moveY = mapToRange(value.moveToY,0,userdata.h,0,height);
//         });
//     }
//     if (moveX && moveY) particle(moveX,moveY);
// });

function cleanStr(str) {
    if (str !== null) {
        if (typeof str == 'string' || str instanceof String) {
            str = str.replace(/\s+/g, '');
            str = str.replace(/,/g, '');
            str = str.replace(/\./g, '');
            str = str.toLowerCase();
            return str;
        }
    }
}

var i = 0;

var svg = d3.select("#run").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("width", width)
    .attr("height", height);

function particle(mx,my) {
    svg.insert("circle", "rect")
        .attr("cx", mx)
        .attr("cy", my)
        .attr("r", 1e-6)
        .style("stroke", d3.hsl((i = (i + 1) % 360), 1, 0.5))
        .style("stroke-opacity", 1)
        .transition()
        .duration(2000)
        .ease(Math.sqrt)
        .attr("r", 100)
        .style("stroke-opacity", 1e-6)
        .remove();
}

function mapToRange(value, srcLow, srcHigh, dstLow, dstHigh){
  // value is outside source range return fail
  if (value < srcLow || value > srcHigh){
    return NaN;
  }

  var srcMax = srcHigh - srcLow,
      dstMax = dstHigh - dstLow,
      adjValue = value - srcLow;

  return (adjValue * dstMax / srcMax) + dstLow;
}