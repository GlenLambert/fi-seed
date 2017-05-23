'use strict';

const mongoose = require('mongoose');
const CONSTS = require('fi-consts');
const is = require('fi-is');



module.exports = (Schema) => {

  const PROFILE_FUNCTION = new Schema({
    name: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    }
  });

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

    role: {
      type: String,
      default: CONSTS.ROLES.USER,
      required: true,
      enum: [
        CONSTS.ROLES.ADMIN,
        CONSTS.ROLES.USER
      ]
    },

    shift: {
      startsAt: {
        type: Number,
        default: 8,
        min: 7,
        max: 9
      },

      endsAt: {
        type: Number,
        default: 18,
        min: 14,
        max: 20
      }
    },

    disabledAt: Date,

    functions: [PROFILE_FUNCTION]

    statusHistory

  }, {

    timestamps: true

  });

  /**
   * Hook that will run before validation **SEE: schema.pre()
   * Creates a hash string using a profile's email and a user id
   */
  function preValidateHash(next) {
    if (this.isNew) { //isNew evaluates to true if the document is a newly created one (i.e. it didn't exist before in the DB, thus not an update)
      this.hash = this.email + '@' + this.user;
      //console.dir(this, {colors: true, depth: 1});
    }
    next();
  }

  /**
   * Hook that will run after insertion **SEE: schema.post()
   * Increases the 'profilesCount' user model attribute for the associated user document by 1
   */
  function postSaveUserCount(doc, next) {
    mongoose.model('user').update({_id: doc.user}, { $inc: {profilesCount: 1}})
    .then(() => {
      next();
    })
    .catch((err) => {
      next(err);
    });
  }

  /**
   * Hook that will run before updating **SEE: schema.pre()
   * Pushes a history object into the statusHistory array, represents historical changes on enabling and disabling
   */
  function preUpdate(next) {

    next();
  }

  /**
   * Checks if the disabledAt attribute has been defined or not
   */
  function isEnabled() {
    return !this.disabledAt;
  }

  schema.path('email').validate((val) => {
    return is.email(val);
  }, ':c el email está malo');

  schema.pre('validate', preValidateHash); //This line determines that preValidateHash function will run before validation ('validate')
  schema.pre('update', preUpdate); //This line determines that preUpdate function will run before any update ('update')
  schema.pre('findOneAndUpdate', preUpdate); //This line determines that preUpdate function will run before 'findOneAndUpdate' operations for this schema

  schema.post('save', postSaveUserCount); // This line determines that postSaveUserCount function will run after insertion ('save')

  schema.virtual('isEnabled').get(isEnabled);

  return schema;
};