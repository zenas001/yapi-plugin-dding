const yapi = require("yapi.js");
const DdingRobotModel = require("../ddingRobotModel");
const QywechatRobotModel = require("../qywechatRobotModel");
const ProjectModel = require("models/project");
const DdingRobotSender = require("./dding");
const QyWechatRobotSender = require("./qywechat");
const {HTMLParser, HTMLNodeToTextTranslater, HTMLNodeToMarkdownTranslater} = require("./html");
const Config = require("./config");

class SendLogViaDingDingSender {
  constructor(log) {
    this.log = log;
    this.dingdingModel = null;
    this.qywechatModel = null;
  }

  async send() {
    if (!this.log || !this.log.content || this.log.content.length == 0) {
      yapi.commons.log("yapi-plugin-dingding: 没有推送内容，跳过通知。");
      return;
    }

    await this.retrieveModels();
    let ignore = false;
    if (this.isNotNeedNotify()) {
      yapi.commons.log("yapi-plugin-dingding: 该项目未配置钉钉推送");
      ignore = true;
    }
    if (this.isQyNotNeedNotify()) {
      yapi.commons.log("yapi-plugin-qywechat: 该项目未配置企业微信推送");
      ignore = true;
    }
    if (ignore) {
      yapi.commons.log("跳过项目通知");
      return;
    }
    let node = HTMLParser.parse(this.log.content);
    this.addHostForNode(node);
    const projectName = await this.getProjectName(this.log.typeid);
    const title = `【${projectName}】${new HTMLNodeToTextTranslater().translate(node)}`;
    const text = new HTMLNodeToMarkdownTranslater().translate(node);
    if (this.dingdingModel && this.dingdingModel.hooks && this.dingdingModel.hooks.length > 0) {
      this.dingdingModel.hooks.forEach((url) => {
        const ddingsender = new DdingRobotSender(url);
        ddingsender.sendMarkdown(title, text);
        yapi.commons.log(`yapi-plugin-notify-dingding: 已推送。title=${title}, text=${text}`);
      });
    } else if (this.qywechatModel && this.qywechatModel.hooks && this.qywechatModel.hooks.length > 0) {
      this.qywechatModel.hooks.forEach((url) => {
        const qywechatsender = new QyWechatRobotSender(url);
        qywechatsender.sendMarkdown(title, text);
        yapi.commons.log(`yapi-plugin-notify-qywechat: 已推送。title=${title}, text=${text}`);
      });
    }
  }

  addHostForNode(node) {
    if (!node) {
      return;
    }
    if (node.type == "a") {
      let href = `${Config.instance.host}${node.getAttribute("href")}`;
      node.setAttribute("href", href);
    }
    node.children &&
    node.children.forEach((child) => {
      this.addHostForNode(child);
    });
  }

  async retrieveModels() {
    await this.retrieveDingDingModel();
    await this.retrieveQywechatModel();
  }

  async retrieveDingDingModel() {
    let Model = yapi.getInst(DdingRobotModel);
    this.dingdingModel = await Model.getByProejctId(this.log.typeid);
  }

  async retrieveQywechatModel() {
    let Model = yapi.getInst(QywechatRobotModel);
    this.qywechatModel = await Model.getByProejctId(this.log.typeid);
  }

  isNotNeedNotify() {
    return !(this.dingdingModel && this.dingdingModel.hooks && this.dingdingModel.hooks.length > 0);
  }

  isQyNotNeedNotify() {
    return !(this.qywechatModel && this.qywechatModel.hooks && this.qywechatModel.hooks.length > 0);
  }

  async getProjectName(projectId) {
    try {
      let model = yapi.getInst(ProjectModel);
      let proj = await model.get(projectId);
      return proj.name;
    } catch (e) {
      yapi.commons.log(`yapi-plugin-notify: 获取项目信息失败。 error = ${e.message || ''}`)
    }
  }
}

module.exports = {
  SendLogViaDingDingSender,
};
