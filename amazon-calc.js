javascript: (
    function () {
      let total = 0;
  
      function parseHistory(text) {
        const doc = new DOMParser().parseFromString(text, "text/html");
        const itemEles = doc.getElementsByClassName("order");
        if (itemEles.length == 0) {
          // No data
          return 0;
        }
  
        let _t = 0;
        for (let i = 0; i < itemEles.length; i++) {
          const priceStr = itemEles[i].getElementsByClassName("a-color-secondary value")[1].textContent;
          _t += Number(priceStr.replace(/,|￥ /g,'')| 0);
        }
        return _t;
      }

      async function getPrice(year, page) {
        const reqUrl = "https://www.amazon.co.jp/gp/css/order-history?orderFilter=year-" + year + "&startIndex=" + (page*10);  
        const resp = await fetch(reqUrl);
        const text = await resp.text();
        return parseHistory(text);
      }
  
      async function calcPrice(year, page = 0) {
        if(page>10) return;
        const p = await getPrice(year, page);
        if (p == 0) {
          return;
        }
        total += p;
        await calcPrice(year, page + 1);
      }
  
      const year = window.prompt("西暦何年(1995年以降)のamazonでの使用金額合計を調べますか？");
      if (!new RegExp(/199[5-9]|20[0-2][0-9]/).test(year)) {
        alert("1995年以降の西暦を正しく入力してください。");
        return;
      }
  
      calcPrice(year)
        .then(() => alert(year + "年のamazonでの使用金額合計は、" + total.toLocaleString() + "円です。"));
    }
  )();
  
  