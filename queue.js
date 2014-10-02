window.onload=loadThings;
var currentLength;
var canChange = true;
var nowPlay;
var listInd;




function playClicked(){

	if(currentLength>0){
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

		if( !nowPlay || nowPlay==-1){
			nowPlay = 0
		}
		$("#"+nowPlay).addClass('ui-state-active');
		$("#"+nowPlay).removeClass('ui-state-default');

		chrome.runtime.sendMessage(
			{type : "playClick"}
		);
		("#")
	};
};

$(function() {
    $( "#queueSortable" ).sortable( {	
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
    $( "#queueSortable" ).disableSelection();
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
		var clicked = currentLength-1;
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
	
	if(nowPlay==currentLength-1){
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
	if(currentLength>0){
		var response = confirm("Clear the playlist?");
		if(response==true){
			clearQueue();
		}
	}
};

function clearQueue(){
	$(".vidItem").remove();
			chrome.runtime.sendMessage({
		type:"clear"
	});

	$( "#play" ).button({
      text: false,
      icons: {
      	primary: "ui-icon-play"
  	  }
	});
};


function testFunction(){
	window.alert(listInd);
}

function loadThings() {
	updateTable()
;}

function updateTable(){
	back = chrome.extension.getBackgroundPage();
	vidLinks = back.vidLinks;
	nowPlay = back.vidInd;
	currentLength = vidLinks.length;

	playBut = document.getElementById("play");		
	document.getElementById("forward").onclick=nextClicked;
	document.getElementById("rewind").onclick=prevClicked;
	document.getElementById("clear").onclick=clearClicked;
	//$("#test").click( testFunction);


	var table='';
	//ui-state-default
	for (i = 0; i < currentLength; i++) {
		table += "<li id = \"" +i +"\" style=\"overflow:hidden\" class=\"vidItem ui-state-default\" ><span class=\"ui-icon ui-icon-grip-dotted-horizontal\" style=\"float:left\"></span>"+
		"<div  id=\"listIten\" style=\"width:96%; position:relative; float:left; overflow:hidden; white-space: nowrap; margin: 0px 0px 4px 0px;\">"
		 + (vidLinks[i].name) + "</div><button class=\"remove\"  style=\"float:right; margin: 6px 0px 0px 0px; visibility:hidden\"></button></li>";
	}
	document.getElementById('queueSortable').innerHTML = table;

	//// Vid Item changes
	$(".vidItem").click(songChosen);
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
    	id = $(this).parent().attr("id");
    	//vidLinks.splice(id,1);
    	removeItem(id);
    });
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
     ///////////////////////////////////////

    //// Play and pause button cofiguration
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
    //////////////////////////////////////
}


function removeItem(id){

	chrome.runtime.sendMessage({
		type:"removeItem",
		"id":id
	});
	
	if(nowPlay>id){
		nowPlay = (nowPlay-1)%currentLength;
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
			case "vidLinksUp":
				updateTable();
				break;

		}
	}
)