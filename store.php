<?php

$method = $_SERVER['REQUEST_METHOD'];
$request = array_merge($_GET, $_POST);

$ncco = "";
switch ($method) {
  case 'GET':
    //Retrieve with the parameters in this request
    $to = $request['to']; //The endpoint being called
    $from = $request['from']; //The endpoint you are calling from
    $uuid = $request['conversation_uuid']; //The unique ID for this Call
    //Store the parameters in your database to identify this conversation in further interactions

    //Generate the welcome message
    $ncco='[
      {
        "action": "talk",
        "text": "Welcome to a Voice API I V R. Press 1 for maybe and 2 for not sure followed by the hash key",
        "voiceName": "Amy"
      },
      {
        "action": "input",
        "submitOnHash": "true",
        "eventUrl": ["https://example.com/ivr"]
      }
    ]';
    header('Content-Type: application/json');
    echo $ncco;
    break;
  default:
    //Handle your errors
    handle_error($request);
    break;
}

