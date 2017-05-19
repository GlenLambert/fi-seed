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
      //console.dir(this, {colors: true, depth: 1});
    }
    next();
  }

  function postSaveUserCount(doc, next) {
    mongoose.model('user').update({_id: doc.user}, { $inc: {profilesCount: 1}})
    .then(() => {
      next();
    })
    .catch((err) => {
      next(err);
    });
  }

  function preUpdate(next) {
    //console.dir(this, {colors: true, depth: 1});
    next();
  }

  schema.path('email').validate((val) => {
    return is.email(val);
  }, ':c el email está malo');

  schema.pre('validate', preValidateHash);
  schema.pre('update', preUpdate);
  schema.pre('findOneAndUpdate', preUpdate);

  schema.post('save', postSaveUserCount);

  return schema;
};