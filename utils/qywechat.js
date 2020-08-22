const axios = require('axios');

/**
 * 企业微信机器人消息推送封装
 */
class QyWechatRobotSender {
  constructor(url) {
    this.url = url;
  }


  /**
   * markdown
   * @param {string} title 标题
   * @param {string} content 内容
   */
  async sendMarkdown(title, content) {
    let payload = {
      msgtype: 'markdown',
      markdown: {
        content: '<font color=\\"warning\\">' + title + '</font>' + '修改内容:' + '<font>' + content + '</font>'
      }
    };

    let result = await this.send(payload);
    return result;
  }

  async sendTestMessage() {
    const title = '测试 - YAPI钉钉推送机器人';
    const text = '这是一条测试消息';
    return await this.sendMarkdown(title, text);
  }

  async send(data) {
    return await axios.post(this.url, data);
  }
}

module.exports = QyWechatRobotSender
