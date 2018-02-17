<?php
/*
 *  Place this script at event_url for your Nexmo application
 */
$method = $_SERVER['REQUEST_METHOD'];
// work with get or post
$request = array_merge($_GET, $_POST);

/*
 *  Do something for changed call status
*/
function handle_call_status()
{
  $decoded_request = json_decode(file_get_contents('php://input'), true);
  // Set a default message for incorrect key presses
  $ncco = "";
  if (isset($decoded_request['dtmf'])) {
    switch ($decoded_request['dtmf']) {
      case '1':
          $ncco = '[
              {
                "action": "talk",
                "text": "Thank you, I will forward you to the maybe department",
                "voiceName": "Amy"
              },
              {
                "action": "connect",
                "eventUrl": ["https://example.com/events"],
                "from": "441632960960",
                "endpoint": [
                  {
                    "type": "phone",
                    "number": "441632960961"
                  }
                ]
              }
            ]';
          break;
      case '2':
      $ncco = '[
          {
            "action": "talk",
            "text": "Thank you, I will forward you to the not sure department",
            "voiceName": "Amy"
          },
          {
            "action": "connect",
            "eventUrl": ["https://example.com/events"],
            "from": "441632960960",
            "endpoint": [
              {
                "type": "phone",
                "number": "441632960962"
              }
            ]
          }
        ]';
          break;
      default:
        $ncco = '[
            {
              "action": "talk",
              "text": "I am sorry, I did not catch that. Please press 1 for maybe and 2 for not sure followed by the hash key",
              "voiceName": "Amy"
            },
            {
              "action": "input",
              "submitOnHash": "true",
              "eventUrl": ["https://example.com/ivr"]
            }
          ]';
          break;
  }
      return $ncco;
  }
}

/*
 *  Handle errors
*/
function handle_error($request){
     //code to handle your errors
}

/*
  Send the 200 OK to Nexmo and handle changes to the call
*/
switch ($method) {
  case 'POST':
    //Retrieve your dynamically generated NCCO.
    $ncco = handle_call_status();
    header('Content-Type: application/json');
    echo $ncco;
    break;
  default:
    //Handle your errors
    handle_error($request);
    break;
}

