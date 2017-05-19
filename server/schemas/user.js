'use strict';

const CONSTS = require('fi-consts');

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const is = require('fi-is');

/* Genders */
const GENDER_FEMALE = CONSTS.GENDERS.FEMALE;
const GENDER_MALE = CONSTS.GENDERS.MALE;

/* Roles */
const ROLE_ADMIN = CONSTS.ROLES.ADMIN;
const ROLE_USER = CONSTS.ROLES.USER;

/* Password hashing rounds */
const HASH_ROUNDS = 8;

const PASSWORD = 'password';
const EMAIL = 'email';
const USER = 'user';

module.exports = (Schema) => {

  const schema = new Schema({

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: (val) => is.email(val)
    },

    password: {
      type: String,
      required: true
    },

    gender: {
      type: String,
      enum: [
        GENDER_FEMALE, GENDER_MALE
      ]
    },

    roles: {
      type: [String],
      default: [ROLE_USER],
      required: true,
      enum: [
        ROLE_ADMIN, ROLE_USER
      ]
    },

    profiles: {
      type: [Object]
    },

    profilesCount: {
      type: Number,
      default: 0
    }

  }, {

    timestamps: true

  });

  /**
   * Hash user's password before saving.
   */
  function preSavePassword(next) {
    if (!this.isModified(PASSWORD)) {
      next();
    }

    return bcrypt.hash(this.password, HASH_ROUNDS).then((hash) => {
      this.password = hash;
      next();
    }).catch(next);
  }

  /**
   * Hash user's password before updating.
   */
  function preUpdatePassword(next) {
    var update = this._update;

    if (!update.$set || !update.$set.password) {
      return next();
    }

    return bcrypt.hash(update.$set.password, HASH_ROUNDS).then((hash) => {
      this.update({}, {
        password: hash
      });

      next();
    }).catch(next);
  }

  function preUpdate(next) {
    //console.dir(this, {colors: true, depth: 1});
    next();
  }

  function findProfiles(user) {
    return this.model('profile').where('user').equals(user);
  }

  function hasProfiles() {
    return !!this.profilesCount;
    // if(findProfiles().count()) {
    //   return true;
    // } else {
    //   return false;
    // }
  }

  function hasManyProfiles() {
    // if(findProfiles().count() > 1) {
    //   return true;
    // } else {
    //   return false;
    // }
  }

  /**
   * Find a user by it's email (Promised).
   *
   * @param {String} email The email to filter by.
   *
   * @return {Promise}
   */
  function findByEmail(email) {
    return this.model(USER).findOne()
      .where(EMAIL).equals(email);
  }

  schema.pre('findOneAndUpdate', preUpdatePassword);
  schema.pre('update', preUpdatePassword);
  schema.pre('save', preSavePassword);
  schema.pre('update', preUpdate);

  schema.static('findByEmail', findByEmail);
  schema.static('findProfiles', findProfiles);

  schema.virtual('hasProfiles').get(hasProfiles);     //WRONGLY CODED
  schema.virtual('hasManyProfiles').get(hasManyProfiles); //BAD BAD SHIT

  return schema;

};