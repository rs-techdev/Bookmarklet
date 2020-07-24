javascript: (
  function () {
    let total = 0;
    let content = '';
    let pageNum = 0;

    function parseHistory(text) {
      const doc = new DOMParser().parseFromString(text, "text/html");

      // 注文点数から総ページ数を求める
      const itemNumStr = doc.getElementsByClassName("num-orders")[0].textContent.replace(/[件,]/, '');
      pageNum = Math.ceil(Number(itemNumStr.replace(/,/, '')) / 10);

      // 注文毎に処理
      const orders = doc.getElementsByClassName("a-box-group a-spacing-base order");
      [...orders].forEach(order => {
        const orderDate = order.getElementsByClassName("a-color-secondary value")[0].textContent.trim();
        const orderId = order.getElementsByClassName("a-color-secondary value")[2].textContent.trim();
        const orderPriceStr = order.getElementsByClassName("a-color-secondary value")[1].textContent.replace(/[￥ ,]/g, '')
        total += (Number(orderPriceStr) | 0);

        const itemEles = order.getElementsByClassName("a-fixed-left-grid-col a-col-right");
        [...itemEles].forEach(item => {
          const itemName = item.getElementsByClassName("a-link-normal")[0].textContent.replace(/\t/g, " ").trim();
          const shopName = item.getElementsByClassName("a-size-small a-color-secondary")[0]?.textContent?.replace(/ +販売: +|^\n/g, "")?.trim() ?? 'ショップ名無し';
          const priceStr = item.getElementsByClassName("a-size-small a-color-price")[0]?.textContent?.replace(/^\n/g, "")?.trim() ?? '\\0';
          content += `${orderId}\t${orderDate}\t${shopName}\t${itemName}\t${priceStr}\n`;
        });
      });
    }

    async function calcPrice(year) {
      const reqUrl = "https://www.amazon.co.jp/gp/css/order-history?orderFilter=year-" + year;
      const text = await (await fetch(reqUrl)).text();
      parseHistory(text);

      if (pageNum > 1) {
        const reqUrls = [...Array(pageNum - 1).keys()].map(i => "https://www.amazon.co.jp/gp/css/order-history?orderFilter=year-" + year + "&startIndex=" + ((i + 1) * 10));
        await Promise.all(reqUrls.map(u => fetch(u))).then(responses =>
          Promise.all(responses.map(res => res.text()))
        ).then(texts => {
          texts.forEach(text => parseHistory(text));
        })
      }
    }

    function outputTsv() {
      let win = window.open('', 'name', 'height=250,width=700');
      win.document.write('<html><head><title>Amazon to TSV</title></head><body>');
      win.document.write('表示されている価格は参考値です。正しい価格は「注文の詳細」から確認をお願いします。');
      win.document.write('<pre>');
      win.document.write('注文番号\t注文日\tショップ名\t商品名\t価格(参考値)\n');
      win.document.write(content);
      win.document.write('</pre>');
      win.document.write('</body></html>');
      win.document.close();
    }

    const year = window.prompt("西暦何年のAmazonでの購入金額合計を調べますか？\n - 半角数字4桁で入力(2000年以降)\n - 全期間を調べる場合は「all」と入力");

    if (!new RegExp(/^20[0-2][0-9]$|^all$/).test(year)) {
      alert("2000年以降の西暦を正しく入力してください。");
      return;
    }

    if (year == 'all') {
      const yearStrList = [...document.querySelectorAll("#orderFilter option")]
        .filter(option => option.value.match(/^year/))
        .map(option => option.value.replace('year-', ''));

      Promise.all(yearStrList.map(y => calcPrice(y))).then(() => {
        alert(`全期間のAmazonでの使用金額合計は、${total.toLocaleString()}円です。`);
        outputTsv();
      });
    } else {
      calcPrice(year)
        .then(() => {
          alert(`${year}年のAmazonでの使用金額合計は、${total.toLocaleString()}円です。`);
          outputTsv();
        });
    }
  }
)();
