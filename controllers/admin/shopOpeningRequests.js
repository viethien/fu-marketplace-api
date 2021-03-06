'use strict';

var _ = require('lodash');
var models = require('../../models');
var ShopOpeningRequest = models.ShopOpeningRequest;
var User = models.User;
var errorHandlers = require('../helpers/errorHandlers');
var logger = require('../../libs/logger');

const DEFAULT_PAGE_SIZE = 10;

exports.getShopOpeningRequests = (req, res) => {
  let shopOpeningRequestQuery;
  let size = _.toNumber(req.query.size);
  let page = _.toNumber(req.query.page);
  let perPage = size > 0 ? size : DEFAULT_PAGE_SIZE;
  let offset = page > 0 ? (page - 1) * perPage : 0;

  if (req.query.showAll) {
    shopOpeningRequestQuery = ShopOpeningRequest;
  } else {
    shopOpeningRequestQuery = ShopOpeningRequest.scope('pending');
  }

  shopOpeningRequestQuery.findAll({
    include: User,
    limit: perPage,
    offset: offset,
    order: [['id', 'DESC']]
  }).then(shops => {
    let result = _.map(shops, s => {
      let shop = s.toJSON();
      let sellerInfo = s.User.getAllSellerInfo();
      delete shop['User'];
      shop['seller'] = sellerInfo;
      return shop;
    });

    res.json({
      shopOpeningRequests: result
    });
  });
};

exports.postAcceptShopOpeningRequest = (req, res) => {
  let requestId = parseInt(req.params.id);
  let adminMessage = req.body.message;

  if (!_.isNumber(requestId)) {
    errorHandlers.responseError(
      400,
      'Missing Id of Shop Opening Request',
      'params',
      res
    );
    return;
  }

  ShopOpeningRequest.findById(requestId).then(sor => {
    if (!sor) {
      errorHandlers.responseError(
        404,
        'Shop Opening request not found.',
        'models',
        res
      );
      return;
    }

    if (sor.status === ShopOpeningRequest.STATUS.PENDING) {
      sor.accept(adminMessage)
        .then(() => {
          res.status(200).end();
        })
        .catch(err => {
          logger.error(err);
          errorHandlers.responseError(
            500,
            JSON.stringify(err),
            'internal',
            res
          );
        });
    } else {
      errorHandlers.responseError(
        400,
        'Not a pending request',
        'params',
        res
      );
    }
  });
};

exports.postRejectShopOpeningRequest = (req, res) => {
  let requestId = parseInt(req.params.id);
  let adminMessage = req.body.message;

  if (!_.isNumber(requestId)) {
    errorHandlers.responseError(
      400,
      'Missing Id of Shop Opening Request',
      'params',
      res
    );
    return;
  }

  ShopOpeningRequest.findById(requestId).then(sor => {
    if (!sor) {
      errorHandlers.responseError(
        404,
        'Shop Opening request not found.',
        'models',
        res
      );
      return;
    }

    if (sor.status === ShopOpeningRequest.STATUS.PENDING) {
      sor.reject(adminMessage)
        .then(() => {
          res.status(200).end();
        })
        .catch(err => {
          logger.error(err);
          errorHandlers.responseError(
            500,
            JSON.stringify(err),
            'internal',
            res
          );
        });
    } else {
      errorHandlers.responseError(
        400,
        'Not a pending request',
        'params',
        res
      );
    }
  });
};
