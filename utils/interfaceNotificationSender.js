const yapi = require('yapi.js');
const UserModel = require('models/user');
const ProjectModel = require('models/project');
const DdingRobotModel = require('../ddingRobotModel');
const QywechatRobotModel = require('../qywechatRobotModel')
const DdingRobotSender = require('./dding');
const QyWechatRobotSender = require('./qywechat');
const Markdown = require('./markdown');
const Config = require('./config');

class InterfaceNotificationSender {

  constructor(interfaceModel, type) {
    this.interfaceModel = interfaceModel;
    // type 可以为 'create', 'update' 或者 'delete'
    this.type = type;
  }

  async send() {
    await this.retrieveDdingModel();
    await this.retrieveQywechatModel();
    if (this.isNotNeedNotify()) {
      return false;
    }

    await this.init();
    if (this.dding.hooks.length > 0) {
      this.dding.hooks.forEach(async (url) => {
        await this.sendTo(url);
      });
    } else if (this.qywechat.hooks.length > 0) {
      this.qywechat.hooks.forEach(async (url) => {
        await this.sendTo(url);
      });
    } else {
      return false;
    }
    return true;
  }

  async init() {
    await this.retrieveUser();
    await this.retrieveProject();
  }

  async sendTo(url) {
    const title = this.buildTitle();
    const text = this.buildText();
    //根据hook地址来判断
    //https://oapi.dingtalk.com 钉钉
    //https://qyapi.weixin.qq.com 企业微信
    if (url.contains('https://oapi.dingtalk.com')) {
      let didngsender = new DdingRobotSender(url);
      await didngsender.sendMarkdown(title, text);
    } else {
      let qywechatsender = new QyWechatRobotSender(url);
      await qywechatsender.sendMarkdown(title, text);
    }
  }

  buildTitle() {
    const userName = this.user ? this.user.username : '有人';
    let pieces = [userName];
    const action = this.type == 'create' ? '创建' : (this.type == 'update' ? '更新' : '删除');
    pieces.push(action, `了接口 [${this.interfaceModel.title}]`);
    return pieces.join('');
  }

  buildText() {
    let pieces = [
      Markdown.head3(this.buildTitle()), Markdown.NewLine,
      '接口: ', Markdown.link(this.interfaceLink(), this.interfaceModel.title), Markdown.NewLine,
      '项目: ', Markdown.link(this.projectLink(), this.project.name), Markdown.NewLine,
    ];

    if (this.user) {
      pieces.push('用户: ', this.user.username, Markdown.NewLine)
    }

    return pieces.join('');
  }

  interfaceLink() {
    return `${Config.instance.host}/project/${this.interfaceModel.project_id}/interface/api/${this.interfaceModel._id}`;
  }

  projectLink() {
    return `${Config.instance.host}/project/11/interface/api`;
  }

  async retrieveDdingModel() {
    let DdingModel = yapi.getInst(DdingRobotModel);
    this.dding = await DdingModel.getByProejctId(this.interfaceModel.project_id)

  }

  async retrieveQywechatModel() {
    let QywechatModel = yapi.getInst(QywechatRobotModel);
    this.qywechat = await QywechatModel.getByProejctId(this.interfaceModel.project_id)
  }

  async retrieveUser() {
    let userInst = yapi.getInst(UserModel);
    const uid = this.type == 'create' ? this.interfaceModel.uid : this.interfaceModel.edit_uid;
    this.user = await userInst.findById(uid);
  }

  async retrieveProject() {
    let projectInst = yapi.getInst(ProjectModel);
    this.project = await projectInst.get(this.interfaceModel.project_id);
  }

  isNotNeedNotify() {
    return !((this.dding && this.dding.hooks && (this.dding.hooks.length > 0)) && (this.qywechat && this.qywechat.hooks && (this.qywechat.hooks.length > 0)));
  }
}

module.exports = InterfaceNotificationSender;
