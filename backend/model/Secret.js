const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const secretSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  secretName: {
    type: String,
    required: true
  },
  secrets: {
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  }
});

module.exports = mongoose.model('Secret', secretSchema);