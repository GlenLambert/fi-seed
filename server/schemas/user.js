'use strict';

const CONSTS = require('fi-consts');

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

  /**
   * Hook that will run before updating **SEE: schema.pre()
   * Doesn't really do anything at the moment
   */
  function preUpdate(next) {
    //console.dir(this, {colors: true, depth: 1});
    next();
  }

  /**
   * Static function (just an exposed function that's part of the model)
   * Returns an array of all the profiles linked to a single given user ID
   */
  function findProfiles(user) {
    return this.model('profile').where('user').equals(user);
  }

  /**
   * Virtual field that returns true or false depending on the existence of profiles associated to the user
   * (SEE: schema.virtual)
   */
  function hasProfiles() {
    return !!this.profilesCount;
  }

  /**
   * Virtual field that returns true if there are more than 1 profiles associated to the user
   * (SEE: schema.virtual)
   */
  function hasManyProfiles() {
    return this.profilesCount > 1;
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
  schema.static('findProfiles', findProfiles); //This line exposes the static 'findProfiles' method

  schema.virtual('hasProfiles').get(hasProfiles); //This line sets a 'virtual' path for the model that takes the returned value of the 'hasProfiles' function
  schema.virtual('hasManyProfiles').get(hasManyProfiles);  //This line sets another 'virtual' path that takes the returned value of the 'hasManyProfiles' function

  return schema;

};