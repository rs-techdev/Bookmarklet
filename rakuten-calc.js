javascript: (
  function () {
    let total = 0;
    let content = '';
    let pageNum = 0;

    function parseHistory(text) {
      const doc = new DOMParser().parseFromString(text, "text/html");

      // 購入点数から総ページ数を求める
      const itemNumStr = doc.getElementsByClassName("totalItem")[0]?.textContent ?? '0';
      pageNum = Math.ceil(Number(itemNumStr.replace(/,/, '')) / 25);

      // 注文毎に処理
      const orders = doc.getElementsByClassName("oDrListGrid");
      [...orders].forEach(order => {
        const orderDate = order.getElementsByClassName("purchaseDate")[0].textContent;
        const orderId = order.getElementsByClassName("idNum")[0].textContent;
        const shopName = order.getElementsByClassName("shopName")[0].textContent;

        const itemEles = order.getElementsByClassName("itemPriceCnt");
        total = [...itemEles].reduce((acc, value) => {
          const itemName = value.getElementsByClassName("itemLink")[0].textContent.trim();
          const itemNumStr = value.getElementsByClassName("itemNum")[0].textContent.replace(/商品個数：/, '');
          const priceStr = value.getElementsByClassName("price")[0].textContent.replace(/,/, '');
          acc += (Number(priceStr | 0) * Number(itemNumStr | 0));
          content += `${orderId}\t${orderDate}\t${shopName}\t${itemName}\t${itemNumStr}\t${priceStr}\n`;
          return acc;
        }, total);
      });
    }

    async function calcPrice(year) {
      year = year == "all" ? 1 : year;

      const reqUrl = "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" + year + "&display_month=0";
      const text = await (await fetch(reqUrl)).text();
      parseHistory(text);

      if (pageNum > 1) {
        const reqUrls = [...Array(pageNum - 1).keys()].map(i => "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" + year + "&display_month=0&page_num=" + (i + 2));
        await Promise.all(reqUrls.map(u => fetch(u))).then(responses =>
          Promise.all(responses.map(res => res.text()))
        ).then(texts => {
          texts.forEach(text => parseHistory(text));
        })
      }
    }

    const year = window.prompt("西暦何年の楽天市場での購入金額合計を調べますか？\n - 半角数字4桁で入力(1997年以降)\n - 全期間を調べる場合は「all」と入力");

    if (!new RegExp(/^199[7-9]$|^20[0-2][0-9]$|^all$/).test(year)) {
      alert("1997年以降の西暦を正しく入力してください。");
      return;
    }

    calcPrice(year)
      .then(() => {
        if (year == 'all') {
          alert(`全期間の楽天市場での使用金額合計は、${total.toLocaleString()}円です。`);
        } else {
          alert(`${year}年の楽天市場での使用金額合計は、${total.toLocaleString()}円です。`);
        }

        let win = window.open('', 'name', 'height=250,width=700');
        win.document.write('<html><head><title>Rakuten to TSV</title></head><body>');
        win.document.write('<pre>');
        win.document.write('注文番号\t注文日\tショップ名\t商品名\t商品個数\t商品単価\n');
        win.document.write(content);
        win.document.write('</pre>');
        win.document.write('</body></html>');
        win.document.close();
      });
  }
)();
