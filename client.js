import DdingRobotView from './views/form';
import QywechatRobotView from "./views/qyform";

module.exports = function () {
  this.bindHook('sub_setting_nav', (router) => {
    router.qywechat = {
        name: '企业微信',
        component: QywechatRobotView
      },
      router.dding = {
      name: '钉钉',
      component: DdingRobotView
    }
  })
}
