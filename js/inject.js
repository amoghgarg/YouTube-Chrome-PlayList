currentVid = document.querySelector('video.video-stream');

//for( key in currentVid){
//	console.log(key);
//};

currentVid.addEventListener('ended',videoEndedHand);
currentVid.addEventListener('pause', pausedFromWindow);
currentVid.addEventListener('play', playedFromWindow);

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
		}
	}
);