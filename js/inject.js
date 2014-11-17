currentVid = document.querySelector('video.video-stream');

currentVid.addEventListener('ended',videoEndedHand);
currentVid.addEventListener('pause', pausedFromWindow);
currentVid.addEventListener('play', playedFromWindow);
//currentVid.addEventListener('progress', videoLoadStarted)
function pausedFromWindow(){
	chrome.runtime.sendMessage({
		type:'pausedFromWindow',
	});
}
// function videoLoadStarted(){
// 	chrome.runtime.sendMessage({
// 		type:'videoLoadStarted',
// 	});
// }
function playedFromWindow(){
	chrome.runtime.sendMessage({
		type:'playedFromWindow'});
}

function clickEvent(e){
	console.log(e.target)
	if(e.which==1 & (e.target.getAttribute("id")!="page") & (e.target.getAttribute("id")!="yt-masthead") &(e.target.getAttribute("id")!="yt-uix-button-content") & (e.target.getAttribute("id")!="theater-background") & (e.target.getAttribute("id")!="watch-discussion") & (e.target.getAttribute("id")!="watch7-main")){
		
		window.alert("This page is being controlled by QueueIt.\nYou cannot navigate away from this page. \n\nYou can however add any video on this page to QueueIt by right clicking on the video.")
		e.stopPropagation();
	}
}

document.body.addEventListener('mousedown', clickEvent, true); 




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
			case "getTime":
				console.log("Request Recieved.")
				sendResponse({
					current:Math.round(currentVid.currentTime),
					duration:Math.round(currentVid.duration),
					volume:currentVid.volume,
					muted:currentVid.muted
				})
				break;
			case "seekVideo":
				console.log("seeking video")
				currentVid.currentTime = request.info;
				break;
			case "seekVolume":
				console.log("Volume Change Requested:"+request.info)
				currentVid.volume = request.info
				break;
			case "muteVolume":
				console.log("Mute Request Received");
				currentVid.muted = !currentVid.muted
			break;
		}
	}
);