'use strict';

const debug = require('debug');

const CONSTS = component('consts');

const HTTP_METHOD_GET = CONSTS.METHODS.HTTP.GET;
const ROLE_ADMIN = CONSTS.ROLES.ADMIN;
const ROLE_USER = CONSTS.ROLES.USER;

const ROUTE_API_USERS_SIGNOUT = '/api/users/sign-out';

module.exports = {

  debug: debug('app:auth'),

  authorizer: (req) => {
    if (req.session.user && req.session.user.role) {
      return req.session.user.role;
    }

    return null;
  },

  routes: [{
    method: HTTP_METHOD_GET,
    path: ROUTE_API_USERS_SIGNOUT,
    allows: [
      ROLE_ADMIN, ROLE_USER
    ]
  }]

};
