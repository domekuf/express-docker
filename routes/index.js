var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/cbrs-api', function(req, res, next) {
    res.send("CBRS API docs");
});

module.exports = router;
