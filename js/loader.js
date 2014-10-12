var cSpeed=6;
var cWidth=88;
var cHeight=8;
var cTotalFrames=24;
var cFrameWidth=88;

var cIndex=0;
var cXpos=0;
var cPreloaderTimeout=false;
var SECONDS_BETWEEN_FRAMES=0;

function startAnimation(){
	
	$('loaderImage').style.visibility = "visible";
	document.getElementById('loaderImage').style.width=cWidth+'px';
	document.getElementById('loaderImage').style.height=cHeight+'px';
	
	//FPS = Math.round(100/(maxSpeed+2-speed));
	FPS = Math.round(100/cSpeed);
	SECONDS_BETWEEN_FRAMES = 1 / FPS;
	
	cPreloaderTimeout=setTimeout(function(){continueAnimation()}, SECONDS_BETWEEN_FRAMES/1000);
	
}

function continueAnimation(){
	
	cXpos += cFrameWidth
	cIndex += 1;
	 
	if (cIndex >= cTotalFrames) {
		cXpos =0;
		cIndex=0;
	}
	
	if(document.getElementById('loaderImage'))
		document.getElementById('loaderImage').style.backgroundPosition=(-cXpos)+'px 0';
	
	cPreloaderTimeout=setTimeout(function(){continueAnimation()}, SECONDS_BETWEEN_FRAMES*1000);
}

function stopAnimation(){//stops animation
	$('loaderImage').style.visibility = "hidden";
	clearTimeout(cPreloaderTimeout);
	cPreloaderTimeout=false;
}
