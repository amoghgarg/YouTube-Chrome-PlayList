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
		
		playButton = document.getElementById("play");	
		playButton.onclick = pauseClicked;

		back = chrome.extension.getBackgroundPage();
		nowPlay = back.vidInd;
		$("#"+nowPlay).addClass('ui-state-active');
		$("#"+nowPlay).removeClass('ui-state-default');

		chrome.runtime.sendMessage(
			{type : "playClick"}
		);
		("#")
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
    		window.alert(before)
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

	back = chrome.extension.getBackgroundPage();
	nowPlay = back.vidInd;
	$("#"+nowPlay).removeClass('ui-state-active');
	$("#"+nowPlay).addClass('ui-state-default');
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
			$(".vidItem").remove();
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

function playListSel(event, ui){
	listInd = ui.item.index;
	if(listInd==0){
		//Saving the list.
	}
	else{
		listInd -=1;
		chrome.runtime.sendMessage({
			"type":"listSel",
			"index":listInd
		})
	}

}


function login(){
	chrome.runtime.sendMessage({
				type:"login"
			});
};

function updateLoginSpan(){
	back = chrome.extension.getBackgroundPage();
	nowPlay = back.vidInd;
	vidLinks = back.vidLinks;
	currentLength=vidLinks.length;
	

	if(back.loggedIn){
		listList = back.listList;
		var text = "<select name=\"speed\" id=\"playlists\" style=\"width: 158px\">"+
	      			"<option>Save current playlist to YouTube account</option>"+
	     			"<optgroup label=\"Your playlists\" id=\"listNames\">"
		for (var i=0; i<listList.length; i++){
			text=text+"<option>"+listList[i].name+"</option>";
		}
		text = text + "</optgroup>" + "</select>";	
		document.getElementById('loginSpan').innerHTML = text;
		$( "#playlists" ).selectmenu();
		$( "#playlists" ).selectmenu("refresh");	
		$( "#playlists" ).selectmenu({select:playListSel});	
	}
	else{
		document.getElementById('loginSpan').innerHTML = "<button id='loginButton'>YouTube Login</button>";
		$( "#loginButton" ).button({
	      text: true,
    	});
    	document.getElementById("loginButton").onclick=login;
	}
}



function linksToTable() {

	back = chrome.extension.getBackgroundPage();
	nowPlay = back.vidInd;

	vidLinks = back.vidLinks;
	currentLength=vidLinks.length;
	

	updateLoginSpan();
	
	playBut = document.getElementById("play");		
	document.getElementById("forward").onclick=nextClicked;
	document.getElementById("rewind").onclick=prevClicked;
	document.getElementById("clear").onclick=clearClicked;


	var table='';
	//ui-state-default
	for (i = 0; i < vidLinks.length; i++) {
		table += "<li id = \"" +i +"\" style=\"overflow:hidden\" class=\"vidItem ui-state-default\" ><span class=\"ui-icon ui-icon-grip-dotted-horizontal\" style=\"float:left\"></span>"+
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


    if(back.playing){
		playBut.onclick = pauseClicked;
		$( "#play" ).button({
	      text: false,
	      icons: {
	      	primary: "ui-icon-pause"
      	  }
    	});
    	$("#"+nowPlay).addClass('ui-state-active');
		$("#"+nowPlay).removeClass('ui-state-default');
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
    


	$(".vidItem").mouseenter(
      function(){ 
        $(this).removeClass("ui-state-default");
        $(this).addClass("ui-state-hover");
        $(this).children("button")[0].style.visibility="visible";
      });
    $(".vidItem").mouseleave(
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


chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "listListUp":
				updateLoginSpan();
				break;
			case "vidLinksUp":
				linksToTable();
				break;

		}
	}
)



//Get the videos:
//https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PL9425C2A10C2994FF&fields=items(snippet(title%2CresourceId%2FvideoId))%2CnextPageToken&key={YOUR_API_KEY}