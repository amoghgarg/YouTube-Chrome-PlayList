var loggedIn = -1;
var listList = [];
var listInd = -1;

$(function(){
	updateLoginSpan();
})

function login(){
	chrome.runtime.sendMessage({
				type:"login"
			});
};

function updateLoginSpan(){
	back = chrome.extension.getBackgroundPage();
	if(back.loggedIn){		
		//window.alert("Logged in")
		listInd = back.listIndex;
		listList = back.listList;
		
		var text =  "<div style-\"float:bottom\"><ul id=\"playlistSortable\">"
             
		for (var i=0; i<listList.length; i++){
			text=text+"<li id=\""+i+"\" class=\"listItem\" style=\"overflow:hidden\" class=\"ui-state-default\">"+listList[i].name+"</li>";
		}
		text = text + "</div>"
		document.getElementById('tabPlaylist').innerHTML = text;
    	$("#playlistSortable").sortable();
    	$( "#playlistSortable" ).disableSelection();
    	$("#playlistSortable").sortable('refresh');
    	$(".listItem").click(playListSel);
	}
	else{
		document.getElementById('tabPlaylist').innerHTML = "<button id='loginButton'>YouTube Login</button>";
		$( "#loginButton" ).button({
	      text: true,
    	});
    	document.getElementById("loginButton").onclick=login;
	}
}



chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "listListUp":
				updateLoginSpan();
				break;
		}
	}
)


function playListSel(event, ui){
	listInd = $(this).attr('id')
	if(currentLength>0){
		var response = confirm("New queue would be loaded. Clear current queue?");
		if(response){
			clearQueue();
		}
	}
	$( "#playlists" ).selectmenu({select:playListSel});	
	chrome.runtime.sendMessage({
		"type":"listSel",
		"index":listInd
	})
}