const d3 = require('d3');

// Define constants
const horizontalRange = [200, 1050];
const verticalRange = [150, 800];
const bubbleAreaRange = [150, 10000];
const textSizeRange = [8, 18];


const getMinMax = (data, factor) => {
  const values = Object.keys(data).map((key) => data[key][factor]);
  const min = Math.min.apply(null, values);
  const max = Math.max.apply(null, values);

  return [min, max];
}



const latScale = d3.scaleLinear()
                    .domain([47.528912, 27.766279])
                    .range(verticalRange)


const lonScale = d3.scaleLinear()
                    .domain([-150, -69.381927])
                    .range(horizontalRange)


const createScale = (data, factor, range) => {
  return d3.scaleLinear()
          .domain(getMinMax(data, factor))
          .range(range)
}


const calculateCircleColor = (d, factors) => {
  if(factors.position === 'president2016'){

    switch(d.president2016){
      case 0:
        return 'blue';
      case 2:
        return 'red';
      default:
        return 'rgb(251, 188, 5)';
    }

  } else {

    return 'rgb(57, 168, 83)';

  }
};









const renderCircles = (svg, data, factors) => {

  const scales = {
    areaScale: createScale(data, 'value', bubbleAreaRange),
    textSizeScale: createScale(data, 'value', textSizeRange),
  };

  let selection = svg.selectAll('.circle-g')
                     .data(data, (d) => d.name)


 // Enter helper
 const enterCircles = () => {
   let selectionEnterGroup = selection.enter()
                                      .append('g')
                                      .attr('class','circle-g');

   selectionEnterGroup.append('circle')
     .transition()
     .style('fill', (d) => calculateCircleColor(d, factors))
     .style('stroke', 'black')
     .attr('r', (d) => Math.sqrt( (scales.areaScale(d.value) / Math.PI) ));

   selectionEnterGroup.append('text')
     .text((d) => d.name)
     .style('font-family', 'Arial')
     .style('fill', 'white')
     .attr('x', (d) => (-1 * scales.textSizeScale(d.value)/1.5))
     .attr('y', (d) => (scales.textSizeScale(d.value)/2.4))
     .style('font-size', (d) => scales.textSizeScale(d.value));
 };




 // Update helper
  const updateCircles = () => {

    svg.selectAll('.circle-g').selectAll('circle')
      .data(data, d => d.name)
      .transition()
      .attr('r', (d) => Math.sqrt( (scales.areaScale(d.value) / Math.PI) ))
      .style('fill', (d) => calculateCircleColor(d, factors));

    svg.selectAll('.circle-g').selectAll('text')
      .data(data, d => d.name)
      .attr('x', (d) => (-1 * scales.textSizeScale(d.value)/1.5))
      .attr('y', (d) => (scales.textSizeScale(d.value)/2.4))
      .style('font-size', (d) => scales.textSizeScale(d.value));
  };


  // Exit helper
  const exitCircles = () => {
    selection.exit().transition().remove();
  };


  exitCircles();
  updateCircles();
  enterCircles();

};








const applyXYForces = (simulation, xScale, yScale, xFactor, yFactor) => {
  simulation
    .force('x', d3.forceX((d) => xScale(d[xFactor])).strength(0.4))
    .force('y', d3.forceY((d) => yScale(d[yFactor])).strength(0.4))
};





// Main function for creating circles visualization and simulation
exports.createCirclesSimulation = (svg, data, factors) => {

  const areaScale = createScale(data, 'value', bubbleAreaRange);

  const simulation = simulation || d3.forceSimulation();
  simulation.velocityDecay(0.4); // Prevent circles from spazing
  simulation.restart();


  // Determine position of the circles
  switch(factors.position){
    case 'geography':
      applyXYForces(simulation, lonScale, latScale, 'lon', 'lat');
      break;
    case 'president2016':
      const groupScale = createScale(data, 'president2016', horizontalRange);
      applyXYForces(simulation, groupScale, latScale, 'president2016', 'lat');
      break;
  };

  const ticked = () => {
    svg.selectAll('.circle-g')
      .attr('transform', (d) => {
        return "translate(" + d.x + "," + d.y + ")"
      })
  };

  simulation.nodes(data).on("tick", ticked);
  simulation.force('collide', d3.forceCollide((d) => Math.sqrt( areaScale(d.value) / Math.PI ) + 2 ) ); // Prevent circles from overlapping

  renderCircles(svg, data, factors);

};
