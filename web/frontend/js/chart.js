module.exports = function(data, trades) {

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = window.innerWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = techan.scale.financetime()
        .range([0, width]);

    var y = d3.scaleLinear()
        .range([height, 0]);

    var zoom = d3.zoom()
        .on("zoom", zoomed);

    var zoomableInit;

    var candlestick = techan.plot.candlestick()
        .xScale(x)
        .yScale(y);

    var tradearrow = techan.plot.tradearrow()
        .xScale(x)
        .yScale(y)
        .orient(function(d) { return d.action.startsWith("buy") ? "up" : "down"; })
        .on("mouseenter", enter)
        .on("mouseout", out);

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var valueText = svg.append('text')
        .style("text-anchor", "end")
        .attr("class", "coords")
        .attr("x", width - 5)
        .attr("y", 15);

    svg.append("clipPath")
            .attr("id", "clip")
        .append("rect")
            .attr("x", 0)
            .attr("y", y(1))
            .attr("width", width)
            .attr("height", y(0) - y(1));

    svg.append("g")
            .attr("class", "candlestick")
            .attr("clip-path", "url(#clip)");

    svg.append("g")
            .attr("class", "tradearrow");

    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")");

    svg.append("g")
            .attr("class", "y axis")
        .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Price ($)");

    svg.append("rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .call(zoom);

    var accessor = candlestick.accessor();

    data = data.map(function(d) {
        return {
            date: moment(d.start).toDate(),
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close,
            volume: +d.volume
        };
    }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    x.domain(data.map(accessor.d));
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    svg.select("g.candlestick").datum(data);
    draw();

    // Associate the zoom with the scale after a domain has been applied
    // Stash initial settings to store as baseline for zooming
    zoomableInit = x.zoomable().clamp(false).copy();

    function zoomed() {
        var rescaledY = d3.event.transform.rescaleY(y);
        yAxis.scale(rescaledY);
        candlestick.yScale(rescaledY);
        tradearrow.yScale(rescaledY);

        // Emulates D3 behaviour, required for financetime due to secondary zoomable scale
        x.zoomable().domain(d3.event.transform.rescaleX(zoomableInit).domain());

        draw();
    }

    function draw() {
        svg.select("g.candlestick").call(candlestick);
        // using refresh method is more efficient as it does not perform any data joins
        // Use this if underlying data is not changing
        // svg.select("g.candlestick").call(candlestick.refresh);
        svg.selectAll("g.tradearrow").datum(trades).call(tradearrow);

        svg.select("g.x.axis").call(xAxis);
        svg.select("g.y.axis").call(yAxis)
    }

    function enter(d) {
        valueText.style("display", "inline");
        refreshText(d);
    }

    function out() {
        valueText.style("display", "none");
    }

    function refreshText(d) {
        valueText.text("Trade: " + dateFormat(d.date) + ", " + d.type + ", " + d.price.toFixed(12));
    }

    trades = _.map(trades, function(t) {
        t.date = moment(t.date).toDate();
        t.type = t.action;
        t.quantity = t.balance;
        return t;
    });

    draw(data, trades);

    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////
    // //////////




    // var accessor = candlestick.accessor();

    // data = data.map(function(d) {
    //     return {
    //         date: moment(d.start).toDate(),
    //         open: +d.open,
    //         high: +d.high,
    //         low: +d.low,
    //         close: +d.close,
    //         volume: +d.volume
    //     };
    // }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    // var trades = [
    //     { date: data[67].date, type: "buy", price: data[67].low, quantity: 1000 },
    //     { date: data[100].date, type: "sell", price: data[100].high, quantity: 200 },
    //     { date: data[156].date, type: "buy", price: data[156].open, quantity: 500 },
    //     { date: data[167].date, type: "sell", price: data[167].close, quantity: 300 },
    //     { date: data[187].date, type: "buy-pending", price: data[187].low, quantity: 300 }
    // ];

    // svg.append("g")
    //         .attr("class", "candlestick");

    // svg.append("g")
    //         .attr("class", "tradearrow");

    // svg.append("g")
    //         .attr("class", "x axis")
    //         .attr("transform", "translate(0," + height + ")");

    // svg.append("g")
    //         .attr("class", "y axis")
    //         .append("text")
    //         .attr("transform", "rotate(-90)")
    //         .attr("y", 6)
    //         .attr("dy", ".71em")
    //         .style("text-anchor", "end")
    //         .text("Price (" + $('#currency').val()  + ")");

    // draw(data, trades);

    // function draw(data, trades) {
        
    //     console.log(trades);

    //     x.domain(data.map(candlestick.accessor().d));
    //     y.domain(techan.scale.plot.ohlc(data, candlestick.accessor()).domain());

    //     svg.selectAll("g.candlestick").datum(data).call(candlestick);

    //     svg.selectAll("g.tradearrow").datum(trades).call(tradearrow);

    //     svg.selectAll("g.x.axis").call(xAxis);
    //     svg.selectAll("g.y.axis").call(yAxis);
    // }

    

};