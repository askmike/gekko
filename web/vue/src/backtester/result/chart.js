function chart(data) {
  // This is the format our dates are in, e.g 23/05/2014
  // var timeFormat = d3.time.format('%d/%m/%Y');

  var dates = [],
      dateStrings = [],
      prices = [];

  data.forEach(function(d) {

    // Keep array of original date strings
    dateStrings.push(moment(d.start).format());

    // Convert date string into JS date, add it to dates array
    dates.push(new Date(d.start));

    // Add high temperature to temps array
    prices.push(d.close);

  });

  var chartWidth = window.innerWidth - 100,
      chartHeight = 500,
      margin = {
        top: 5,
        right: 25,
        bottom: 20,
        left: 25
      };

  var container = d3.select('#chart');

  var svg = container.append('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight);

  var defs = svg.append('defs');

  // clipping area
  defs.append('clipPath') 
    .attr('id', 'plot-area-clip-path')
    .append('rect')
      .attr({
        x: margin.left,
        y: margin.top,
        width: chartWidth - margin.right - margin.left,
        height: chartHeight - margin.top - margin.bottom
      });

  // Invisible background rect to capture all zoom events
  var backRect = svg.append('rect')
    .style('stroke', 'none')
    .style('fill', '#FFF')
    .style('fill-opacity', 0)
    .attr({
      x: margin.left,
      y: margin.top,
      width: chartWidth - margin.right - margin.left,
      height: chartHeight - margin.top - margin.bottom,
      'pointer-events': 'all'
    });

  var axes = svg.append('g')
    .attr('pointer-events', 'none')
    .style('font-size', '11px');

  var chart = svg.append('g')
    .attr('class', 'plot-area')
    .attr('pointer-events', 'none')
    .attr('clip-path', 'url(#plot-area-clip-path)');


  // x scale
  var xScale = d3.time.scale()
    .range([margin.left, chartWidth - margin.right])
    .domain(d3.extent(dates));

  // Calculate the range of the temperature data
  var yExtent = d3.extent(prices);
  var yRange = yExtent[1] - yExtent[0];

  // Adjust the lower and upper bounds to force the data
  // to fit into the y limits nicely
  yExtent[0] = yExtent[0] - yRange * 0.1;
  yExtent[1] = yExtent[1] + yRange * 0.1;

  // the y scale
  var yScale = d3.scale.linear()
    .range([chartHeight - margin.bottom, margin.top])
    .domain(yExtent);

  // x axis
  var xAxis = d3.svg.axis()
    .orient('bottom')
    .outerTickSize(0)
    .innerTickSize(0)
    .scale(xScale);

  // y axis
  var yAxis = d3.svg.axis()
    .orient('left')
    .outerTickSize(0)
    .innerTickSize(- (chartWidth - margin.left - margin.right))  // trick for creating quick gridlines
    .scale(yScale);

  var yAxis2 = d3.svg.axis()
    .orient('right')
    .outerTickSize(0)
    .innerTickSize(0)
    .scale(yScale);

  // Add the x axis to the chart
  var xAxisEl = axes.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(' + 0 + ',' + (chartHeight - margin.bottom) + ')')
    .call(xAxis);

  // Add the y axis to the chart
  var yAxisEl = axes.append('g')
    .attr('class', 'y-axis')
    .attr('transform', 'translate(' + margin.left + ',' + 0 + ')')
    .call(yAxis);

  // Add the y axis to the chart
  var yAxisEl2 = axes.append('g')
    .attr('class', 'y-axis right')
    .attr('transform', 'translate(' + (chartWidth - margin.right) + ',' + 0 + ')')
    .call(yAxis2);

  // Format y-axis gridlines
  yAxisEl.selectAll('line')
    .style('stroke', '#BBB')
    .style('stroke-width', '1px')
    .style('shape-rendering', 'crispEdges');


  // Start data as a flat line at the average
  var avgTempY = yScale(d3.mean(prices));

  // Path generator function for our data
  var pathGenerator = d3.svg.line()
    .x(function(d, i) { return xScale(dates[i]); })
    .y(function(d, i) { return yScale(prices[i]); });

  // Series container element
  var series = chart.append('g');

  // Add the temperature series path to the chart
  series.append('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .style('fill', 'none')
    .style('stroke', 'red')
    .style('stroke-width', '1px')
    .attr('d', pathGenerator(dates));


  // Add zooming and panning functionality, only along the x axis
  var zoom = d3.behavior.zoom()
    .scaleExtent([1, 100])
    .x(xScale)
    .on('zoom', function zoomHandler() {

      axes.select('.x-axis')
        .call(xAxis);

      series.attr('transform', 'translate(' + d3.event.translate[0] + ',0) scale(' + d3.event.scale + ',1)');

    });

  // The backRect captures zoom/pan events
  backRect.call(zoom);


  // Function for resetting any scaling and translation applied
  // during zooming and panning. Returns chart to original state.
  function resetZoom() {

    zoom.scale(1);
    zoom.translate([0, 0]);
    
    // Set x scale domain to the full data range
    xScale.domain(d3.extent(dates));

    // Update the x axis elements to match
    axes.select('.x-axis')
      .transition()
      .call(xAxis);

    // Remove any transformations applied to series elements
    series.transition()
      .attr('transform', "translate(0,0) scale(1,1)");

  };

  // Call resetZoom function when the button is clicked
  d3.select("#reset-zoom").on("click", resetZoom);




  // Active point element
  var activePoint = svg.append('circle')
    .attr({
      cx: 0,
      cy: 0,
      r: 5,
      'pointer-events': 'none'
    })
    .style({
      stroke: 'none',
      fill: 'red',
      'fill-opacity': 0
    });


  // Set container to have relative positioning. This allows us to easily
  // position the tooltip element with absolute positioning.
  container.style('position', 'relative');

  // Create the tooltip element. Hidden initially.
  var tt = container.append('div')
    .attr("class", "tooltip")
    .style({padding: '5px',
      border: '1px solid #AAA',
      color: 'black',
      position: 'absolute',
      visibility: 'hidden',
      'background-color': '#F5F5F5'
    });



  // Function for hiding the tooltip
  function hideTooltip() {
    tt.style('visibility', 'hidden');
    activePoint.style('fill-opacity', 0);

  }


  // Function for showing the tooltip
  function showTooltip() {
    tt.style('visibility', 'visible');
    activePoint.style('fill-opacity', 1);

  }


  // Tooltip content formatting function
  function tooltipFormatter(date, price) {
    return moment(date).format('YYYY-DD-MM HH:mm') + '<br><b>' + price.toFixed(8) + '';
  }

  var bisectDate = d3.bisector(function(d) { return d; }).left;

  backRect.on('mousemove', function() {

    // Coords of mousemove event relative to the container div
    var coords = d3.mouse(container.node());

    // Value on the x scale corresponding to this location
    var xVal = xScale.invert(coords[0]);

    // var mouseDate = xScale.invert(mouse[0]);
    var i = bisectDate(dates, xVal); // returns the index to the current data item

    // Does this date exist in the original data?
    var dateExists = i > -1;

    // If not, hide the tooltip and return from this function
    if (!dateExists) {
      hideTooltip();
      return;
    }

    // If we are here, the date was found in the original data.
    // Proceed with displaying tooltip for of the i-th data point.

    // Get the i-th date value and temperature value.
    var _date = dates[i],
        _price = prices[i];

    // Update the position of the activePoint element
    activePoint.attr({
      cx: xScale(_date),
      cy: yScale(_price)
    });

    // Update tooltip content
    tt.html(tooltipFormatter(_date, _price));

    // Get dimensions of tooltip element
    var dim = tt.node().getBoundingClientRect();

    // Update the position of the tooltip. By default, above and to the right
    // of the mouse cursor.
    var tt_top = coords[1] - dim.height - 10,
        tt_left = coords[0] + 10;

    // If right edge of tooltip goes beyond chart container, force it to move
    // to the left of the mouse cursor.
    if (tt_left + dim.width > chartWidth)
      tt_left = coords[0] - dim.width - 10;

    tt.style({
      top: tt_top + 'px',
      left: tt_left + 'px'
    });
    
    // Show tooltip if it is not already visible
    if (tt.style('visibility') != 'visible')
      showTooltip();

  });


  // Add mouseout event handler
  backRect.on('mouseout', hideTooltip);

}

export default chart;