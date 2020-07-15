javasscript: (
  function () {
    let total = 0;

    function parseHistory(text) {
      const doc = new DOMParser().parseFromString(text, "text/html");
      const itemEles = doc.getElementsByClassName("itemPriceCnt");
      if (itemEles.length == 0) {
        // No data
        return 0;
      }

      let _t = 0;
      for (let i = 0; i < itemEles.length; i++) {
        const priceStr = itemEles[i].getElementsByClassName("price")[0].textContent;
        const itemNumStr = itemEles[i].getElementsByClassName("itemNum")[0].textContent;
        _t += (Number(priceStr.replace(/,/, '') | 0) * Number(itemNumStr.replace(/商品個数：/, '') | 0));
      }
      return _t;
    }

    async function getPrice(year, page) {
      const reqUrl = "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" + year + "&display_month=0&page_num=" + page;
      const resp = await fetch(reqUrl);
      const text = await resp.text();
      return parseHistory(text);
    }

    async function calcPrice(year, page = 1) {
      const p = await getPrice(year, page);
      if (p == 0) {
        return;
      }
      total += p;
      await calcPrice(year, page + 1);
    }

    const year = window.prompt("西暦何年(1997年以降)の楽天市場での使用金額合計を調べますか？");
    if (!new RegExp(/199[7-9]|20[0-2][0-9]/).test(year)) {
      alert("1997年以降の西暦を正しく入力してください。");
      return;
    }

    calcPrice(year)
      .then(() => alert(year + "年の楽天市場での使用金額合計は、" + total.toLocaleString() + "円です。"));
  }
)();

