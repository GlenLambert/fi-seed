'use strict';

const mongoose = require('mongoose');
const is = require('fi-is');

module.exports = (Schema) => {

  const schema = new Schema({

    hash: {
      type: String,
      unique: true,
      required: true
    },

    email: {
      type: String,
      required: true,
      maxlength: 40
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },

  }, {

    timestamps: true

  });

  function preValidateHash(next) {
    if (this.isNew) {
      this.hash = this.email + '@' + this.user;
    }
    next();
  }

  function postSaveUserCount(doc, next) {
    mongoose.model('user').update({_id: doc.user}, { $inc: {profilesCount: 1}})
    .then((raw) => {
      console.dir(raw, {colors: true, depth: 2});
      next();
    })
    /*.findOne().where('_id').equals(doc.user)
      .then((user) => {
        user.set('profilesCount', 1);
        user.save().then(() => {
          next();
        });
      })*/
      .catch((err) => {
        next(err);
      });
  }

  schema.path('email').validate((val) => {
    return is.email(val);
  }, ':c el email está malo');

  schema.pre('validate', preValidateHash);

  schema.post('save', postSaveUserCount);

  return schema;
};