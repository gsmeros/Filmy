var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//My modules
var app = express();
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

//This is used to update the main rec engine
//and load Redis with data keys.
app.use('/update',function(request,response) {
  connectSQL();
  connection.query('SELECT * FROM `ratings`', function (error, results) {
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
      } else {
        console.log('All files have been processed successfully');
        response.send("Data imported into Redis");
      }
    });
    });
});
//Stats for Home page
app.get('/bestrated', function(request,response) {
  raccoon.bestRated(function (results) {
    response.send(results);
  });
});
app.get('/mostLiked', function(request,response) {
  raccoon.mostLiked(function (results) {
    response.send(results);
  });
});
//liked count for User .count in array of Liked movies
app.get('/likedCount/:id', function(request,response) {
  var userId = request.params.id;
  // returns an array of all the items that user has liked.
  raccoon.allLikedFor(userId, function(results){
      response.send(results);
  });
});
//same as liked
app.get('/allDislikedFor/:id', function(request,response) {
  var userId = request.params.id;
  // returns an array of all the items that user has liked.
  raccoon.allDislikedFor(userId, function(results){
    response.send(results);
  });
});

//Like user // movie
//and update Recommendation array and similar users after new input

app.get('/like/:userid/:movieid', function(request,response) {
  var movieId = request.params.movieid;
  var userId = request.params.userid;
  raccoon.liked(userId,movieId,function(){
    raccoon.recommendFor(userId,10,function(results) {
      raccoon.mostSimilarUsers(userId, function(res){
        response.send(results);
        response.end();
      });
    })
  })
});
//Dislike user // movie
app.get('/dislike/:userid/:movieid', function(request,response) {
  var movieId = request.params.movieid;
  var userId = request.params.userid;
  raccoon.disliked(userId,movieId,function(){
    raccoon.recommendFor(userId,10,function(results) {
      response.send(results);
    })
  })
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

