javascript: (
  function () {
    let total = 0;

    function parseHistory(text) {
      const doc = new DOMParser().parseFromString(text, "text/html");

      // 購入点数 ⇒ 総ページ数
      const itemNumStr = doc.getElementsByClassName("totalItem")[0]?.textContent ?? '0';
      const pageNum = Math.ceil(Number(itemNumStr.replace(/,/, '')) / 25);

      // 購入額合計(表示ページ毎)
      const itemEles = doc.getElementsByClassName("itemPriceCnt");
      const _t = [...itemEles].reduce((acc, value) => {
        const priceStr = value.getElementsByClassName("price")[0].textContent;
        const itemNumStr = value.getElementsByClassName("itemNum")[0].textContent;
        acc += (Number(priceStr.replace(/,/, '') | 0) * Number(itemNumStr.replace(/商品個数：/, '') | 0));
        return acc;
      }, 0);

      return [pageNum, _t];
    }

    async function calcPrice(year) {
      year = year == "all" ? 1 : year;

      const reqUrl = "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" + year + "&display_month=0";
      const text = await (await fetch(reqUrl)).text();
      [pageNum, total] = parseHistory(text);

      if (pageNum > 1) {
        const reqUrls = [...Array(pageNum - 1).keys()].map(i => "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" + year + "&display_month=0&page_num=" + (i + 2));
        await Promise.all(reqUrls.map(u => fetch(u))).then(responses =>
          Promise.all(responses.map(res => res.text()))
        ).then(texts => {
          total += texts.reduce((acc, value) => acc + parseHistory(value)[1], 0);
        })
      }
    }

    const year = window.prompt("西暦何年(1997年以降)の楽天市場での使用金額合計を調べますか？\n(全期間はallを入力)");
    if (!new RegExp(/199[7-9]|20[0-2][0-9]|all/).test(year)) {
      alert("1997年以降の西暦を正しく入力してください。");
      return;
    }

    calcPrice(year)
      .then(() => alert(year + "年の楽天市場での使用金額合計は、" + total.toLocaleString() + "円です。"));
  }
)();
