javascript: (function () {
    let total = 0;
    let pageNum = 0;
    let output = {};
    let output2 = [];

    function parseHistory(text) {
        const doc = new DOMParser().parseFromString(text, "text/html");

        // 注文点数から総ページ数を求める
        const itemNumStr = doc.getElementsByClassName("num-orders")[0].textContent.replace(/[件,]/, "");
        pageNum = Math.ceil(Number(itemNumStr.replace(/,/, "")) / 10);

        // 注文毎に処理
        const orders = doc.getElementsByClassName("a-box-group a-spacing-base order");
        [...orders].forEach((order) => {
            const orderDate = order.getElementsByClassName("a-color-secondary value")[0].textContent.trim();
            const orderId = order.getElementsByClassName("a-color-secondary value")[2].textContent.trim();
            // プライムビデオはスキップ
            if (orderId.startsWith("D")) {
                return;
            }
            const orderPriceStr = order
                .getElementsByClassName("a-color-secondary value")[1]
                .textContent.replace(/[￥ ,]/g, "");
            const orderPrice = Number(orderPriceStr) | 0;
            total += orderPrice;

            // 「注文日」と「ご請求額」は先に取得
            output[orderId] = {
                orderDate: orderDate,
                orderPrice: orderPrice,
            };
        });
    }

    function parseDetail(text) {
        const doc = new DOMParser().parseFromString(text, "text/html");
        try {
            const detail = {};
            const orderId = doc.querySelector('[data-component="orderId"]').textContent.trim();
            const itemEles = doc.getElementById("od-subtotals")
                ? doc.getElementById("od-subtotals").querySelectorAll(".a-row.od-line-item-row")
                : doc.getElementsByClassName("a-fixed-right-grid-col a-col-right")[0].querySelectorAll("[class=a-row]");
            [...itemEles].forEach((item) => {
                const key = item.getElementsByTagName("span")[1].textContent.trim();
                const val = item
                    .getElementsByTagName("span")[2]
                    .textContent.trim()
                    .replace(/[￥ ,]/g, "");
                detail[key] = val;
            });
            output[orderId] = { ...output[orderId], ...detail };
        } catch (e) {
            console.error("error");
        }

        try {
            const orderId = doc.querySelector('[data-component="orderId"]').textContent.trim();
            const orderDate = doc.querySelector('[data-component="orderDate"]').textContent.trim();
            const itemEles = doc
                .querySelector('[data-component="purchasedItems"]')
                .getElementsByClassName("a-fixed-left-grid");
            [...itemEles].forEach((item) => {
                const name = item.querySelector('[data-component="itemTitle"]').textContent.trim();
                const price = item
                    .querySelector('[data-component="unitPrice"]')
                    .getElementsByClassName("a-offscreen")[0]
                    .textContent.trim()
                    .replace(/[￥ ,]/g, "");
                const num = item.querySelector('[data-component="itemImage"]').textContent.trim() || 1;
                output2.push({ orderId, orderDate, name, price, num });
            });
        } catch (e) {
            console.error("error");
        }
    }

    async function calcPrice(year) {
        const reqUrl = "https://www.amazon.co.jp/gp/css/order-history?disableCsd=no-js&orderFilter=year-" + year;
        const text = await (await fetch(reqUrl)).text();
        parseHistory(text);

        if (pageNum > 1) {
            const reqUrls = [...Array(pageNum - 1).keys()].map(
                (i) =>
                    "https://www.amazon.co.jp/gp/css/order-history?disableCsd=no-js&orderFilter=year-" +
                    year +
                    "&startIndex=" +
                    (i + 1) * 10
            );
            await Promise.all(reqUrls.map((u) => fetch(u)))
                .then((responses) => Promise.all(responses.map((res) => res.text())))
                .then((texts) => {
                    texts.forEach((text) => parseHistory(text));
                });
        }

        // 注文詳細を取得する
        // orderIDが"D"から始まるものはプライムビデオ。詳細が取れないため対象外
        const reqUrls = Object.keys(output)
            .filter((orderId) => !orderId.startsWith("D"))
            .map((orderId) => `https://www.amazon.co.jp/gp/your-account/order-details?orderID=${orderId}`);
        await Promise.all(reqUrls.map((u) => fetch(u)))
            .then((responses) => Promise.all(responses.map((res) => res.text())))
            .then((texts) => {
                // texts.forEach((text) => parseOrder(text));
                texts.forEach((text) => parseDetail(text));
            });
    }

    function outputTsv() {
        let win = window.open("", "name", "height=250,width=700");
        win.document.write("<html><head><title>Amazon to TSV</title>");
        win.document.write(`
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-NBHQLZ3');</script>
    <!-- End Google Tag Manager -->
    </head>
    <body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NBHQLZ3" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    `);
        win.document.write("<pre>");
        // win.document.write(
        //     "★★注意事項★★\n本ブックマークレットは本家サイトで設定したものですか？\n本家サイト以外で設定、どこで設定したか記憶が曖昧な場合、安全性にリスクがあります。本家サイトにアクセスして、再設定してください。\n  本家サイト：https://rs-techdev.com/archives/4340\n\n\n"
        // );
        // win.document.write(
        //     "★★宣伝★★\nAmazonタイムセール検索サイトを開設しました。数量限定のタイムセール品を簡単に検索できます。\n  アマ探.net：https://amatan.net/goldbox/\n\n\n"
        // );
        win.document.write(
            "注文番号\t注文日\t商品の小計\t配送料・手数料\t注文合計\tAmazonギフト券・Amazonショッピングカードの金額\tAmazonポイント\t割引\tご請求額\turl\t備考\n"
        );
        Object.keys(output).forEach((orderId) => {
            const shoukei = output[orderId]["商品の小計："] ?? 0;
            const haisou = output[orderId]["配送料・手数料："] ?? 0;
            const goukei = output[orderId]["注文合計："] ?? 0;
            const gift = output[orderId]["Amazonギフト券・Amazonショッピングカードの金額："] ?? 0;
            const point = output[orderId]["Amazonポイント"] ?? 0; // Amazonポイントだけコロンが無い
            const seikyu = output[orderId]["ご請求額："] ?? 0;
            const waribiki = output[orderId]["割引："] ?? 0;
            const orderDate = output[orderId]["orderDate"] ?? "";
            const url = `https://www.amazon.co.jp/gp/your-account/order-details?orderID=${orderId}`;
            const remarks = output[orderId]["remarks"] ?? "";

            win.document.write(
                `${orderId}\t${orderDate}\t${shoukei}\t${haisou}\t${goukei}\t${gift}\t${point}\t${waribiki}\t${seikyu}\t${url}\t${remarks}\n`
            );
        });
        win.document.write("\n");
        win.document.write("注文番号\t注文日\t商品名\t購入数\t購入単価\t購入額\n");
        output2.forEach((item) => {
            const totalPrice = item.num * item.price;
            win.document.write(
                `${item.orderId}\t${item.orderDate}\t${item.name}\t${item.num}\t${item.price}\t${totalPrice}\n`
            );
        });
        win.document.write("\n");
        win.document.write("</pre>");
        win.document.write("</body></html>");
        win.document.close();
    }

    // if (
    //     !window.confirm(
    //         "★★注意事項★★\n本ブックマークレットは本家サイトで設定したものですか？\n違う、記憶にない場合は、安全性にリスクがあります。キャンセルを押してください。\n\n    本家サイト：https://rs-techdev.com/archives/4340"
    //     )
    // ) {
    //     window.location = "https://rs-techdev.com/archives/4340";
    //     return;
    // }

    const year = window.prompt(
        "Amazon年間購入金額算出ツール\n（算出に10秒程度の時間がかかります）\n\n西暦何年のAmazonでの年間購入金額を調べますか？\n半角数字4桁で入力(2000年以降)を入力してください"
    );

    if (!new RegExp(/^20[0-2][0-9]$/).test(year)) {
        alert("2000年以降の西暦を正しく入力してください。");
        return;
    }

    calcPrice(year).then(() => {
        alert(`${year}年のAmazonでの年間購入金額は、${total.toLocaleString()}円です。`);
        outputTsv();
    });
})();
