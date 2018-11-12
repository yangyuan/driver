/*

<canvas id="myCanvas" width="640" height="320" style="border:1px solid #000000;">
</canvas>

*/



var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");


var center = {x: 0, y: 0};

function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#CCCCCC";
    ctx.moveTo(320, 0);
    ctx.lineTo(320, 320);
    ctx.moveTo(0, 160);
    ctx.lineTo(640, 160);
    ctx.stroke();
    ctx.moveTo(160, 0);
    ctx.lineTo(160, 320);
    ctx.stroke();
    ctx.moveTo(480, 0);
    ctx.lineTo(480, 320);
    ctx.stroke();


    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI);
    ctx.stroke();
}

function clear() {
}

var drag = false;

c.addEventListener('mousedown', function (event) {
    console.log(event.pageX);
    console.log(c.offsetLeft);
    center = {
        x: event.pageX - c.offsetLeft - c.clientLeft,
        y: event.pageY - c.offsetTop - c.clientTop
    };

    drag = true;
    draw()
});

document.addEventListener('mouseup', function (event) {
    drag = false;
});

c.addEventListener('mousemove', function (event) {
    console.log(c.clientLeft);
    if (drag) {
        center = {
            x: event.pageX - c.offsetLeft - c.clientLeft,
            y: event.pageY - c.offsetTop - c.clientTop
        };
        draw()
    }
});
draw();