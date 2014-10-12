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
	stopAnimation();
	document.getElementById("loaderImage").style.visibility = "hidden";	
}

function showWaitSearch(input){
	document.getElementById("loaderImage").style.visibility = "visible";
	startAnimation();
	document.getElementById("completedText").innerHTML = "Added to Queue"
}

$(function(){
	$("#butSearch").click(searchClicked);
	$("#inputSearch").keyup(function(event){
	    if(event.keyCode == 13 & $("#inputSearch").val().length > 0){
	    	searchClicked();
    	}
    });

    $(window).scroll(function() {
	    if($(window).scrollTop() == $(document).height() - $(window).height()) {
	        chrome.runtime.sendMessage({
				type:"searchQueryonScroll",
				nextType:resultState,
			});
    	}
	});

});

function displayResults(input){
	var text = "";
	for(var i = 0; i<serResults.length; i++){
		text = text + "<div class=\"searchedVid\" id=\""+i+"\"><img src = \""+serResults[i].thumbNail+"\"><div id='text'>" + serResults[i].name+"</div></div><br>";
	}

	if(input == "clear"){
		$("#resultsDisp").html(text)
	}
	else if(input == "add"){
		$("#resultsDisp").html($("#resultsDisp").html() + text)
	}
	
	$(".searchedVid").click(searchVidSel);
	hideWaitSearch()
}

function searchVidSel(event, ui){
	ind = $(this).attr("id")
	chrome.runtime.sendMessage({
		"type" : "addVideo",
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
			break;
			case "scrollResUp":
				serResults.push.apply(serResults, request.results);
				displayResults("add");
		}
	}
)
