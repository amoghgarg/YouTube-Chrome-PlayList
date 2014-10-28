var currentVid;
setTimeout(function(){
	console.log("script inserted")
	currentVid = document.querySelector('.video-stream');
	if(currentVid){
		console.log("player element fetched")
	}
	currentVid.addEventListener('ended',videoEndedHand);
	currentVid.addEventListener('pause', pausedFromWindow);
	currentVid.addEventListener('play', playedFromWindow);
},2000);

setTimeout(function(){
	currentVid.pause();
},6000)

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