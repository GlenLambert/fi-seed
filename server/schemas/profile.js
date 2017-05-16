'use strict';
const is = require('fi-is');

module.exports = (Schema) => {

  const schema = new Schema({

    email: {
      type: String,
      required: true,
      maxlength: 40
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    }

  }, {

    timestamps: true

  });

  schema.path('email').validate((val) => {
    return is.email(val);
  }, ':c el email está malo');

  return schema;
};