
function convert(e) {
	
    var sourceCurrency = document.forms["conversion-form"]["source"].value;
    var targetCurrency = document.forms["conversion-form"]["target"].value;
    var amount = document.forms["conversion-form"]["amount"].value;
    
    // Make a GET request to obtain the converted value
	axios.get('/api', {
	    params: {
	      source: sourceCurrency,
	      target: targetCurrency,
	      amount: amount
	    }
	  })
	  .then(function (response) {
		var result = document.getElementById("result");
		result.innerHTML = response.data.symbol + Number(response.data.value).toFixed(2);
		displayError(false);
	  })
	  .catch(function (error) {
		  if (error.response) {
			  displayError(true, error.response.data);
		  }
	});
	
	// Avoid form submission default behavior 
	e.preventDefault();
}

function loadCurrencies() {
    // Make a GET request to obtain the list of currencies
	axios.get('/api/currencies')
	  .then(function (response) {
		  var currencies = response.data;
		  
		  
		  var selectSource = document.getElementById("source");
		  var selectTarget = document.getElementById("target");
		  
		  currencies.forEach(function(curr) {
			  //Creates a new <option> element
			  function newOption(data) {
				  var opt = document.createElement("option");
				  opt.textContent = data.name + " (" + data.symbol + ")";
				  opt.value = data.id;
			      return opt;
			  }
			  
			  //Fill <select> elements with currencies
			  selectSource.appendChild(newOption(curr));
			  selectTarget.appendChild(newOption(curr));
		  });
	  })
	  .catch(function (error) {
		  if (error.response) {
			  displayError(true, error.response.data);
		  }
	  });
}

function displayError(show, data) {
	  var errorSection = document.getElementById("error-area");
	  
	  if (show) {
		  errorSection.getElementsByTagName("h3")[0].innerHTML = data.error;
		  errorSection.getElementsByTagName("p")[0].innerHTML = data.message.substr(0, 150);
		  errorSection.style.display = "block";
	  } else {
		  errorSection.style.display = "none";
	  }
}

/* Events definition */
//Call converter method when submitting form
document.getElementById("conversion-form").addEventListener("submit", convert);

//Load currencies when loading window
window.addEventListener("load", function() {
    loadCurrencies();
}, false);
