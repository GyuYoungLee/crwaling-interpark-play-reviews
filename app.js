//
// 2018.11.22 by Gary
// app.js 한번 더 클래스로 분리하는게 좋을까 (services -> services, crawlings)
// => 추후 작업하게 되면 분리하자
//

const fs = require('fs');
const Crawling = require('./services/interpark.crawling');

const crawling = new Crawling();
let playList = [];
let reviewList = [];
const playFile = 'playList.json';
const reviewFile = 'reviewList.json';

const run = async () => {
  let listPageCnt; // 랭킹 페이지 총 개수
  let playCnt; // 총 공연 개수

  // 1.Count the number of pages
  const $$ = await crawling.downloadListPage();
  listPageCnt = crawling.parsePageCnt($$);
  console.log(`pages: ${listPageCnt}`);

  // 2.Get the playID of plays in each page
  listPageCnt = 7;
  // listPageCnt = 1; // debug
  for (let pageNo = 1; pageNo <= listPageCnt; pageNo++) {
    const $$ = await crawling.downloadListPage(pageNo);
    const plays = crawling.parsePlayIDs($$);
    playList = [...playList, ...plays];
  }
  console.log(`plays: ${playList.length}`);

  // 3.Get goodsCode in each play
  playCnt = playList.length;
  // playCnt = 1; // debug
  for (let i = 0; i < playCnt; i++) {
    const v = playList[i];
    const $$ = await crawling.downloadDetailPage(v.detailUrl);
    const goodsCode = crawling.parseGoodsCode($$);
    v.rank = i + 1;
    v.goodsCode = goodsCode;
    console.log(v.rank);
    console.log(v.name);
  }

  // 4.Get reviews in each play
  playCnt = playList.length;
  // playCnt = 1; // debug
  for (let i = 0; i < playCnt; i++) {
    // Count the number of pages
    const play = playList[i];
    const $$ = await crawling.downloadReviewPage(play.goodsCode);
    const reviewCnt = crawling.parseReviewCnt($$);
    const reviewPageCnt = Math.ceil(reviewCnt / 15);
    play.reviewCnt = reviewCnt;
    // Get review
    for (let pageNo = 1; pageNo <= reviewPageCnt; pageNo++) {
      const $$ = await crawling.downloadReviewPage(play.goodsCode, pageNo);
      let reviews = crawling.parseReviews($$);
      reviews = reviews.map((review, i) => {
        console.log(`rank: ${play.rank} - ${i}`);
        return { ...play, ...review };
      });
      reviewList = [...reviewList, ...reviews];
    }
  }

  return reviewList.length;
  // ======== End of Crawling
};

run().then(reviewCnt => {
  console.log(`reviews: ${reviewCnt}`);
  // 5.Write to Files
  fs.writeFile(playFile, JSON.stringify(playList, null, 2), 'utf8', err => {
    if (err) console.error(err);
  });
  fs.writeFile(reviewFile, JSON.stringify(reviewList, null, 2), 'utf8', err => {
    if (err) console.error(err);
  });
});
