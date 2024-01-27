const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if(!authHeader?.startsWith('Bearer ')) 
    return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  // console.log(token);
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if(err) {
        console.log("got error in jwt")
        res.json({message: err.message})
        return res.sendStatus(403);
      }
      req.user = decoded.UserInfo.username;
      next();
    }
  )
}

module.exports = verifyJWT;