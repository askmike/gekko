export const draw = function(message) {
  d3.select("#chart").append("text")
      .attr('class', 'message')
      .attr('x', 150)
      .attr('y', 150)
      .text(message);
}

export const clear = function() {
  svg.find('text').remove();
}