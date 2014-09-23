window.onload=linksToTable;
var currentLength;

function playClicked(){

	if(vidLinks.length>0){
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
		console.log("playClicked");
		playButton = document.getElementById("play");	
		playButton.onclick = pauseClicked;
		chrome.runtime.sendMessage(
			{type : "playClick"}
		);
	};
};

$(function() {
    $( "#sortable" ).sortable( {	
    	"axis": "y",
    	opacity: 0.5,
    	containment: "parent",
    	handle: 'span',
    	start: function(event, ui){
    		before = ui.item.index();
    	},
    	stop: function(event,ui){
    		updateID();
    		nowPlay = $(".ui-state-active").attr("id");
    		chrome.runtime.sendMessage({
    			type: "listChanged",
    			"before": before,
    			"after": ui.item.index(),
    			"nowPlay":$(".ui-state-active").attr("id"),
    		})
    	},
    });
    $( "#sortable" ).disableSelection();
 });

function updateID(){
	items = document.getElementsByTagName("li");
	var countID=0
	for(ind=0; ind<items.length; ind++){
		items[ind].id=ind;
		countID++;
	};
};

function pauseClicked(){
	$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-play"
      	  }
    	});
	console.log("pauseClicked");
	playButton = document.getElementById("play");
	playButton.onclick = playClicked;

	chrome.runtime.sendMessage(
		{type:"pauseClicked"}	
	);
};

function prevClicked(){
	chrome.runtime.sendMessage({
		type:"prevClicked"}
	);

	if(nowPlay==0){
		var clicked = vidLinks.length-1;
	}
	else{
		var clicked = nowPlay-1;
	}
	$("#"+nowPlay).removeClass('ui-state-active');
	$("#"+nowPlay).addClass('ui-state-default');
	$("#"+clicked).addClass('ui-state-active');
	$("#"+clicked).removeClass('ui-state-default');

	nowPlay = clicked;
};

function nextClicked(){
	chrome.runtime.sendMessage({
		type:"nextClicked"}
	);
	
	if(nowPlay==vidLinks.length-1){
		var clicked = 0;
	}
	else{
		var clicked = parseInt(nowPlay)+1;
	}
	$("#"+nowPlay).removeClass('ui-state-active');
	$("#"+nowPlay).addClass('ui-state-default');
	$("#"+clicked).addClass('ui-state-active');
	$("#"+clicked).removeClass('ui-state-default');

	nowPlay = clicked;
};


function clearClicked(){
	if(vidLinks.length>0){
		var response = confirm("Clear the playlist?");
		if(response==true){
			$("li").remove();
			chrome.runtime.sendMessage({
				type:"clear"
			});
		}
	}
};

canChange = true;
var back = chrome.extension.getBackgroundPage();
nowPlay = back.vidInd;
var vidLinks = back.vidLinks;
currentLength=vidLinks.length;

var authToken;


$(function() {
    $( "#playlists" ).selectmenu().selectmenu( "menuWidget" ).addClass( "overflow" );
    $( "#playlists" ).menu({ disabled: true });
 //    $( "#playlists" ).menu({
 //  		create: fetchPlaylist
	// });
});

function makeRequest(input){

	var url;

	if (input.life<0) return;

	switch (input.type){
		case "auth":
			chrome.identity.getAuthToken({interactive:true}, function(input){
				authToken = input;
				window.alert(authToken);	
				console.log(authToken);
			})
			return;
			break;
		case "getLists":
			url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&";
			if(input.nextPageToken!=''){
				url = url+"pageToken="+input.nextPageToken;
			}
			url = url + "&fields=items(id%2Csnippet)%2CnextPageToken&key="+authToken;
			break;
		case getItems:
			break;
	}

	var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",url,true);
    xmlhttp.send();
	xmlhttp.onreadystatechange=function(){
		if(xmlhttp.readyState==4)
			switch (xmlhttp.status){
				case 400:
					makeRequest({"type":"auth", "life":1});
					input.life = input.life - 1;
					window.alert(xmlhttp.responseText);
					makeRequest(input);
					return;
					break;
				case 403:
					makeRequest({"type":"auth", "life":1});
					input.life = input.life - 1;
					window.alert(xmlhttp.responseText);
					makeRequest(input);
					return;
					break;
				case 200:
					window.alert(xmlhttp.responseText);
					return(xmlhttp.response);
			}	
	}


}


function playlistClicked(event,ui){
	makeRequest({"type":"getLists","nextPageToken":'', "life":2})
}

function linksToTable() {

	playBut = document.getElementById("play");	
	document.getElementById("playlist").onclick=playlistClicked;
	document.getElementById("forward").onclick=nextClicked;
	document.getElementById("rewind").onclick=prevClicked;
	document.getElementById("clear").onclick=clearClicked;


	if(back.playing){
		playBut.onclick = pauseClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
	}
	else{
		playBut.onclick = playClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-play"
      	  }
    	});
	}
	

	var table='';
	
	for (i = 0; i < vidLinks.length; i++) {
		table += "<li id = \"" +i +"\" style=\"overflow:hidden\" class=\"ui-state-default\"><span class=\"ui-icon ui-icon-grip-dotted-horizontal\" style=\"float:left\"></span>"+
		"<div  id=\"listIten\" style=\"width:96%; position:relative; float:left; overflow:hidden; white-space: nowrap; margin: 0px 0px 4px 0px;\">"
		 + (vidLinks[i].name) + "</div><button class=\"remove\"  style=\"float:right; margin: 6px 0px 0px 0px; visibility:hidden\"></button></li>";
	}
	document.getElementById('sortable').innerHTML = table;

	$("li").click(songChosen);

	$( ".remove" ).button({
      text: "remove",
      icons: {
        primary: "ui-icon-close"
      }
    });

	$(".remove").mouseenter(function(){
    	 canChange = false;
	});

	$(".remove").mouseleave(function(){
		 canChange = true;
	});

    $(".remove").click(function(){
    	$(this).parent().remove(0);
    	id = $(this).parent().attr("id");
    	//vidLinks.splice(id,1);
    	removeItem(id);
    });

    $("#"+nowPlay).addClass('ui-state-active');
	$("#"+nowPlay).removeClass('ui-state-default');


	 $("li").mouseenter(
      function(){       
        $(this).removeClass("ui-state-default");
        $(this).addClass("ui-state-hover");
        $(this).children("button")[0].style.visibility="visible";
      });
    $("li").mouseleave(
      function(){
        $(this).addClass("ui-state-default");
        $(this).removeClass("ui-state-hover");
        $(this).children("button")[0].style.visibility="hidden";
      });




}

function removeItem(id){

	chrome.runtime.sendMessage({
		type:"removeItem",
		"id":id
	});
	
	if(nowPlay>id){
		nowPlay = (nowPlay-1)%vidLinks.length;
	}
	updateID();

};




function songChosen(){
	if(canChange){
		clicked = ($(this).attr('id'));
			   
		if(clicked!=nowPlay){
			$("#"+nowPlay).removeClass('ui-state-active');
			$("#"+nowPlay).addClass('ui-state-default');
			$("#"+clicked).addClass('ui-state-active');
			$("#"+clicked).removeClass('ui-state-default');
			chrome.runtime.sendMessage({
				type:"songChanged",
				"newInd": clicked
			});	
		}
		playBut.onclick = pauseClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
    	chrome.browserAction.setIcon({path:"iconCol.png"});

		nowPlay = clicked;

	}
};

$(function() {
    $( "#rewind" ).button({
      text: false,
      icons: {
        primary: "ui-icon-seek-prev"
      }
    });
    
    $( "#clear" ).button({
      text: false,
      icons: {
        primary: "ui-icon-close"
      }
    });
    $( "#play" ).button({
      text: false,
      icons: {
        primary: "ui-icon-play"
      }
    });
    $( "#forward" ).button({
      text: false,
      icons: {
        primary: "ui-icon-seek-next"
      }
    });
    $( "#shuffle" ).button();
  });
