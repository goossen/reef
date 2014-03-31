var optionsJSON;
var buttonsJSON;

function power(id) {
   var className = document.getElementById(id).className;
   if (className.indexOf("off") != -1) {
      poweron(id);
   } else {
      poweroff(id);
   }
}

function poweron(id) {
   document.getElementById(id).className = "powerbutton on";
   var xmlhttp=new XMLHttpRequest();
   xmlhttp.open("PUT","?open=" + _getGPIO(id),true);
   xmlhttp.send();
}

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

function poweroff(id) {
   document.getElementById(id).className = "powerbutton off";
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
   _getTemperature();
}

function _getTemperature() {
   var xmlhttp=new XMLHttpRequest();
   xmlhttp.open("GET","/temperature",true);
   xmlhttp.send();
   var tempC = xmlhttp.responseText;
   var tempF=tempC / 1000 * 9 / 5 + 32;
   document.getElementById("temp1").innerHTML = Math.round(tempF * 10) / 10 + " F";
}

function _loadButtons() {
   loadJSON('buttons.json', function(response) {
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
                 
         var button = document.createElement("button");
         button.setAttribute("class", "powerbutton off");
         button.setAttribute("type", "submit");
         button.setAttribute("id", jsonButtons[j].id);
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

function _loadOptions() {
   loadJSON('options.json', function(response) {
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

      console.log(i);
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
                poweron(button.id);
             } else if (button.state === "variable") {
                poweron(button.id);//TODO use clock, check times
             } else if (button.state === "off") {
                poweroff(button.id);
             }
         }
      }

   }


}


