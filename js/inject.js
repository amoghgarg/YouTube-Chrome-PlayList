currentVid = document.querySelector('video.video-stream');

currentVid.addEventListener('ended',videoEndedHand);
currentVid.addEventListener('pause', pausedFromWindow);
currentVid.addEventListener('play', playedFromWindow);
currentVid.addEventListener('durationchange',durationChanged);

function durationChanged(){
	console.log("duration info sending: "+currentVid.duration)
	chrome.runtime.sendMessage({
		type:"durationInfo",
		info:Math.round(currentVid.duration)
	})
}


var prevTime = 0;
setInterval(function(){
	var prevTime = 0;
	currTime = Math.round(currentVid.currentTime);
	if(currTime!=prevTime){
		chrome.runtime.sendMessage({
			type:"timeInfo",
			info:currTime
		})
		prevTime = currTime;
	}

},1000)

function pausedFromWindow(){
	chrome.runtime.sendMessage({
		type:'pausedFromWindow',
	});
}
function playedFromWindow(){
	chrome.runtime.sendMessage({
		type:'playedFromWindow'});
}

function videoEndedHand(){
	console.log("Video Ended");
	if(currentVid.ended){
		
		chrome.runtime.sendMessage(
			{type: 'videoEnded'
			}
		);
	};
};

chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
	
		switch(request.type){
			case "resumePlaying":
				currentVid.play();
				break;
			case "pausePlaying":
				currentVid.pause();
				break;
			case "seekVideo":
				console.log("seeking video")
				currentVid.currentTime = request.info;
				break;
		}
	}
);