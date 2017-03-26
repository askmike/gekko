import _ from 'lodash';
// global moment

export default function(_data, _trades, _height) {

  const trades = _trades.map(t => {
    return {
      price: t.price,
      date: new Date(t.date),
      action: t.action
    }
  });

  const data = _data.map(c => {
    return {
      price: c.close,
      date: new Date(c.start)
    }
  });

  var dates = data.map(c => +c.date);
  var prices = data.map(c => +c.price)

  var svg = d3.select("#chart");

  svg.attr("width", window.innerWidth - 20);

  var margin = {top: 20, right: 20, bottom: 110, left: 40};
  var height = _height - margin.top - margin.bottom;
  var margin2 = {top: _height - 70, right: 20, bottom: 30, left: 40};
  var width = +svg.attr("width") - margin.left - margin.right;
  var height2 = _height - margin2.top - margin2.bottom;

  var x = d3.scaleTime().range([0, width]),
      x2 = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      y2 = d3.scaleLinear().range([height2, 0]);

  var xAxis = d3.axisBottom(x),
      xAxis2 = d3.axisBottom(x2),
      yAxis = d3.axisLeft(y).ticks(_height / 50);

  var brush = d3.brushX()
      .extent([[0, 0], [width, height2]])
      .on("brush end", brushed);

  var zoom = d3.zoom()
      .scaleExtent([1, 100])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  var line = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.price); });

  var line2 = d3.line()
      .x(function(d) { return x2(d.date); })
      .y(function(d) { return y2(d.price); });

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  var focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([
    d3.min(prices) * 0.99,
    d3.max(prices) * 1.01
  ]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus.append("path")
      .datum(data)
      .attr("class", "line price")
      .attr("d", line);

  focus.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

  context.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line2);

  context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

  var circles = svg
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .selectAll("circle")
      .data(trades)
      .enter().append("circle")
        .attr('class', function(d) { return d.action })
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.price); })
        .attr('r', 5);

  var brushCircles = context
    .append('g')
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .selectAll("circle")
      .data(trades)
      .enter().append("circle")
        .attr('class', function(d) { return d.action })
        .attr("cx", function(d) { return x2(d.date); })
        .attr("cy", function(d) { return y2(d.price); })
        .attr('r', 3);


  context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

  svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));

    scaleY(x.domain());

    svg.select(".axis--y")
      .call(yAxis);

    circles
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.price); })

    focus.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
  }

  function scaleY(domain) {
    let [min, max] = domain;

    let minIndex = _.sortedIndex(dates, min);
    let maxIndex = _.sortedIndex(dates, max);

    let set = prices.slice(minIndex, maxIndex);
    y.domain([
      d3.min(set) * 0.9995,
      d3.max(set) * 1.0005
    ]);
  }

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;

    scaleY(t.rescaleX(x2).domain());    

    svg.select(".axis--y")
      .call(yAxis);

    x.domain(t.rescaleX(x2).domain());
    focus.select(".line").attr("d", line);

    circles
      .attr("cx", function(d) { return x(d.date); })
      .attr("cy", function(d) { return y(d.price); })


    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }
}