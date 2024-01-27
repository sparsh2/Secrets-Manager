const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
  const {user, password} = req.body;
  if (!user || !password) {
    return res.status(400).json({
      'message' : 'Username and password are required'
    });
  }

  const foundUser = await User.findOne({username: user}).exec();
  if (!foundUser) return res.sendStatus(401);

  // eval password
  const match = await bcrypt.compare(password, foundUser.password);
  if(match) {
    const accessToken = jwt.sign(
      {
        "UserInfo": {
          "username": foundUser.username
        }
      }, process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '100s' }
    );
    const refreshToken = jwt.sign(
      {"username": foundUser.username},
      process.env.REFRESH_TOKEN_SECRET,
      {expiresIn: '1d'}
    );

    // Save refreshToken with current user
    foundUser.refreshToken = refreshToken;
    const result = await foundUser.save();
    console.log(result);
    
    // Set refresh token in the cookie
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24*60*60*1000
    });

    // Send access token to user
    res.json({accessToken})
  } else {
    res.sendStatus(401);
  }
}

module.exports = { handleLogin };