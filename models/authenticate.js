const jwt = require('jsonwebtoken');
// TODO: Update JWT_SECRET in .env file.

module.exports.authenticateToken = function (req, res, next) {
    // Gather the jwt access token from the request header
    //const authHeader = req.headers['authorization']
    //const token = authHeader && authHeader.split(' ')[1]
    let token = req.cookies.jwt;
    if (!token) {
      res.status(401); // if there isn't any token
      next();
      return;
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
          res.status(403);
          next();
          return;
        }
        req.payload = payload;
        res.status(200);
        next(); // pass the execution off to whatever request the client intended
      });
    }
    catch(e) {
      res.status(403);
      next();
      return;
    }
  }

  module.exports.generateToken = function (payload) {
    // TODO: Extend the expiry time on the jwt.
    if (payload.hasOwnProperty('exp')) {
      delete payload.exp;
    }
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: (process.env.JWT_EXPIRY)});
  }