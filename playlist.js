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
		var currentLength = back.vidLinks.length;

		var text = "";
		if(currentLength>0){
			text = text + "<div id=\"saveDiv\"><button id='saveButton'>Save Queue</button></div>";
		}
		
		text = text + "<div style-\"float:bottom\"><ul id=\"playlistList\">"
             
		for (var i=0; i<listList.length; i++){
			text=text+"<li id=\""+i+"\" class=\"listItem ui-state-default\" style=\"overflow:hidden\" >"+listList[i].name+"</li>";
		}
		text = text + "</div>"
		document.getElementById('tabPlaylist').innerHTML = text;
    	$( "#playlistList" ).disableSelection();
    	$(".listItem").click(playListSel);
    	$("#saveButton").click(saveQueue);
    	$("#saveButton").button()
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

function addToPlaylist(event, ui){
	var temp = $(this).attr('id')
	chrome.runtime.sendMessage({
		type:"addToPlayList",
		id:temp
	});
	$(".listItem").click(playListSel);
}

function saveQueue(){
	var text = "Create new playlist: <input type=\"text\" id=\"playListName\" >";
	text = text + "<button id=\"newPlaylistButton\">Create</button>"
	text = text +"OR<br> Add to:";
	document.getElementById("saveDiv").innerHTML = text;
	$("#newPlaylistButton").click(createNewPlaylist);
	$(".listItem").click(addToPlaylist);
}


function createNewPlaylist(){
	var name = document.getElementById("playListName").value;
	if(name.length<1){
		//window.alert("Please Enter a Name or Select an existing playlist");
	}
	else{
		//window.alert(name);
		chrome.runtime.sendMessage({
			type:"createNewPlaylist",
			"name":name
		});
	}
}