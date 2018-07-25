var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log("received recording information!!")
  console.log(req);
  //recordingStore.push("Im amazing");
  res.sendStatus(200);
});

module.exports = router;
