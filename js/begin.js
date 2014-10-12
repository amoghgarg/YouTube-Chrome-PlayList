var queueWaitLoop;
var playlistWaitLoop;
var searchWaitLoop
function tabChanged(event, ui){

	$("#inputSearch").focus();

	if(ui.newPanel.selector!="#tabPlaylist"){
		updateLoginSpan()
	}

	if(ui.newPanel.selector=="#tabSearch"){
		if(chrome.extension.getBackgroundPage().playing){
			showWaitSearch({type:"suggested"})
			chrome.runtime.sendMessage({
				type:"searchRelated"
			})
		}
	}
}

$(function() {

	$( "#tabs" ).tabs({
    	"active":1,
    	activate:tabChanged,
   	});
});
