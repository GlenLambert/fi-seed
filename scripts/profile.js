'use strict';

require('../server/globals')(global);
require('colors');

const CONSTS = require('fi-consts');

const Chance = require('chance');
const chance = new Chance();

const WORD = {
  length: 8
};

const mongoose = require('mongoose');
const path = require('path');

const connectionScript = require(path.join(__serverdir, 'config', 'database'));

mongoose.Promise = Promise;

CONSTS.load(config('consts'));

const profileFilePath = path.join(__serverdir, 'schemas', 'profile');
const profileSchema = require(profileFilePath)(mongoose.Schema);

const userFilePath = path.join(__serverdir, 'schemas', 'user');
const userSchema = require(userFilePath)(mongoose.Schema);

mongoose.model('profile', profileSchema);
mongoose.model('user', userSchema);

const Profile = mongoose.model('profile');
const User = mongoose.model('user');

function smartLog() {
  for (let i = 0; i < arguments.length; i++) {
    let argument = arguments[i];

    console.dir(argument, {
      colors: true,
      depth: 2
    });
  }
}

function randomAlpha(length) {
  WORD.length = length || WORD.length;
  return chance.word(WORD);
}

function randomName(gender, middle) {
  return chance.name({
    gender: gender || 'male',
    middle: !middle
  });
}

const rdmEmail = randomAlpha(10) + '@mailinator.com';
const rdmName = randomName();

connectionScript()
.then(() => {
  console.log('\nDoing stuff...');

  return User.create({
    name: rdmName,
    email: rdmEmail,
    password: '12345678',
    gender: 'GENDER.MALE'
  })

  .then((user) => {
    console.log(user.hasProfiles);
    return Profile.create({
      user: user._id,
      email: rdmEmail,
      functions: [
        {
          name: 'Cortar pasto',
          description: 'Cortar el pasto con mucho cuidado'
        },
        {
          name: 'Regar',
          description: 'Distribuir agua sobre la tierra'
        }
      ]
    });
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

  .then((profile) => {
    return Profile.findOne().where('user').equals(profile.user).populate('user'); //The populate() method assigns the returned document to the 'user' path of the profile.
  })

  .then((profile) => {

    var QUERY = {
      user: profile.user
    };

    var UPDATE = {
      $push: {
        functions: {
          name: 'Pushear función',
          description: 'Agregar una función al array de funciones'
        }
      }
    };

    var OPTIONS = {
      new: true
    };

    return Profile.findOneAndUpdate(QUERY, UPDATE, OPTIONS);
  })

  .then((profile) => {
    smartLog('hash: ', profile.hash);
    smartLog('user name: ', profile.user.name);
    smartLog('user has profiles', profile.user.hasProfiles);
    smartLog('Upon creation, is profile enabled??: ', profile.isEnabled);
    console.log('Profile functions so far:', profile.functions);
    return profile;
  })

  .then((profile) => {

    var QUERY = {
      user: profile.user
    };

    var UPDATE = {
      $pull: {
        functions: {
          name: 'Regar'
        }
      }
    };

    var OPTIONS = {
      new: true
    };

    return Profile.findOneAndUpdate(QUERY, UPDATE, OPTIONS);
  })

  .then((profile) => {
    console.log('\nProfile functions after pull:', profile.functions);

    var QUERY = {
      user: profile.user
    };

    var UPDATE = {
      $set: {
        disabledAt: new Date
      }
    };

    var OPTIONS = {
      new: true
    };

    console.log('Profile will be disabled...............');
    return Profile.findOneAndUpdate(QUERY, UPDATE, OPTIONS);
  })

  .then((profile) => {
    console.log('Profile Enabled:', profile.isEnabled);

    var QUERY = {
      user: profile.user
    };

    var UPDATE = {
      $unset: {
        disabledAt: ''
      }
    };

    var OPTIONS = {
      new: true
    };

    console.log('Profile will be enabled again............');
    return Profile.findOneAndUpdate(QUERY, UPDATE, OPTIONS);
  })

  .then((profile) => {
    console.log('Profile Enabled:', profile.isEnabled);
  });
})

.catch((err) => {
  console.log(err);
});