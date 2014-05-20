var optionsJSON;
var buttonsJSON;


//process the button click, do a server PUT, allow the server to emit state
function power(id) {
   var className = document.getElementById(id).className;
   if (className.indexOf("off") != -1) {
      var xmlhttp=new XMLHttpRequest();
      xmlhttp.open("PUT","?id=" + id + "&state=on",true);
      xmlhttp.send();
   } else {
      var xmlhttp=new XMLHttpRequest();
      xmlhttp.open("PUT","?id=" + id + "&state=off",true);
      xmlhttp.send();
   }
}

//set the button state, following a power event emitted from the server
function poweron(id) {
   document.getElementById(id).className = "powerbutton on";
}

function poweroff(id) {
   document.getElementById(id).className = "powerbutton off";
}

function loadJSON(file, callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
	xobj.open('GET', file, true); 
	xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
}

function init() {
   _loadButtons();
}

function loadSchedule(json) {
   //load time inputs based on schedule
   json.buttons.forEach(function (button) {

      var buttonElement = document.getElementById(button.id);

      //get parent and remove children, except for buttonElement, which we assume is the first child
      var nodes = buttonElement.parentNode.childNodes;
      for(i=1; i<nodes.length; i++) {
         buttonElement.parentNode.removeChild(nodes[i]);
      }

      var details = document.createElement("details");
      var summary = document.createElement("summary");
      summary.setAttribute("class", "powerbuttonp");
      var cellText = document.createTextNode(buttonElement.getAttribute('data-label'));
      summary.appendChild(cellText);

      //create timer table
      var detailsTable = document.createElement("table");
      var timerHeadingRow = document.createElement("tr");
      var headingOn = document.createElement("th");

      //create headings
      var textOn = document.createTextNode("on");
      headingOn.appendChild(textOn);
      var headingOff = document.createElement("th");
      var textOff = document.createTextNode("off");
      headingOff.appendChild(textOff);
      timerHeadingRow.appendChild(headingOn);
      timerHeadingRow.appendChild(headingOff);
      detailsTable.appendChild(timerHeadingRow);

      //iterate over the schedule in pairs of on/off times
      var schedule = button.schedule;
      for (var i = 0; i < schedule.length; i+=2) {
         var schedOn = schedule[i];
         var schedOff = schedule[i+1];

         var timerRow = document.createElement("tr");
         var cellOn = document.createElement("td");
         var timeOn = document.createElement("input");    
         timeOn.setAttribute("type", "time");
         //timeOn.setAttribute("id", jsonButtons[j].id + 'on');
         timeOn.setAttribute("value", schedOn.time);
         cellOn.appendChild(timeOn);
         var cellOff = document.createElement("td");
         var timeOff = document.createElement("input");
         timeOff.setAttribute("type", "time");
         //timeOff.setAttribute("id", jsonButtons[j].id + 'off');
         timeOff.setAttribute("value", schedOff.time);
         cellOff.appendChild(timeOff);
         timerRow.appendChild(cellOn);
         timerRow.appendChild(cellOff);
         detailsTable.appendChild(timerRow);
      }

      details.appendChild(detailsTable);
      details.appendChild(summary);
      buttonElement.parentNode.appendChild(details);

   });
}

function updateTemperatureTable(label, temperature) {
   var row = document.getElementById(label);

   if (row) {
      //update temperature
      document.getElementById('temp' + label).innerHTML = temperature + " F";
   } else {
      //create new row
      var table = document.getElementById('temptable');
      var row = document.createElement("tr");
      row.setAttribute("id", label);

      var cellLabel = document.createElement("td");
      var paragraph = document.createElement("p");
      paragraph.setAttribute("class", "temp templabel");
      var cellText = document.createTextNode(jsonButtons[j].label);
      paragraph.appendChild(cellText);
      cell.appendChild(paragraph);
      row.appendChild(cell);

      var cellLabel = document.createElement("td");
      var paragraph = document.createElement("p");
      paragraph.setAttribute("class", "temp OK");
      var cellText = document.createTextNode(temperature + " F");
      paragraph.appendChild(cellText);
      cell.appendChild(paragraph);
      row.appendChild(cell);

      table.appendChild(row);
   }
}

function _loadButtons() {
   loadJSON('json/buttons.json', function(response) {
      // Parse JSON string into object
      this.buttonsJSON = JSON.parse(response);

      _tableCreate(this.buttonsJSON);
   });
}

function _tableCreate(json) {

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
         cell.setAttribute("class", "powerbuttontd");

         var button = document.createElement("button");
         button.setAttribute("class", "powerbutton off");
         button.setAttribute("type", "submit");
         button.setAttribute("id", jsonButtons[j].id);
         button.setAttribute("onclick", "power(id)");
         button.setAttribute("data-label", jsonButtons[j].label);
         cell.appendChild(button);

         var paragraph = document.createElement("p");
         paragraph.setAttribute("class", "powerbuttonp");

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





