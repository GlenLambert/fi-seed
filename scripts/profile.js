'use strict';

require('../server/globals')(global);
require('colors');

const CONSTS = require('fi-consts');
const Chance = require('chance');
const mongoose = require('mongoose');
const path = require('path');

const chance = new Chance();

mongoose.Promise = Promise;

CONSTS.load(config('consts'));

const connectionScript = require(path.join(__serverdir, 'config', 'database'));

const profileFilePath = path.join(__serverdir, 'schemas', 'profile');
const profileSchema = require(profileFilePath)(mongoose.Schema);

const userFilePath = path.join(__serverdir, 'schemas', 'user');
const userSchema = require(userFilePath)(mongoose.Schema);

mongoose.model('profile', profileSchema);
mongoose.model('user', userSchema);

const WORD = {
  length: 8
};

const OPTIONS = {
  new: true
};

/**
 * Me so smart.
 */
function smartLog() {
  for (let i = 0; i < arguments.length; i++) {
    let argument = arguments[i];

    console.dir(argument, {
      colors: true,
      depth: 2
    });
  }
}

/**
 * Generates a random word
 */
function randomAlpha(length) {
  WORD.length = length || WORD.length;
  return chance.word(WORD);
}

/**
 * Generates a random human name.
 */
function randomName(gender, middle) {
  return chance.name({
    gender: gender || 'male',
    middle: !middle
  });
}

/**
 * Main script, connects to the DB and THEN heaps of fancy things happen...
 */
connectionScript().then(() => {
  console.log('\nDoing stuff...');

  /* Load Mongoose models */
  const Profile = mongoose.model('profile');
  const User = mongoose.model('user');

  /* Generate random data values */
  const rdmEmail = randomAlpha(10) + '@mailinator.com';
  const rdmName = randomName();

  var data = {
    name: rdmName,
    email: rdmEmail,
    password: '12345678',
    gender: 'GENDER.MALE'
  };

  /**
   * Create a user
   */
  return User.create(data)

    /**
     * Creates a profile associated to the recently created user
     */
    .then((user) => {
      console.log(user.hasProfiles); //Logs value of virtual field 'hasProfiles' (SEE user Schema)

      var data = {
        user: user._id,
        email: rdmEmail,
        functions: [{
          name: 'Cortar pasto',
          description: 'Cortar el pasto con mucho cuidado'
        }, {
          name: 'Regar',
          description: 'Distribuir agua sobre la tierra'
        }]
      };

      return Profile.create(data);
    })

    /**
     * Uncomment the following block to create another profile associated to the same user.
     */
    // .then((profile) => {
    //   return Profile.create({
    //     user: profile.user,
    //     email: 'ai' + rdmEmail
    //   });
    // })

    .then(profile => Profile.findOne() //Implicit return (when no block, it assumes it is a return)
      .where('user').equals(profile.user)

      //The populate() method assigns the query matching document to the 'user' path of the profile.
      .populate('user'))

    /**
     * Push a new function into the profile's functions array using the $push operator
     */
    .then((profile) => {
      smartLog('hash: ', profile.hash);
      smartLog('user name: ', profile.user.name);
      smartLog('user has profiles', profile.user.hasProfiles); //Logs populated 'user' fields

      var query = {
        user: profile.user
      };

      var update = {
        $push: {
          functions: {
            name: 'Pushear función',
            description: 'Agregar una función al array de funciones'
          }
        }
      };

      return Profile.findOneAndUpdate(query, update, OPTIONS);
    })

    /**
     * Delete a function from the profile's function array using the $pull operator
     */
    .then((profile) => {
      smartLog('Upon creation, is profile enabled??: ', profile.isEnabled); //Prints out the value of the virtual attribute 'isEnabled' (SEE profile Schema)

      console.log('Profile functions so far:', profile.functions);  //Prints out functions array before pull

      var query = {
        user: profile.user
      };

      var update = {
        $pull: {
          functions: {
            name: 'Regar'
          }
        }
      };

      return Profile.findOneAndUpdate(query, update, OPTIONS);
    })

    /**
     * 'Disable profile' by setting its 'disabledAt' attribute with the current date
     */
    .then((profile) => {
      console.log('\nProfile functions after pull:', profile.functions); //Prints out relevant info from last promise's result

      var query = {
        user: profile.user
      };

      var update = {
        $set: {
          disabledAt: new Date()
        }
      };

      console.log('Profile will be disabled...............');

      return Profile.findOneAndUpdate(query, update, OPTIONS);
    })

    /**
     * 'Enable profile' by unsetting its 'disabledAt' attribute
     */
    .then((profile) => {
      console.log('Profile Enabled:', profile.isEnabled); //Prints out relevant info from last promise's result

      var query = {
        user: profile.user
      };

      var update = {
        $unset: {
          disabledAt: 1 //Given the truthy value of a non-zero number, this line basically assigns 'true' to the attribute to be unset with the $unset operator
        }
      };

      console.log('Profile will be enabled again............');

      return Profile.findOneAndUpdate(query, update, OPTIONS);
    })

    /**
     * Update a single profile function by its _id attribute
     */
    .then((profile) => {
      console.log('Profile Enabled:', profile.isEnabled); //Prints out relevant info from last promise's result

      var query = {
        'functions._id': profile.functions[0]._id
      };

      var update = {
        $set: {
          'functions.$.name': 'Cut the grass'
        }
      };

      return Profile.findOneAndUpdate(query, update, OPTIONS);
    })

    .then((profile) => {
      console.log('UPDATE RESULT:', profile); //Prints out relevant info from last promise's result

      process.exit(0);
    });

}).catch((err) => {
  console.log(err);
});