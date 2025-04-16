const jwt = require('jsonwebtoken');

function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msg: "No token provided" });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: "Invalid token format" });
  }

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

module.exports = authGuard;
