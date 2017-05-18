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

const testId = '591c71390f068261884ac4de';

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
  smartLog('\nDoing stuff...');

  return User.create({
    name: rdmName,
    email: rdmEmail,
    password: '12345678',
    gender: 'GENDER.MALE'
  })

  .then((user) => {
    return Profile.create({
      user: user._id,
      email: rdmEmail
    });
  })

  .then((res) => {
    return Profile.findOne().where('user').equals(res.user).populate('user');
  })

  .then((profile) => {
    smartLog('hash: ', profile.hash);
    smartLog('user name: ', profile.user.name);
    smartLog('user: ', profile.user);
    return profile;
  })

  .then((res) => {
    return User.findProfiles(res.user._id)//testId)
    .then((raw) => {
      console.log('findProfiles: ', raw);
    });
  });
})

.catch((err) => {
  console.log(err);
});