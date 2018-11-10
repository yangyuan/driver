



var vid = document.getElementById("player");
var control = {play: false, pending: 3, currentTime: 0}
setInterval(function(){
    control.duration = vid.duration;
    document.getElementById("demo").innerHTML = vid.currentTime;
}, 100);

var startp = setInterval(function(){
if (control.play) {
    if (control.pending > 0 || control.pending < 3) {
        document.getElementById("pending").innerHTML = control.pending;
        control.pending -= 1
    }
}

if (control.pending == 0) {
    clearInterval(startp)
    vid.play()
}

}, 1000);


var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");


  var center = {x : 0, y : 0};

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle="#CCCCCC";
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

  var  drag = false

  c.addEventListener('mousedown', function(event) {
    console.log(event.pageX)
    console.log(c.offsetLeft)
    center = {
        x: event.pageX - c.offsetLeft - c.clientLeft,
        y: event.pageY - c.offsetTop - c.clientTop
    }

    drag = true;
      draw()
  })

  document.addEventListener('mouseup', function(event) {
    drag = false;
  })

  c.addEventListener('mousemove', function(event) {
  console.log(c.clientLeft)
    if (drag) {
      center = {
        x: event.pageX - c.offsetLeft - c.clientLeft,
        y: event.pageY - c.offsetTop - c.clientTop
      }
      draw()
    }
  })
      draw()

