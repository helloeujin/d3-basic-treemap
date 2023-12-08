import * as d3 from "d3";
import "./viz.css";

////////////////////////////////////////////////////////////////////
////////////////////////////  Init  ///////////////////////////////
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");
// const g = svg.append("g"); // group

let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));

// scale
const colorScale = d3
  .scaleOrdinal()
  // .range(["#8d70cd", "#CDC0E4", "#FFA602", "#d3d3d3"]);
  .range(["#8160C8", "#CDC0E4", "#FFA602", "#d3d3d3"]);

// svg elements
let leaf, region;

////////////////////////////////////////////////////////////////////
////////////////////////////  Load CSV  ////////////////////////////
let data = [];
let hierarchicalData, hierarchy;
let treemap, root;

d3.csv("data/population_bycountry.csv")
  .then((raw_data) => {
    // data parsing
    data = raw_data.map((d) => {
      d.Population = parseInt(d.Population);
      d.time = parseInt(d.time);
      return d;
    });

    // Transform the flat data into a hierarchical format
    hierarchicalData = {
      name: "root",
      children: Array.from(
        d3.group(data, (d) => d.region),
        ([region, children]) => ({
          name: region,
          children: children.map((c) => ({
            name: c.name,
            value: c.Population,
            region: c.region,
          })),
        })
      ),
    };

    // Create a d3.hierarchy object and sum the values
    hierarchy = d3
      .hierarchy(hierarchicalData)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    // treemap
    treemap = d3
      .treemap()
      .size([width, height])
      .padding(2)
      .paddingTop(16)
      .paddingBottom(9)
      .paddingLeft(3)
      .paddingRight(3)
      .round(true);

    root = treemap(hierarchy);

    //  scale updated
    colorScale.domain(root.children.map((d) => d.data.name));

    // leaves
    leaf = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    // Rects
    leaf
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => colorScale(d.parent.data.name))
      .style("fill-opacity", 1)
      .attr("rx", 3)
      .attr("ry", 3);

    // Text
    leaf
      .append("text")
      .style("opacity", (d) => (d.x1 - d.x0 < 40 || d.y1 - d.y0 < 25 ? 0 : 1))
      .attr("fill", (d) => (d.parent.data.name === "asia" ? "#fff" : "#111"))
      .selectAll("tspan")
      .data(
        (d) => d.data.name.split(/(?=[A-Z][a-z])|\s+/g)
        // d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value))
      )
      .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i) => 13 * i + 13)
      .text((d) => d)
      .attr("class", "text");

    // region text
    region = svg
      .selectAll("region")
      .data(root.children)
      .join("text")
      .attr("class", "region")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0 + 2)
      .attr("dy", "0.6em")
      .attr("dx", 3)
      .text((d) => d.data.name);
  })
  .catch((error) => {
    console.error("Error loading CSV data: ", error);
  });

////////////////////////////////////////////////////////////////////
////////////////////////////  Resize  //////////////////////////////
window.addEventListener("resize", () => {
  //  width, height updated
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));

  // treemap
  treemap.size([width, height]);

  root = treemap(hierarchy);

  // leaves
  leaf.attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .selectAll("rect")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf
    .selectAll("text")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  //  region text
  region.attr("x", (d) => d.x0).attr("y", (d) => d.y0 + 2);
});
