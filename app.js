var cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./sheets');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/[a-z\-]+', function(req, res, next) {
  return res.sendFile('public/index.html', { root: __dirname });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/api/', indexRouter);

module.exports = app;
