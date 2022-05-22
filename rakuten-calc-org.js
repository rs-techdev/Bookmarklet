javascript: (function () {
    let total = 0;
    let content = "";
    let pageNum = 0;

    function parseHistory(text) {
        const doc = new DOMParser().parseFromString(text, "text/html");

        // 購入点数から総ページ数を求める
        const itemNumStr = doc.getElementsByClassName("totalItem")[0]?.textContent ?? "0";
        pageNum = Math.ceil(Number(itemNumStr.replace(/,/, "")) / 25);

        // 注文毎に処理
        const orders = doc.getElementsByClassName("oDrListGrid");
        [...orders].forEach((order) => {
            const orderDate = order.getElementsByClassName("purchaseDate")[0].textContent;
            const orderId = order.getElementsByClassName("idNum")[0].textContent;
            const shopName = order.getElementsByClassName("shopName")[0].textContent.trim();

            const itemEles = order.getElementsByClassName("itemPriceCnt");
            total = [...itemEles].reduce((acc, value) => {
                const itemName = value.getElementsByClassName("itemLink")[0].textContent.trim();
                const itemNumStr = value.getElementsByClassName("itemNum")[0].textContent.replace(/商品個数：/, "");
                const priceStr = value.getElementsByClassName("price")[0].textContent.replace(/,/, "");
                acc += Number(priceStr | 0) * Number(itemNumStr | 0);
                const total = Number(priceStr | 0) * Number(itemNumStr | 0);
                content += `${orderId}\t${orderDate}\t${shopName}\t${itemName}\t${itemNumStr}\t${priceStr}\t${total}\n`;
                return acc;
            }, total);
        });
    }

    async function calcPrice(year) {
        year = year == "all" ? 1 : year;

        const reqUrl =
            "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" +
            year +
            "&display_month=0";
        const text = await (await fetch(reqUrl)).text();
        parseHistory(text);

        if (pageNum > 1) {
            for (let i = 0; i < pageNum - 1; i++) {
                const reqUrl =
                    "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" +
                    year +
                    "&display_month=0&page_num=" +
                    (i + 2);
                const text = await (await fetch(reqUrl)).text();
                parseHistory(text);
            }
            // const reqUrls = [...Array(pageNum - 1).keys()].map(i => "https://order.my.rakuten.co.jp/?page=myorder&act=list&search_term=1&search_string=&display_span=" + year + "&display_month=0&page_num=" + (i + 2));
            // await Promise.all(reqUrls.map(u => fetch(u))).then(responses =>
            //   Promise.all(responses.map(res => res.text()))
            // ).then(texts => {
            //   texts.forEach(text => parseHistory(text));
            // })
        }
    }

    if (
        !window.confirm(
            "★★注意事項★★\n本ブックマークレットは本家サイトで設定したものですか？\n違う、記憶にない場合は、安全性にリスクがあります。キャンセルを押してください。\n\n    本家サイト：https://rs-techdev.com/archives/4295/"
        )
    ) {
        window.location = "https://rs-techdev.com/archives/4295/";
        return;
    }

    const year = window.prompt(
        "楽天年間購入金額算出ツール\n西暦何年の楽天市場での年間購入金額を調べますか？\n - 半角数字4桁で入力(1997年以降)\n - 全期間を調べる場合は「all」と入力"
    );

    if (!new RegExp(/^199[7-9]$|^20[0-2][0-9]$|^all$/).test(year)) {
        alert("1997年以降の西暦を正しく入力してください。");
        return;
    }

    calcPrice(year).then(() => {
        if (year == "all") {
            alert(`全期間の楽天市場での購入金額は、${total.toLocaleString()}円です。`);
        } else {
            alert(`${year}年の楽天市場での年間購入金額は、${total.toLocaleString()}円です。`);
        }

        let win = window.open("", "name", "height=250,width=700");
        win.document.write("<html><head><title>Amazon to TSV</title>");
        win.document.write(`
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-53G7M8X');</script>
  <!-- End Google Tag Manager -->
  </head>
  <body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-53G7M8X" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
  `);
        win.document.write("<pre>");
        win.document.write(
            "★★注意事項★★\n本ブックマークレットは本家サイトで設定したものですか？\n本家サイト以外で設定、どこで設定したか記憶が曖昧な場合、安全性にリスクがあります。本家サイトにアクセスして、再設定してください。\n  本家サイト：https://rs-techdev.com/archives/4295/\n\n\n"
        );
        win.document.write(
            "★★宣伝★★\nフリマサイト横断検索サイトを開設しました。最安値の限定品をゲットしましょう！！\n  フリトク：https://fritoku.com/item/\n\n\n"
        );
        win.document.write("注文番号\t注文日\tショップ名\t商品名\t商品個数\t商品単価\t小計\n");
        win.document.write(content);
        win.document.write("</pre>");
        win.document.write("</body></html>");
        win.document.close();
    });
})();
