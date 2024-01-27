require('dotenv').config();
const express = require('express');
// import path from 'path';
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
let credentials = require('./middlewares/credentials');
let corsOptions = require('./config/corsOptions');
let connectDB = require('./config/dbConn');
const verifyJWT = require('./middlewares/verifyJWT');

const PORT = process.env.PORT || 3500;

const app = express();

// Connect to MongoDB
connectDB();

app.use(credentials);

// CORS
app.use(cors(corsOptions));

// built-in middleware for json
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

// routes
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));

app.use(verifyJWT)
var mrouter = express.Router();
mrouter.get('/',  (req, res) => {
  console.log('here');
  res.sendStatus(200)
});
app.use('/test', mrouter);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});