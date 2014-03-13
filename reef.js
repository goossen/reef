
function power(id)
{
   var className = document.getElementById(id).className;
   if (className.indexOf("off") != -1) {
      poweron(id);
   } else {
      poweroff(id);
   }
}

function poweron(id)
{
   document.getElementById(id).className = "powerbutton on";
}

function poweroff(id)
{
   document.getElementById(id).className = "powerbutton off";
}

function cycle(id)
{
   console.log(id);
   if (id === "rad1") {
      poweron("btn1");
      poweron("btn2");
      poweron("btn3");
      poweron("btn5");
      poweron("btn6");
      poweron("btn7");
      poweron("btn8");
      poweron("btn9");
   } else if (id === "rad2") {
      poweron("btn1");
      poweroff("btn2");
      poweroff("btn3");
      poweroff("btn5");
      poweroff("btn6");
      poweron("btn7");
      poweroff("btn8");
      poweroff("btn9");
   }
}

 function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
	xobj.open('GET', 'buttons.json', true); // Replace 'my_data' with the path to your file
	xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }

function loadButtons() {
 loadJSON(function(response) {
  // Parse JSON string into object
	var actual_JSON = JSON.parse(response);
	console.log(actual_JSON);

	//document.getElementById("buttonstable").innerHTML = actual_JSON.buttons[1].label;
	tableCreate(actual_JSON);
 })

 function tableCreate(json) {

        // create elements <table> and a <tbody>
        var tbl     = document.getElementById("buttonstable");
        var tblBody = document.createElement("tbody");

        // cells creation

   var jsonRows = json.rows;

   for(var i in jsonRows) {
      var cellnum = 0;
      var row = document.createElement("tr");

      var jsonButtons = jsonRows[i].buttons;

      for (var j in jsonButtons) {
         // create button and text node 
         var cell = document.createElement("td");    
                 
         var button = document.createElement("button");
         button.setAttribute("class", "powerbutton " + jsonButtons[j].state);
         button.setAttribute("type", "submit");
         button.setAttribute("id", "btn" + jsonButtons[j].id);
         button.setAttribute("onclick", "power(id)");
         cell.appendChild(button);

         var paragraph = document.createElement("p");
         var cellText = document.createTextNode(jsonButtons[j].label);
         paragraph.appendChild(cellText);
         cell.appendChild(paragraph);

         row.appendChild(cell);
       }

       //row added to end of table body
       tblBody.appendChild(row);
   }

   // append the <tbody> inside the <table>
   tbl.appendChild(tblBody);
  }
}
