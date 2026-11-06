const bcrypt = require('bcryptjs');
const session = require('express-session');
const crypto = require('crypto');

module.exports = function addLogin(app, db) {
  app.use(session({
    // A new secret is generated when this demo server starts.
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'strict'
    }
  }));

  app.post('/api/login', async (req, res) => {
    try {
      const email = typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

      const password = typeof req.body.password === 'string'
        ? req.body.password
        : '';

      const user = db.prepare(
        'SELECT id, name, password_hash, role FROM users WHERE email = ?'
      ).get(email);

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({
          message: 'Incorrect email or password.'
        });
      }

      // Create a fresh session after a successful login.
      req.session.regenerate((error) => {
        if (error) {
          return res.status(500).json({
            message: 'Could not start your session.'
          });
        }

        req.session.user = {
          id: user.id,
          name: user.name,
          role: user.role
        };

        req.session.save((saveError) => {
          if (saveError) {
            return res.status(500).json({
              message: 'Could not save your session.'
            });
          }

          res.json({
            message: `Welcome, ${user.name}!`
          });
        });
      });
    } catch (error) {
      console.error('Login failed:', error.message);
      res.status(500).json({
        message: 'Login failed. Please try again.'
      });
    }
  });

  app.get('/api/session', (req, res) => {
    res.json({
      user: req.session.user || null
    });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({
          message: 'Could not log out.'
        });
      }

      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully.' });
    });
  });
};