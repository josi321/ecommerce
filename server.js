var express = require('express'); // express is a library node module
var morgan = require('morgan'); // morgan library will log all the requst from users ex all the url routes they enter
var mongoose = require('mongoose'); // mongoose library
var bodyParser = require('body-parser'); // this allows postman to read files?
var ejs = require('ejs'); //to render data on webpage
var engine = require('ejs-mate'); // need this with ejs library, extension of ejs
var session = require('express-session'); // express uses cookies to store session id which is encryption signature- server side storage
var cookieParser = require('cookie-parser'); // parses cookies and puts the info in request objects in the middleware. takes session data and encrypts and passes it to browser
var flash = require('express-flash'); // flash depends on session and cookies, bc you want to save something that can be called upon again when requested
var MongoStore = require('connect-mongo')(session); //class that can be used to store sessions in MongoDB
var passport = require('passport');

var secret =require('./config/secret'); //requiring secret.js file
var User = require('./models/user'); // requiring the user.js file
var Category = require('./models/category'); //requiring category.js file


var cartLength = require('./middlewares/middlewares'); // requiring middleware.ejs file for cart icon function

var app = express(); //let app be express objects so you can you all of its methods

//connect the mongoose library to the path
mongoose.connect(secret.database, function(err){
  if(err) {
    console.log(err);
  } else {
    console.log("connected to the database");
  }
})

//middleware
app.use(express.static(__dirname + '/public')); // this is to use all the styles in public folder
app.use(morgan('dev')); //this is a middleware
app.use(bodyParser.json()); //so we can parse json data
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser()); // tells express to use the cookieParser
app.use(session({
  resave: true, // this saves the session storage, even if it wasnt modofied during the request
  saveUninitalized: true, //this save uninitalized (session that is new and unmodified) to memory
  secret: secret.secretKey, // "Josi!@##@" this can be random characters
  store: new MongoStore({url: secret.database , autoReconnect: true})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
  res.locals.user= req.user; // this is so that every route will have the user object
  next();
});
app.use(function(req, res, next){
  Category.find({}, function(err, categories){
    if (err) return next(err);
    res.locals.categories = categories;
    next();
  });
});
app.use(cartLength);

app.engine('ejs', engine); // using ejs mate engine
app.set('view engine', 'ejs');

//ROUTES: require and use them
var mainRoutes = require('./routes/main'); // require the main routes
var userRoutes = require('./routes/user'); //require the user routes
var adminRoutes = require('./routes/admin'); //require the admin routes
var apiRoutes = require('./api/api'); //require the api routes

app.use(mainRoutes); //use the main routes
app.use(userRoutes); //use the user routes
app.use(adminRoutes); // use the admin routes
app.use('/api', apiRoutes); // use the api routes



app.listen(secret.port, function(err){
  if (err) throw err;
  console.log("server is running on port" + secret.port);
});
