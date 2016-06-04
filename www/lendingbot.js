var localFile, reader;


function updateJson(data) {
    $('#status').text(data.last_status);
    $('#updated').text(data.last_update);

    var rowCount = data.log.length;
    var table = $('#logtable');
    table.empty();
    for (var i = rowCount - 1; i >=0; i--) {
        table.append($('<tr/>').append($('<td colspan="2" />').text(data.log[i])));
    } 
    
    updateRawValues(data.raw_data);
}

function updateRawValues(rawData){
    var table = document.getElementById("detailsTable");
    table.innerHTML = "";
    var currencies = Object.keys(rawData);
    var totalBTCEarnings;
    for (var keyIndex = 0; keyIndex < currencies.length; ++keyIndex)
    {
        var currency = currencies[keyIndex];
        var averageLendingRate = parseFloat(rawData[currency]['averageLendingRate']);
        var lentSum = parseFloat(rawData[currency]['lentSum']);
        var totalCoins = parseFloat(rawData[currency]['totalCoins']);
        var highestBidBTC = parseFloat(rawData[currency]['highestBid']);
        var couple = rawData[currency]['couple'];

        if(!isNaN(averageLendingRate) && !isNaN(lentSum) || !isNaN(totalCoins))
        {
        
            // cover cases where totalCoins isn't updated because all coins are lent
            if(isNaN(totalCoins) && !isNaN(lentSum)) {
                totalCoins = lentSum;
            }
            var rate = +averageLendingRate  * 0.85 / 100; // 15% goes to Poloniex fees
            
            var earnHourly = (+lentSum * +rate) / 24;
            earnHourly = isNaN(earnHourly) ? 0 : earnHourly;
            var earnDaily = (+lentSum * +rate);
            var earnWeekly = (+lentSum * +rate) * 7;               
            var earnMonthly = (+lentSum * +rate) * 30;
            
            var earnings = roundFloat(earnMonthly, 100000000) + " "+currency+" / Month<br/>"
                    + roundFloat(earnWeekly, 100000000) + " "+currency+" / Week<br/>"
                    + roundFloat(earnDaily, 100000000) + " "+currency+" / Day<br/>";
            if(currency == 'BTC') {
                earnings += Math.round(earnHourly * 100000000) + " Satoshi / Hour<br/>";                        
            } else {
                earnings += roundFloat(earnHourly, 100000000) + " "+currency+" / Hour<br/>";
            }
                    
                    
            var effectiveRate = lentSum * rate * 100 / totalCoins;
            
            var rowValues = [currency,
                roundFloat(lentSum, 10000) + ' ' + currency,
                roundFloat(averageLendingRate, 100000)  + '%',
                roundFloat(totalCoins, 10000)  + ' ' + currency,
                roundFloat(effectiveRate, 100000) + '%' ]

            var row = table.insertRow();
            
            for (var i = 0; i < rowValues.length; ++i) {
                var cell = row.appendChild(document.createElement("td"));
                cell.innerHTML = rowValues[i];
            }
            
            // add earnings
            var row = table.insertRow();
            
            var earningsColspan = rowValues.length - 1;
            var earningsBTC;
            if(!isNaN(highestBidBTC)) {
                earningsBTC = roundFloat(earnMonthly * highestBidBTC, 100000000) + " BTC / Month<br/>"
                    + roundFloat(earnWeekly * highestBidBTC, 100000000) + " BTC / Week<br/>"
                    + roundFloat(earnDaily * highestBidBTC, 100000000) + " BTC / Day<br/>"
                    + Math.round(earnHourly * highestBidBTC * 100000000) + " Satoshi / Hour<br/>";
                    
                earningsColspan = Math.round(earningsColspan / 2);                                                
            }
            
            var cell = row.appendChild(document.createElement("td"));
            cell.innerHTML = "<b>"+ currency +"<br/>Estimated<br/>Earnings<b>";
            cell = row.appendChild(document.createElement("td"));
            cell.setAttribute("colspan", earningsColspan);
            cell.innerHTML = earnings;
            
            if(!isNaN(highestBidBTC)) {
                var cell = row.appendChild(document.createElement("td"));
                    cell.innerHTML = "<b>"+ couple +"<br/>highest bid:<br/>"+ highestBidBTC +"<b>";
                var cell = row.appendChild(document.createElement("td"));
                    cell.setAttribute("colspan", rowValues.length - earningsColspan - 1);
                    cell.innerHTML = earningsBTC;
            }

        }
    }
}

function handleLocalFile(file) {
    localFile = file;
    reader = new FileReader();
    reader.onload = function(e) {
        updateJson(JSON.parse(reader.result));
    };
    reader.readAsText(localFile, 'utf-8');
}

function loadData() {
    if(localFile) {
        reader.readAsText(localFile, 'utf-8');
        setTimeout('loadData()',30000)
    } else {            
        // expect the botlog.json to be in the same folder on the webserver
        var file = 'botlog.json';            
        $.getJSON(file, function (data) {               
            updateJson(data);
            // reload every 30sec
            setTimeout('loadData()',30000)
        }).fail( function(d, textStatus, error) {
           $('#status').text("getJSON failed, status: " + textStatus + ", error: "+error);
           // retry after 60sec
           setTimeout('loadData()',60000)
        });;
    }            
}

function roundFloat(value, roundFigure) {
    var result = Math.round(value * roundFigure) / roundFigure;
    return result = isNaN(result) ? 0 : result;
}

$(document).ready(function () {
    loadData();
    if(window.location.protocol == "file:") {
        $('#file').show();
    }
});
