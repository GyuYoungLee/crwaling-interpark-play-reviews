const request = require('request');
const cheerio = require('cheerio');
const charset = require('charset');
const iconv = require('iconv-lite');

module.exports = class Request {
  // 웹페이지 긁어오기
  downloadPage(options) {
    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (err) {
          console.error(err);
          resolve(downloadPage(options));
        }
        if (res.statusCode != 200) {
          console.log('Invalid status code <' + res.statusCode + '>');
          resolve(downloadPage(options));
        }
        const enc = charset(res.headers, body);
        const i_result = iconv.decode(body, enc);
        resolve(cheerio.load(i_result));
      });
    });
  }
};
