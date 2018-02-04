const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * User  Mongo DB model
 * @name userModel
 */
const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  email: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  tokens: Array,
  firebaseDeviceToken: Array,

  gender: {type: Number}, // 1: male, 2: female, 3: other
  avata: {type: String},
  firstName: {type: String},
  lastName: {type: String},
  address: {type: String},

  roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}],
  status: { type: Number }, // active, block, reported
  isOnline: { type: Boolean },
  rooms: [{type: mongoose.Schema.Types.ObjectId, ref: 'Room'}]
}, {timestamps: true, usePushEach: true});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;