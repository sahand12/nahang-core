const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fn: {
    type: String,
    alias: 'firstName',
    lowercase: true,
  },
  ln: {
    type: String,
    alias: 'lastName',
    lowercase: true,
  },
  nn: {
    type: String,
    alias: 'nickname',
  },
  em: {
    type: String,
    alias: 'email',
    required: true,
  },
  ps: {
    type: String,
    alias: 'password',
  },
  ph: {
    type: String,
    alias: 'phoneNumber',
    required: true,
  },
  socials: {
    gg: {
      alias: 'google',
    },
    ns: {
      alias: 'instagram',
    },
  },
  bd: {
    type: Date,
    alias: 'birthDate',
  },
  gd: {
    type: String,
    alias: 'gender',
    enum: ['male', 'female', 'other'],
  },
  cns: [{
    type: mongoose.Schema.Types.ObjectId,
    alias: 'bankCard',
    ref: 'bc',
  }],
  rl: {
    type: Array,
    alias: 'roles',
  },
  ia: {
    type: Boolean,
    alias: 'isActive',
    default: false, // will be set to true once the use has verified its email or phone number
  },
  cr: {
    type: Date,
    alias: 'createdAt',
    default: Date.now,
  },
  up: {
    type: Date,
    alias: 'updatedAt',
    default: Date.now,
  },
  rpt: {
    type: String,
    alias: 'resetPasswordToken',
  },
  rpe: {
    type: Date,
    alias: 'resetPasswordExpires'
  },
  ads: {
    alias: 'addresses'
  }
});

userSchema.statics.encryptPassword = async function encryptPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
  catch (err) {
    return err;
  }
};

userSchema.statics.validatePassword = function validatePassword(password, hash) {
  return bcrypt.compare(password, hash);
};

userSchema.index({em: 1}, {unique: true});
userSchema.index({ph: 1}, {unique: true});
userSchema.index({'socials.gg.id': 1});
userSchema.index({'socials.ns.id': 1});

module.exoprts = userSchema;
