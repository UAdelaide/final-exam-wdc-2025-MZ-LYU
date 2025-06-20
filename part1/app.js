const mysql = require('mysql2/promise');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'dogwalkservice'
};


app.get('/api/dogs', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username
       FROM Dogs
       JOIN Users ON Dogs.owner_id = Users.user_id`
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT WalkRequests.request_id, Dogs.name AS dog_name, WalkRequests.requested_time, WalkRequests.duration_minutes, WalkRequests.location, Users.username AS owner_username
       FROM WalkRequests
       JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
       JOIN Users ON Dogs.owner_id = Users.user_id
       WHERE WalkRequests.status = 'open'`
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/walkers/summary', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query(
      `SELECT Users.username AS walker_username, COUNT(WalkRatings.rating) AS total_ratings, AVG(WalkRatings.rating) AS average_rating, COUNT(WalkRequests.request_id) AS completed_walks
       FROM Users
       LEFT JOIN WalkApplications ON Users.user_id = WalkApplications.walker_id
       LEFT JOIN WalkRequests ON WalkApplications.request_id = WalkRequests.request_id AND WalkRequests.status = 'completed'
       LEFT JOIN WalkRatings ON WalkRequests.request_id = WalkRatings.request_id
       WHERE Users.role = 'walker'
       GROUP BY Users.username`
    );
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;