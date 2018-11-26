const cheerio = require('cheerio');
const { URL } = require('url');
const Request = require('./request');

const request = new Request();

module.exports = class Crawling {
  // 1.PLAYDB 공연랭킹 크롤링하기
  async downloadListPage(pageNo = 1) {
    const url = `http://www.playdb.co.kr/playdb/playdblist.asp?Page=${pageNo}&sReqMainCategory=000005&sReqSubCategory=&sReqDistrict=&sReqTab=3&sPlayType=1&sStartYear=2017&sSelectType=3`;
    const options = { url, encoding: null };

    try {
      return await request.downloadPage(options);
    } catch (err) {
      console.error(err);
    }
  }

  // 1-1.PLAYDB 공연랭킹에서 총 페이지수 파싱하기
  parsePageCnt($$) {
    const pageCntEl = '#contents > div.container1 > table > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(35) > td';

    return Number(
      $$(pageCntEl)
        .text()
        .split('/')[1]
        .replace(']', '')
        .trim()
    );
  }

  // 1-2.PLAYDB 공연랭킹에서 각 공연의 playID 파싱하기
  parsePlayIDs($$) {
    const perfListEl = '#contents > div.container1 > table > tbody > tr:nth-child(11) > td > table > tbody > tr';
    const childEl = 'td > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(1) > td > b > font > a';
    const detailUrl = 'http://www.playdb.co.kr/playdb/playdbDetail.asp';

    const playList = [];
    $$(perfListEl)
      .filter((i, el) => {
        return i > 1 && i % 2 == 0 && i < 32;
      })
      .map((i, el) => {
        return $$(el).find(childEl);
      })
      .each((i, el) => {
        const name = $$(el)
          .text()
          .trim();

        const id_playdb = $$(el)
          .attr('onclick')
          .split("'")[1]
          .trim();

        //   console.log(`===================  No: ${i + 1}`);
        //   console.log('name:', name);
        //   console.log('id_playdb:', id_playdb);
        playList[i] = {};
        playList[i].name = name;
        playList[i].id_playdb = id_playdb;
        playList[i].detailUrl = `${detailUrl}?sReqPlayno=${id_playdb}`;
      });
    return playList;
  }

  // 2.PLAYDB 공연 상세정보 크롤링하기
  async downloadDetailPage(url) {
    const options = { url, encoding: null };

    try {
      return await request.downloadPage(options);
    } catch (err) {
      console.error(err);
    }
  }

  // 2-1.PLAYDB 공연 상세정보에서 인터파크 공연 상품코드 파싱하기
  parseGoodsCode($$) {
    const reviewElContainer = '#DivBasic > div > div.detail_contentsbox2 > table > tbody > tr:nth-child(2) > td';
    const reviewEl = $$(reviewElContainer).find('div > div.title > a');
    if (reviewEl.length === 0) return 0;

    const reviewUrl = $$(reviewEl).attr('href');
    const myURL = new URL(reviewUrl);
    const reviewGoodsCode = myURL.searchParams.get('GoodsCode');
    return reviewGoodsCode;
  }

  // 3.인터파크 공연 리뷰 크롤링하기
  async downloadReviewPage(goodsCode, pageNo = 1) {
    const pUrl = `http://ticket.interpark.com/Ticket/Goods/GoodsInfo.asp?GoodsCode=${goodsCode}&TabIndex=1#TabTop`;
    const cUrl = `http://ticket.interpark.com/Ticket/Goods/ifrGoodsReview.asp?bbsno=2&GoodsCode=${goodsCode}&pageno=${pageNo}`;
    const options = { url: cUrl, encoding: null, headers: { Referer: pUrl } };

    try {
      return await request.downloadPage(options);
    } catch (err) {
      console.error(err);
    }
  }

  // 3-1.인터파크 공연 리뷰에서 총 페이지수 파싱하기
  parseReviewCnt($$) {
    const reviewCntEl = 'body > div > div.Review_Wrap > div.Rv_Title_Wrap > div.Title > h3 > span';
    const reviewCnt = $$(reviewCntEl)
      .text()
      .trim();
    return reviewCnt;
  }

  // 3-2.인터파크 공연 리뷰에서 각 공연의 리뷰와 평점 파싱하기
  parseReviews($$) {
    const reviews = [];

    $$('div.TxtWrap')
      .map((i, el) => {
        const childEl = `#divCon${i} > div`;
        return $$(childEl);
      })
      .each((i, el) => {
        const subject = $$(el)
          .find('div.subject > a')
          .text()
          .trim();

        const comment = $$(el)
          .find('div.textarea')
          .text()
          .trim();

        const star = $$(el).find('div.gradeWrap > span.gradeStar > img').length;

        reviews[i] = {};
        reviews[i].subject = subject || '';
        reviews[i].comment = comment || '';
        reviews[i].star = star || 0;
        // console.log('=================');
        // console.log(`no: ${i}, title: ${title}, comment: ${comment}, star: ${star}`);
      });

    return reviews;
  }
};
