import _ from 'lodash'

// techanjs based cancle chart, unused at the moment

export default function(_data, _trades) {
    let MAX_WIDTH = window.innerWidth - 20;

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = MAX_WIDTH - margin.left - margin.right,
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
            .orient(function(d) { return d.type.startsWith("buy") ? "up" : "down"; })
            .on("mouseenter", enter)
            .on("mouseout", out);

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);

    var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        .attr("class", "tradearrow")
        .attr("clip-path", "url(#clip)");

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

    const data = _data.map(function(d) {
        return {
            date: new Date(d.start),
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close,
            volume: +d.volume
        };
    }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    const trades = _trades.map(function(t) {
        let trade = _.pick(t, ['price']);
        trade.quantity = 1;
        trade.type = t.action;
        trade.date = new Date(t.date);
        return trade;
    });

    console.log(trades);

    x.domain(data.map(accessor.d));
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    svg.select("g.tradearrow").datum(trades);
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
        svg.select("g.tradearrow").call(tradearrow);
        svg.select("g.candlestick").call(candlestick);
        // using refresh method is more efficient as it does not perform any data joins
        // Use this if underlying data is not changing
    //        svg.select("g.candlestick").call(candlestick.refresh);
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
        valueText.text("Trade: " + dateFormat(d.date) + ", " + d.type + ", " + valueFormat(d.price));
    }

};