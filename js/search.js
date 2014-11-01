var serResults = [];
var resultState = "search"

function searchClicked(){
	$("#resultsDisp").html("")
	showWaitSearch({type:"searching"})
	chrome.runtime.sendMessage({
		type:"searchQuery",
		text:$("#inputSearch").val()
	})

}

function hideWaitSearch(){
	document.getElementById("loadingProgressG_1").style.visibility = "hidden";	

}

function showWaitSearch(input){
	document.getElementById("loadingProgressG_1").style.visibility = "visible";
	document.getElementById("completedText").innerHTML = "Added to Queue"
}

$(function(){
	$("#butSearch").click(searchClicked);
	$("#resultsDisp").html("");
	if ($("#inputSearch").val().length == 0){
		str = '';
		str += "<div id=\"noticePl\">Search Youtube and Click to add to Queue</div>";
		$("#resultsDisp").html(str);
	};
	$("#inputSearch").keyup(function(event){
		if(event.keyCode == 13 & $("#inputSearch").val().length > 0){
			searchClicked();
		}
	});

	// $(window).scroll(function() {
	// 	if($(window).scrollTop() == $(document).height() - $(window).height()) {
	// 		chrome.runtime.sendMessage({
	// 			type:"searchQueryonScroll",
	// 			nextType:resultState,
	// 		});
	// 	}
	// });

});

function displayResults(input){
	var text = "";
	for(var i = 0; i<serResults.length; i++){
		text = text + "<div class=\"searchedVid\" id=\""+i+"\"><span><img src = \""+serResults[i].thumbNail+"\"></span><span><div id='text' >" + serResults[i].name+"</div></span><span><button class=\"fa fa-play-circle fa-2x addPlay\" z-index=\"1000\"></button><button title=\"Similar Songs\" class=\"fa fa-plus-circle fa-2x addOnly\"></button></span></div>";
	}
	text += "</br>"

	if(input == "clear"){
		$("#resultsDisp").html(text)
	}
	else if(input == "add"){
		$("#resultsDisp").html($("#resultsDisp").html() + text)
	}
	// $("#resultsDisp").show()

	
	$(".searchedVid").mouseenter(searchVidEnter);
	$(".searchedVid").mouseleave(searchVidLeave);
	$(".addOnly").click(addOnlyCall);
	$(".addPlay").click(addPlayCall)
	hideWaitSearch()
}

function searchVidEnter(event, ui){
	$(this).children("span").children("button")[0].style.visibility="visible";        
    $(this).children("span").children("button")[1].style.visibility="visible";
}

function searchVidLeave(event, ui){
	$(this).children("span").children("button")[0].style.visibility="hidden";        
    $(this).children("span").children("button")[1].style.visibility="hidden";
}

function addOnlyCall(event, ui){
	ind = $(this).parent().parent().attr("id");
	chrome.runtime.sendMessage({
		"type" : "addVideo",
		"link" : serResults[ind].link,
		"name" : serResults[ind].name
	})
}

function addPlayCall(event, ui){
	ind = $(this).parent().parent().attr("id");
	chrome.runtime.sendMessage({
		"type" : "addPlayVideo",
		"link" : serResults[ind].link,
		"name" : serResults[ind].name
	})
}




chrome.runtime.onMessage.addListener( 
	function(request,sender,sendResponse){
		switch(request.type){
			case "queryResUp":
				serResults = request.results;
				resultState = "query";
				displayResults("clear");
			break;
			case "relatedResUp":
				serResults = request.results;
				resultState = "related";
				displayResults("clear");
				showRelated = 1;
			break;
			case "scrollResUp":
				serResults.push.apply(serResults, request.results);
				displayResults("add");
		}
	}
)
