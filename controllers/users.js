/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-param-reassign */
/* eslint-disable no-else-return */
/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */

// controllers/users.js
module.exports = (app) => {
  const jwt = require('jsonwebtoken');
  const UserSchema = require('../models/user');
  const _ = require('lodash');

  // Render the signup form
  app.get('/signup', (req, res) => {
    res.render('signup.hbs');
  });

  // POST: creates a new user
  app.post('/signup', (req, res, next) => {
    // CREATE User and JWT
    const user = new UserSchema(req.body);

    user.save()
      .then((savedUser) => {
        const token = jwt.sign({
          _id: savedUser._id,
        }, process.env.SECRET, {
          expiresIn: '120 days',
        });
        res.cookie('nToken', token, {
          maxAge: 900000,
          httpOnly: true,
        });
        // console.log(`user is: ${user}`);
        app.locals.user = user;
        res.redirect('/');
      })
      .catch(() => {
        const nextError = new Error('Email address already taken. Did you mean to login?');
        nextError.status = 422; // validation error
        return next(nextError);
      });
  });

  // LOGIN FORM
  app.get('/login', (req, res) => {
    res.render('login.hbs');
  });

  // LOGIN USER
  app.post('/login', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    // Look for this user name
    UserSchema.findOne({
      username,
    }, 'username password arrayOfFavoriteRecipes')
      .then((user) => {
        if (!user) {
          // User not found
          const nextError = new Error('User with that username does not exist');
          nextError.status = 401;
          return next(nextError);
        } else {
          // console.log(user)
          // Check the password
          user.comparePassword(password, (err, isMatch) => {
            console.log(isMatch);
            if (!isMatch) {
              const nextError = new Error('Incorrect password');
              nextError.status = 401;
              return next(nextError);
            } else {
              app.locals.user = user;
              // Create the token
              const token = jwt.sign({
                _id: user._id,
                username: user.username,
              }, process.env.SECRET, {
                expiresIn: '120 days',
              });
              // Set a cookie and redirect to root
              res.cookie('nToken', token, {
                maxAge: 900000,
                httpOnly: true,
              });
              console.log('Successfully logged in.');
              res.redirect('/dashboard');
            }
          });
        }
      })
      .catch(err => next(err));
  });

  // LOGOUT
  app.post('/logout', (req, res) => {
    res.clearCookie('nToken');
    app.locals.user = null;
    res.redirect('/'); // to automatically redirect back to the page the request came from
  });

  // DELETE USER ACCOUNT
  app.get('/delete-user', (req, res) => {
    res.render('delete-account');
  });

  app.post('/delete-user', (req, res, next) => {
    UserSchema.findByIdAndRemove(app.locals.user.id, req.body)
      .then((deletedUser) => {
        console.log('User account has been removed', deletedUser);
        app.locals.user = null;
        res.redirect('/');
      }).catch(err => next(err));
  });

  // UPDATE PASSWORD
  app.get('/update-password', (req, res) => {
    res.render('update-password');
  });

  app.post('/update-password', (req, res, next) => {
    UserSchema.findById(app.locals.user.id, (err, post) => {
      if (err) return next(err);

      _.assign(post, req.body); // update user
      // app.locals.user =
      console.log('post: ', post);
      post.save((error) => {
        if (error) return next(err);
        res.clearCookie('nToken');
        app.locals.user = null;
        res.redirect('login');
      });
    });
  });
};
