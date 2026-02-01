javascript: (function () {
    let total = 0;
    let content = "";

    function parseHistory(json) {
        // 注文毎に処理
        json.orderList.forEach((order) => {
            const orderId = order.orderNumber;
            const orderDate = new Date(order.orderDate).toLocaleDateString("ja-JP", {
                timeZone: "Asia/Tokyo"
            });
            const shopName = order.shopName;

            total = order.items.reduce((acc, item) => {
                const itemName = item.itemName;
                const itemNum = item.itemUnits;
                const price = item.itemPrice;
                const total = Number(price | 0) * Number(itemNum | 0);
                acc += total;
                content += `${orderId}\t${orderDate}\t${shopName}\t${itemName}\t${itemNum}\t${price}\t${total}\n`;
                return acc;
            }, total);
        });
    }

    async function calcPrice(year) {
        const reqUrl = year === "all" ?
            "https://order.my.rakuten.co.jp/purchasehistoryapi/orderlist" :
            "https://order.my.rakuten.co.jp/purchasehistoryapi/orderlist?order_year=" + year;

        const json = await (await fetch(reqUrl)).json();
        parseHistory(json);
        for (let i = 2; i <= Math.ceil(json.ordersFound / json.pageSize); i++) {
            const reqUrl =
                "https://order.my.rakuten.co.jp/purchasehistoryapi/orderlist?order_year=" + year + "&page=" + i
            const json = await (await fetch(reqUrl)).json();
            parseHistory(json);
        }
    }

    const year = window.prompt(
        "楽天年間購入金額算出ツール\n西暦何年の楽天市場での年間購入金額を調べますか？\n - 半角数字4桁で入力(1997年以降)\n - 全期間を調べる場合は「all」と入力"
    );

    if (!new RegExp(/^199[7-9]$|^20[0-2][0-9]$|^all$/).test(year)) {
        alert("1997年以降の西暦を正しく入力してください。");
        return;
    }

    calcPrice(year).then(() => {
        const period = year === "all" ? "全期間" : year + "年";
        const str = `${period}の楽天市場での購入金額は、${total.toLocaleString()}円です。`
        alert(str);

        const win = window.open("", "name", "height=250,width=700");
        const doc = win.document;
        doc.title = str;
        const pre = doc.createElement("pre");
        pre.textContent = "注文番号\t注文日\tショップ名\t商品名\t商品個数\t商品単価\t小計\n" + content;
        doc.body.appendChild(pre);
    });
})();
