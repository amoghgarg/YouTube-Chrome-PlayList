var queueWaitLoop;
var playlistWaitLoop;
var searchWaitLoop



function tabChanged(event, ui){
	if(ui.newPanel.selector!="#tabQueue"){
		$('#saveFooter').hide();
	}else{
		$('#saveFooter	').show();
	}

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
