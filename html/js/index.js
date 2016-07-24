var hue, lightness;
function draw(h, s, l) {
    "use strict";
    var hsl, rgb, color, hex;
	hue = h;
	lightness = l;
	hsl = "hsl(" + h + "," + s + "," + l + ")";
    color = tinycolor(hsl);
    hex = color.toHexString();
    rgb = color.toRgbString();
    $('.cd-index').css("background-color", hex);
    send(rgb);
    if (color.isLight()) {
        $('#reticle').css('fill', '#000000');
    } else {
        $('#reticle').css('fill', '#ffffff');
    }
}

function init(){
    "use strict";
	var maxX, maxY, x, y, h, s, l;
    h = (Math.random() * 360);
    s = 50;
    l = 50;
    maxX = window.innerWidth;
    maxY = window.innerHeight;
    x = (h / 360) * maxX - 14;
    y = l / 100 * maxY - 14;
    $('#reticle').css('top', y);
    $('#reticle').css('left', x);
    window.setTimeout(function(){draw(h, s, l)},500);
}

$(document).ready(function () {
    "use strict";
    init();
	
	$(".cd-index").click(function (e) {
        var offX, offY;
        offX = e.pageX - 14;
        offY = e.pageY - 14;
        $('#reticle').css('top', offY);
        $('#reticle').css('left', offX);
        colore(offX, offY);
    });
    $("#reticle").draggable({
        containment: "section",
        scroll: false
    });
    
    $("#reticle").on("drag", function () {
        var pos, x, y;
        pos = $('#reticle').offset();
        x = pos.left;
        y = pos.top;
        colore(x, y);
    });
    
    
});

$(window).resize(function () {
    "use strict";
    var maxX, maxY, x, y;
    maxX = window.innerWidth;
    maxY = window.innerHeight;
    x = (hue / 360) * maxX - 14;
    y = lightness / 100 * maxY - 14;
    $('#reticle').css('top', y);
    $('#reticle').css('left', x);
});

function colore(x, y) {
    "use strict";
    var maxX, maxY, pos, h, l;
    maxX = window.innerWidth;
    maxY = window.innerHeight;
    h = x / maxX * 360;
    l = y / maxY * 100;
    draw(h, 50, l);
}