var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
const MongoClient = require('mongodb').MongoClient;
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');
var port = process.env.PORT || 8080;

app.set('superSecret', config.secret);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

MongoClient.connect('mongodb://nidhi:nidhi123@localhost:27017/?authSource=TodoApp', (err, db) => {
  if (err)
    throw err;
  console.log("connected to mongodb database");
// API to to insert records in User collection
  app.get('/setup',function(req,res){

      db.db('TodoApp').collection('User').insertOne({
                   name:'Nidhi',
                   password: 'password'

               },(err,result)=>{
                  if(err)
                  {
                      return console.log('unable to insert in todos',err);

                              }
                             console.log(JSON.stringify(result.ops,undefined,2));
               });
  });

  //get an instance of the router for api routes
  //IN THIS CODE IT IS NOT USED
  var apiRoutes = express.Router();

  // route to authenticate a user (POST http://localhost:8080/api/authenticate)
  //This api is not protected by token because we have not created middleware above it
  app.post('/authenticate', function (req, res) {

    // find the user
    console.log("started")
    db.db('TodoApp').collection('User').find({ name: req.body.name }).toArray(function (err, result) {
      if (err) throw (err);
      console.log('res', result);

      if (result.length === 0) {
        res.json({ success: false, message: 'Authentication failed. User not found.' });
      } else {
        let user = result[0];
        // check if password matches
        if (user.password != req.body.password) {
          res.json({ success: false, message: 'Authentication failed. Wrong password.' });
        } else {

          // if user is found and password is right
          // create a token with only our given payload
          // we don't want to pass in the entire user since that has the password
          const payload = {
            admin: user.admin
          };
          var token = jwt.sign(payload, app.get('superSecret'), {
            expiresIn: 10 // expires in 24 hours
          });

          // return the information including token as JSON
          res.json({
            success: true,
            message: 'Enjoy your token!',
            token: token

          });

          if (token) {
            jwt.verify(token, app.get('superSecret'), function (err, decode) {
              if (err) {
                return res.json({ success: false, message: 'Authentication failed' })
              }
              else {
                req.decode = decode;

              }
            })
          }
          else {
            return res.status(403).send({
              success: false,
              message: 'No token provided.'
            });
          }

        }
      }

    });
  });
  // creating middleware to verify token
  //create route middleware to protect the API
  //We won't want to protect the /api/authenticate route so what we'll do is place our middleware beneath that route. 
  //Order is important here.
  app.use(function (req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
      jwt.verify(token, app.get('superSecret'), function (err, decode) {
        if (err) {
          return res.json({ success: false, message: 'Authentication failed' })
        }
        else {
          req.decode = decode;
          next();
        }
      })
    }
    else {
      return res.status(403).send({
        success: false,
        message: 'No token provided.'
      });
    }
  });

  //after creating middleware call get request . we to provide token before getting responce.
  app.get('/abc', (req, res) => {
    return res.json({ msg: "hello I am here" });
  })

});

app.listen(port);
console.log('Magic happens at http://localhost:' + port);