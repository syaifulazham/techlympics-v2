var express = require('express');
const cookieParser = require('cookie-parser');

const axios = require('axios');

var mysql = require('mysql');
var router = express.Router();

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const bodyParser = require('body-parser');

const auth = require('./auth');

const CLIENT_ID = auth.auth()['google'].clientid;
const CLIENT_SECRET = auth.auth()['google'].secret;
const REDIRECT_URI = auth.auth()['google'].callback;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

//----------------------------------AUTHENTICATION---------------------------------------------
// Define the route that initiates the authentication flow
router.get('/auth/google', (req, res) => {
  const SCOPES = ['openid', 'email', 'profile'];
  const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES.join(' ') });
  res.redirect(authUrl);
});

// Define the route that handles the callback from Google
router.get('/auth/google/callback', (req, res) => {
  const code = req.query.code;

  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Error getting token:', err);
      res.redirect('/login');
    } else {
      oauth2Client.setCredentials(tokens);

      // Use the tokens to make API calls or access user data.
      const peopleApi = google.people({ version: 'v1', auth: oauth2Client });
      peopleApi.people.get({ resourceName: 'people/me', personFields: 'names,emailAddresses,photos' }, (err, data) => {
        if (err) {
          console.error('Error calling People API:', err);
          res.redirect('/login');
        } else {
          // Render the user data in the EJS view
          //res.render('profile', { user: data.data });
          //console.log(data.data);
          var user = {
            displayName: data.data.names[0].displayName,
            email: data.data.emailAddresses[0].value,
            photo: data.data.photos[0].url,
            agent: 'google'
          }
          //req.session.username = data.data.emailAddresses[0].value;
          //req.session.user = user;
          var scr = generateSessionSecret();
          //req.session.secret = scr;
          res.cookie('localId', {user:user});

          console.log('Logged in: ',  data.data.emailAddresses[0].value, ' at ', new Date);
          //console.log('this is me: ',user);
          res.redirect('/user-panel');
          //res.status(200).send(true);
        }
      });
    }
  });
});