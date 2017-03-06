const _ = require('lodash');
const request = require('request');
const json2csv = require('json2csv');
const fs = require('fs');

//******DO THIS********** app creds from dev.vin.li
var appId = 'XXXXXXX';
var appSecret = 'XXXXXX';

//******DO THIS*****************enter your device id
var deviceId = 'XXXXXXXXXX';

var encodeAuth = new Buffer(secrets.appId + ':' + secrets.appSecret).toString('base64'); //get your app ID and app Secret from dev.vin.li and replace
var since = '2016-01-25T00:00:00.000Z';
var until = '2016-12-01T00:00:00.000Z';


//for the csv
var fileName = 'telemetry-messages-device-' + deviceId + '.csv';


//other vars
var keyList = [];
var allMessages = [];

//initial vinli api call
var options = { method: 'GET',
  //consider using since and until query parameters to narrow response to a time segment
  url: 'https://telemetry.vin.li/api/v1/devices/' + deviceId + '/messages?limit=100',
  headers:
   { 'cache-control': 'no-cache',
     authorization: 'Basic ' + encodeAuth } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  if (response.statusCode === 200){
    console.log('request worked!');

    var responseBody = JSON.parse(body);

    responseBody.messages.forEach(function(message){
      allMessages.push(message);
    });

     if (Number(responseBody.meta.pagination.remaining) > 0) {
      //make next request
      nextRequest(responseBody.meta.pagination.links.prior);
      console.log('next call');
    } else {
      console.log('getting fields...');
      getKeys(allMessages, null);
      generateCSV();
    }

  } else {
    console.log('something went wrong, response code ' + response.statusCode + response.body);
  }
});
//end initial vinli api call


//next api call for remaining messages
function nextRequest(url) {

  var options = { method: 'GET',
    url: url,
    headers:
     { 'cache-control': 'no-cache',
       authorization: 'Basic ' + encodeAuth } };

       request(options, function (error, response, body) {
         if (error) throw new Error(error);

         if (response.statusCode === 200){
           var responseBody = JSON.parse(body);

           responseBody.messages.forEach(function(message){
             allMessages.push(message);
           })

           if (Number(responseBody.meta.pagination.remaining) > 0) {

             nextRequest(responseBody.meta.pagination.links.prior);
             console.log(responseBody.meta.pagination.remaining + ' remaining messages to process');

           } else {
             console.log('getting fields...');
             getKeys(allMessages, null);
             generateCSV();
           }
         }
       });
}


//get fields keylist
function getKeys(obj, parent){
    var keys = Object.keys(obj);

    keys.forEach(function(key){

      if(_.isObject(obj[key])){
        //if the key is an object run this function again, but for the key object

        getKeys(obj[key], parent + "." + key);

      } else {
        var newKey = _.trimStart(parent + "."+ key, "null.")
        var k = newKey.substring(newKey.length, newKey.indexOf(".") + 1);
        keyList.push(k);
        keyList = _.uniq(keyList);
      }
    })
}

function generateCSV(){
    var jsoncsv = json2csv({data: allMessages, fields: keyList});
    //*********DO THIS******* define the path where the file will be saved
    fs.writeFile('/Users/someUser/Desktop/'+fileName,jsoncsv,function(err){
      if (err) throw err;
      console.log('file saved');
    });
};