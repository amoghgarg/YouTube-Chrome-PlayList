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

function isContained(child, parent){
    var current = child;  

    while (current) {
    	try {
	        if(current.getAttribute("id") == "player-api") {
	        	return true;
	        }
   		}
   		catch(err){
   			return false;
   		}
        current = current.parentNode;
    }
    return false;
}


function playedFromWindow(){
	chrome.runtime.sendMessage({
		type:'playedFromWindow'});
}

function clickEvent(e){
	if(e.which==1 & !isContained(e.target, "player-api") & (e.target.getAttribute("id")!="page") & (e.target.getAttribute("id")!="yt-masthead") &(e.target.getAttribute("id")!="yt-uix-button-content") & (e.target.getAttribute("id")!="theater-background") & (e.target.getAttribute("id")!="watch-discussion") & (e.target.getAttribute("id")!="watch7-main")){
		
		window.alert("This page is being controlled by QueueIt.\nYou cannot navigate away from this page. \n\nYou can however add any video on this page to QueueIt by right clicking on the video.")
		e.stopPropagation();
	}
}

function urlChanging(e){
	window.alert("Url")
}

document.body.addEventListener('mousedown', clickEvent, true); 
document.body.addEventListener('hashchange', urlChanging, false);




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