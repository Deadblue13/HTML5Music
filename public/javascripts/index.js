function $(s){
	return document.querySelectorAll(s);
}
var lis = $("#list li");
for(var i = 0; i < lis.length; i++){
	lis[i].onclick = function(){
		for(var j = 0; j < lis.length; j++){
			lis[j].className = "";
		}
		this.className = "selected";
		load("/media/" + this.title);
	}
}
var xhr = new XMLHttpRequest();
var ac = new (window.AudioContext || window.webkitAudioContext)();
var gainNode = ac[ac.createGain?"createGain":"createGainNode"]();
gainNode.connect(ac.destination);
var analyser = ac.createAnalyser();
var size = 128;
var box = $("#box")[0];
var height,width;
var canvas = document.createElement("canvas");
box.appendChild(canvas);
var ctx = canvas.getContext("2d");
var showType = "column";
var dots = [];
analyser.fftSize = size * 2;
analyser.connect(gainNode);
var source = null;
var count = 0;
function load(url){
	var n = ++count;
	source && source[source.stop ? "stop" : "noteOff"]();
	ctx.clearRect(0, 0, width, height);
	xhr.abort();
	xhr.open("GET",url);
	xhr.responseType = "arraybuffer";
	xhr.onload = function(){
		if(n != count)return;
		ac.decodeAudioData(xhr.response,function(buffer){
			if(n != count)return;
			var bufferSource = ac.createBufferSource();
			bufferSource.buffer = buffer;
			bufferSource.connect(analyser);
			bufferSource[bufferSource.start?"start":"noteOn"](0);
			source = bufferSource;
		},function(err){
			console.log(err);
		});
	}
	xhr.send();
}
function changeVolume(percent){
	gainNode.gain.value = percent * percent;
}
$("#volume")[0].onmousedown = function(){
	this.onmousemove = function(){
		changeVolume(this.value/this.max);
	}
}
changeVolume(0.6);
function visualizer(){
	var arr = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(arr);
	requestAnimationFrame = window.requestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							window.mozRequestAnimationFrame;
	function v(){
		analyser.getByteFrequencyData(arr);
		draw(arr);
		// console.log(arr);
		requestAnimationFrame(v);
	}
	requestAnimationFrame(v);
}
visualizer();
function reSize(){
	height = box.clientHeight;
	width = box.clientWidth;
	canvas.height = height;
	canvas.width = width;
	if("column" == showType){
			getLine();
		}else{
			getDots();
		}
}
reSize();
window.onresize = reSize;
function getLine(){
	var line = ctx.createLinearGradient(0, 0, 0, height);
	line.addColorStop(0, "red");
	line.addColorStop(0.5, "yellow");
	line.addColorStop(1, "green");
	ctx.fillStyle = line;
}
function random(m,n){
	return Math.round(Math.random()*(n - m) + m);
}
function getDots(){
	dots = [];
	for(var i = 0; i < size; i++){
		var x = random(0, width);
		var y = random(0, height);
		var dx = random(0,10);
		var color = "rgba(" + random(0,255) + "," + random(0,255) + "," + random(0,255) + "," + 0 + ")";
		dots.push({
			x: x,
			y: y,
			dx: dx,
			color: color
		});
	}
}
function draw(arr){
	ctx.clearRect(0, 0, width, height);
	if("column" == showType){
		var w = width / size;
		for(var i = 0; i < size; i++){
			var h = arr[i] / 256 * height;
			ctx.fillRect(w * i, height - h, w * 0.6, h);
		}
	}else{
		for(var i = 0; i < size; i++){
			ctx.beginPath();
			var o = dots[i];
			var r = arr[i] / 256 * 50;
			ctx.arc(o.x, o.y, r, 0, Math.PI * 2, true);
			var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
			g.addColorStop(0, "#fff");
			g.addColorStop(1, o.color);
			ctx.fillStyle = g;
			ctx.fill();
			o.x += o.dx;
			if(o.x > width){
				o.x = 0;
			}
		}
	}
}
var showTypes = $("#type li");
for(var i = 0; i < showTypes.length; i++){
	showTypes[i].onclick = function(){
		for(var j = 0; j < showTypes.length; j++){
			showTypes[j].className = "";
		}
		this.className = "selected";
		showType = this.getAttribute("data-type");
		if("column" == showType){
			getLine();
		}else{
			getDots();
		}
	}
}
