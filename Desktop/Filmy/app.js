var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//My modules
var raccoon = require('raccoon');
var mysql = require('mysql');
var async = require('async');
//Connect to Redis server (port,url)
raccoon.connect(6379, '127.0.0.1');

var connection = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '',
  database: 'filmy'
});


var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/update',function(request,response) {
  connectSQL();
  connection.query('SELECT * FROM `ratings` LIMIT 50', function (error, results) {
    async.each(results, function(file, callback) {
      if( file.rating > 3 ) {
        raccoon.liked(file.userId, file.movieId,function(){});
        callback();
      } else {
        raccoon.disliked(file.userId, file.movieId,function(){});
        callback();
      }
    }, function(err){
      if( err ) {
        console.log('A file failed to process');
      } else {
        console.log('All files have been processed successfully');
        raccoon.recommendFor(5, 5, function (results) {
          response.send(results);
        });
      }
    });
    });
});
app.get('/rate/:id', function(request,response) {
  var id = request.params.id;







app.get('/recommendFor/:id', function(request,response) {
  var id = request.params.id;
  connectSQL();
  connection.query('SELECT * FROM `ratings`', function (error, results) {
    console.log("Updating Engine");
    results.forEach(function(user){
        if (user.rating <= 3)
          raccoon.disliked(user.userId, user.movieId, function () {
          });
        if (user.rating > 3)
          raccoon.liked(user.userId, user.movieId, function () {
          });
      });
  });
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.write('hello, i know nodejitsu.')
  response.end();
  });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

function connectSQL() {
  //Connect to MySQL database "filmy"
  connection.connect(function (err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
  });
}
module.exports = app;

