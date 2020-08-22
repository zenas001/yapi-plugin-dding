const yapi = require('yapi.js');
const mongoose = require('mongoose');
const ddingcontroller = require('./ddingcontroller');
const qywechatcontroller = require('./qywechatcontroller');
const InterfaceNotificationSender = require('./utils/interfaceNotificationSender');
const InterfaceModel = require('models/interface');
const Config = require('./utils/config');
const {SendLogViaDingDingSender} = require('./utils/logSender');

module.exports = function (options) {
  Config.instance = options;

  const originalSaveLog = this.commons.saveLog;

  this.commons.saveLog = function () {
    const args = Array.prototype.slice.call(arguments);
    originalSaveLog.apply(this, args);
    try {
      yapi.commons.log('yapi-plugin-dingding: 开始运行');
      const logData = args[0];
      if (!logData || logData.type != 'project') {
        yapi.commons.log('yapi-plugin-dingding: 日志不是 project 类型，跳过通知。');
        return;
      }
      (new SendLogViaDingDingSender(logData)).send().then().catch((err) => {
        yapi.commons.log(err, 'error');
      });
    } catch (err) {
      yapi.commons.log(err, 'error');
    }
  }

  yapi.connect.then(function () {
    let db = mongoose.connection.db;
    db.collection('dding_robots').createIndex({
      project_id: 1
    });
    db.collection('qywechat_robots').createIndex({
      project_id: 1
    })
  });

  this.bindHook('add_router', function (router) {
    router({
      controller: ddingcontroller,
      method: 'get',
      path: 'dding_robots/detail',
      action: 'show'
    });

    router({
      controller: ddingcontroller,
      method: 'post',
      path: 'dding_robots/up',
      action: 'update'
    });

    router({
      controller: ddingcontroller,
      method: 'post',
      path: 'dding_robots/test',
      action: 'test'
    });
  });
  this.bindHook('add_router', function (router) {
    router({
      controller: qywechatcontroller,
      method: 'get',
      path: 'qywechat_robots/detail',
      action: 'show'
    });

    router({
      controller: qywechatcontroller,
      method: 'post',
      path: 'qywechat_robots/up',
      action: 'update'
    });

    router({
      controller: qywechatcontroller,
      method: 'post',
      path: 'qywechat_robots/test',
      action: 'test'
    });

  });
}
