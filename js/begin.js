var queueWaitLoop;
var playlistWaitLoop;
var searchWaitLoop
var showRelated = 1;
function tabChanged(event, ui){
	if(ui.newPanel.selector!="#tabQueue"){
		$('#saveFooter').hide();
		$('#completedText').show();
	}else{
		$('#saveFooter	').show();
	}

	if(ui.newPanel.selector!="#tabPlaylist"){
		updateLoginSpan()
	}
	if(ui.newPanel.selector=="#tabSearch"){
		if(chrome.extension.getBackgroundPage().playing & showRelated){
			showWaitSearch({type:"suggested"})
			chrome.runtime.sendMessage({
				type:"searchRelated",
				videoId:"nowPlaying"
			})
		}
		setTimeout(function(){
			$("#inputSearch").focus();
		}, 300);
	}
}

$(function() {

	$( "#tabs" ).tabs({
    	"active":1,
    	activate:tabChanged,
   	});
});
