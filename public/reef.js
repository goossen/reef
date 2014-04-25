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

//TODO move to server
function _getGPIO(id) {
   //get the GPIO pin number
   var jsonRows = this.buttonsJSON.rows;

   for(var i in jsonRows) {
      var jsonButtons = jsonRows[i].buttons;
      for (var j in jsonButtons) {
         if (jsonButtons[j].id === id) {
            return jsonButtons[j].gpio;
         }
      }
   }
}

function setOption(id) {
   _setOptionButtons(id, this.optionsJSON);
}

function loadJSON(file, callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
	xobj.open('GET', file, true); // Replace 'my_data' with the path to your file
	xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
}

function init() {
   _loadButtons();
   _loadOptions();
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

function _loadOptions() {
   loadJSON('json/options.json', function(response) {
      // Parse JSON string into object
      this.optionsJSON = JSON.parse(response);

      _optionsCreate(this.optionsJSON);
   });
}

function _optionsCreate(json) {

   // create elements
   var options     = document.getElementById("options");
   var jsonOptions = json.options;

   for(var i in jsonOptions) {
      // create options and text node 
      var input = document.createElement("input");    
                 
      input.setAttribute("type", "radio");
      input.setAttribute("id", jsonOptions[i].id);
      input.setAttribute("onclick", "setOption(id)");
      input.setAttribute("name", "group1");

      if (jsonOptions[i].checked==="true") {
         input.setAttribute("checked", "checked");
         setOption(jsonOptions[i].id);
      }

      options.appendChild(input);

      var label = document.createElement("label");
      label.setAttribute("for", "rad" + jsonOptions[i].id);
      var text = document.createTextNode(jsonOptions[i].label);
      label.appendChild(text);
      options.appendChild(label);
      options.appendChild(document.createElement("br"));
   }

}

function _setOptionButtons(id, json) {

   // create elements
   var options     = document.getElementById("options");
   var jsonOptions = json.options;

   for(var i in jsonOptions) {
      var option = jsonOptions[i];
      if (option.id===id) {
         for(var j in option.buttons) {
             var button = option.buttons[j];
             if (button.state === "on") {
                //poweron(button.id);
             } else if (button.state === "variable") {
                //_powervariable(button.id, button.file);
             } else if (button.state === "off") {
                //poweroff(button.id);
             }
         }
      }
   }
}




