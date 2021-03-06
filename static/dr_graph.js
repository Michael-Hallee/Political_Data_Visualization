// read in the json data 
let requestURL = '/pollsdata';
let request = new XMLHttpRequest();
request.open('GET', requestURL);
request.responseType = 'json';
request.send();

request.onload = function () {
  const ags = request.response.aggregate;
  var data = [];

  for (key in ags) {
    data.push({
      'date': key,
      'one_sd_high': ags[key].dr_sd_high,
      'median_dr': ags[key].median_dr,
      'one_sd_low': ags[key].dr_sd_low,
    });
  }
  console.log(data)
  createDrGraph(data)
}


function createDrGraph(data) {

  // parse dates
  var parseDate = d3.time.format("%Y-%m-%d").parse;
  data.forEach(function (d) {
    d.date = parseDate(d.date);
  });
  console.log(data)
  console.log(data[0])


  var margin = {
    top: 80,
    right: 80,
    bottom: 30,
    left: 50
  },
    width = 900 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;


  //define scales
  var x = d3.time.scale()
    .range([0, width]);

  var y = d3.scale.linear()
    .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  // define line constuction method
  var line = d3.svg.line()
    .interpolate("basis")
    .x(function (d) {
      return x(d.date);
    })
    .y(function (d) {
      return y(d.dr);
    });

  // add svg to #chart div in home html file
  // use viewbox for responsive resizing (i.e. mobile use)
  var svg = d3.select("#chart").append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 960 600")
    .attr("max-width", "960")
    .attr("max-height", "600")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  color.domain(d3.keys(data[0]).filter(function (key) {
    return key !== "date";
  }));


  // assign values for graphing 
  var drs = color.domain().map(function (name) {
    return {
      name: name,
      values: data.map(function (d) {
        return {
          date: d.date,
          dr: +d[name]
        };
      })
    };
  });

  // set domain bounds based on min,max values of data 
  x.domain(d3.extent(data, function (d) {
    return d.date;
  }));

  y.domain([
    d3.min(drs, function (c) {
      return d3.min(c.values, function (v) {
        return v.dr;
      });
    }),
    d3.max(drs, function (c) {
      return d3.max(c.values, function (v) {
        return v.dr;
      });
    })
  ]);

  // create legend
  var legend = svg.selectAll('g')
    .data(drs)
    .enter()
    .append('g')
    .attr('class', 'legend');

  legend.append('rect')
    .attr('x', width - 20)
    .attr('y', function (d, i) {
      return i * 20;
    })
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', function (d) {
      return color(d.name);
    });

  legend.append('text')
    .attr('x', width - 8)
    .attr('y', function (d, i) {
      return (i * 20) + 9;
    })
    .text(function (d) {
      return d.name;
    });

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Generic Ballot D-R (+D)")
    .attr("font-weight", "bold")

  // dr are the 3 lines (median and one std dev high and low)
  var dr = svg.selectAll(".dr")
    .data(drs)
    .enter().append("g")
    .attr("class", "dr");

  dr.append("path")
    .attr("class", "line")
    .attr("d", function (d) {
      console.log(d.values);
      return line(d.values);
    })
    .style("stroke", function (d) {
      return color(d.name);
    });

  dr.append("text")
    .datum(function (d) {
      return {
        name: d.name,
        value: d.values[d.values.length - 1]
      };
    })
    .attr("transform", function (d) {
      return "translate(" + x(d.value.date) + "," + y(d.value.dr) + ")";
    })
    .attr("x", 3)
    .attr("dy", ".35em")
    .text(function (d) {
      return d.name;
    })
    .style("font", "14px sans-serif");;


  // create mouseover properties
  var mouseG = svg.append("g")
    .attr("class", "mouse-over-effects");

  mouseG.append("path") // this is the black vertical line to follow mouse
    .attr("class", "mouse-line")
    .style("stroke", "black")
    .style("stroke-width", "1px")
    .style("opacity", "0");

  var lines = document.getElementsByClassName('line');

  var mousePerLine = mouseG.selectAll('.mouse-per-line')
    .data(drs)
    .enter()
    .append("g")
    .attr("class", "mouse-per-line");

  mousePerLine.append("circle")
    .attr("r", 7)
    .style("stroke", function (d) {
      return color(d.name);
    })
    .style("fill", "none")
    .style("stroke-width", "1px")
    .style("opacity", "0");

  mousePerLine.append("text")
    .attr("transform", "translate(10,3)")

  mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
    .attr('width', width) // can't catch mouse events on a g element
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseout', function () { // on mouse out hide line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "0");
    })
    .on('mouseover', function () { // on mouse in show line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "1");
    })
    .on('mousemove', function () { // mouse moving over canvas
      var mouse = d3.mouse(this);
      d3.select(".mouse-line")
        .attr("d", function () {
          var d = "M" + mouse[0] + "," + height;
          d += " " + mouse[0] + "," + 0;
          return d;
        });
      
      // defines movement and dynamic update of hover text
      d3.selectAll(".mouse-per-line")
        .attr("transform", function (d, i) {
          formatDate = d3.time.format("%b-%d")

          var xDate = x.invert(mouse[0]),
            bisect = d3.bisector(function (d) { return d.date; }).right;
          idx = bisect(d.values, xDate);

          var beginning = 0,
            end = lines[i].getTotalLength(),
            target = null;

          while (true) {
            target = Math.floor((beginning + end) / 2);
            pos = lines[i].getPointAtLength(target);
            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
              break;
            }
            if (pos.x > mouse[0]) end = target;
            else if (pos.x < mouse[0]) beginning = target;
            else break; //position found
          }

          d3.select(this).select('text')
            .text(formatDate(xDate) + ': D+' + y.invert(pos.y).toFixed(2));

          return "translate(" + mouse[0] + "," + pos.y + ")";
        });
    });

    // add title
    formatDate = d3.time.format("%a %b %d")

    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")   
        .text("Current D-R Split:  D+" + data[data.length-1].median_dr)
        .attr("font-weight", "bold");
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2) + 15)
        .attr("text-anchor", "middle")  
        .style("font-size", "12px")   
        .text("Updated:  " + formatDate(data[data.length-1].date))

}
