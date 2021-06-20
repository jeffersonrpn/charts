async function draw() {
  const nameAcessor = d => d.name;
  const parentAcessor = d => d.parent;
  const valueAcessor = d => +d.value;

  const dimensions = {
    width: 800
  }
  dimensions.radius = dimensions.width / 7;
  const offOpacity = 0.1;
  let currentProductSelected = "";

  const rawData = await d3.csv("data2.csv");
  const data = d3.stratify()
    .id(nameAcessor)
    .parentId(parentAcessor)(rawData);
  data.sum(valueAcessor);

  const hierarchy = d3.hierarchy(data)
    .sum(d => d.data.value)
    .sort((a, b) => b.data.value - a.data.value);

  const root = d3.partition()
    .size([2 * Math.PI, hierarchy.height + 1])(hierarchy);

  const produtos = Array.from(
    d3.group(rawData.filter(d => d.parent != "Brasil" && d.name != "Brasil"),
      d => d.name).keys());
  produtos.sort((a, b) => {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  });
  const color = d3.scaleOrdinal().domain(produtos).range([
    "#c7f64a",
    "#1ebf70",
    "#87e089",
    "#7095f1",
    "#755285",
    "#dedab4",
    "#b7a1ff",
    "#2e2f46",
    "#ffffff",
    "#87e0d4",
    "#3d60d9"
  ]);
  const colorText = d3.scaleOrdinal().domain(produtos).range([
    "#000000",
    "#000000",
    "#000000",
    "#ffffff",
    "#ffffff",
    "#000000",
    "#000000",
    "#ffffff",
    "#000000",
    "#000000",
    "#ffffff"
  ]);

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    // .padRadius(dimensions.radius * 5)
    .padRadius(0)
    .innerRadius(d => d.y0 * dimensions.radius)
    // .outerRadius(d => Math.max(d.y0 * dimensions.radius, d.y1 * dimensions.radius - 3))
    .outerRadius(d => Math.max(d.y0 * dimensions.radius, d.y1 * dimensions.radius));

  const wrapper = d3.select("#chart-sunbrust")
    .append("svg")
    .attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.width)
    .attr("width", "100%");

  const bounds = wrapper.append("g")
    .attr("transform", `translate(${dimensions.width / 2}, ${dimensions.width / 2})`);

  const path = bounds.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("id", d => `arco-${d.data.data.id}`)
    .attr("class", d => `arcos arcos-${d.data.data.parent} arcos-${getProductClass(d.data.data.name)}`)
    .attr("fill", (d, i) => {
      if (d.depth > 1) {
        return color(d.data.data.name);
      }
      return (i % 2) ? "#d2d2d2" : "#bababa";
    })
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 3)
    .attr("d", d => arc(d))
    .style("cursor", "pointer")
    .on("mouseover", (e, d) => {
      if (d.depth > 1) {
        d3.selectAll(".arcos").attr("fill-opacity", offOpacity);
        d3.select("#arco-" + d.data.data.id).attr("fill-opacity", 1);
        d3.select("#arco-" + d.parent.data.data.id).attr("fill-opacity", 1);
      } else {
        d3.selectAll(".arcos").attr("fill-opacity", offOpacity);
        d3.selectAll(`.arcos-${d.data.data.name}`).attr("fill-opacity", 1);
        d3.select("#arco-" + d.data.data.id).attr("fill-opacity", 1);
      }
      tooltip.style("display", null);
    })
    .on("mouseout", () => {
      d3.selectAll(".arcos").attr("fill-opacity", 1);
      tooltip.style("display", "none");
    })
    .on("mousemove", (event, d) => {
      if (d.depth > 1) {
        const xy = d3.pointer(event);
        tooltipBody.html(`
          ${d.data.data.name}<br>
          ${d.parent.data.data.name}
          <strong>${d.data.data.value}</strong>`);
        tooltipTitle.style("background-color", color(d.data.data.name));
        tooltip.attr("transform", `translate(${xy[0]}, ${xy[1]})`);
      } else {
        tooltip.style("display", "none");
      }
    });

  path.append("title")
    .text(d => `${d.ancestors().map(d => d.data.data.name).reverse().join("/")}\n${d.value}`);

  const label = bounds.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", "0.35em")
    .attr("fill-opacity", d => +labelVisible(d))
    .attr("transform", d => labelTransform(d))
    .text(d => d.data.data.name);

  const title = wrapper.append("text")
    .attr("x", dimensions.width * 0.5)
    .attr("y", dimensions.width * 0.5)
    .attr("text-anchor", "middle")
    .text("NAVEGUE");
  const title2 = wrapper.append("text")
    .attr("x", dimensions.width * 0.5)
    .attr("y", (dimensions.width * 0.5) + 18)
    .attr("text-anchor", "middle")
    .text("POR ESTADO");

  const tooltip = bounds.append("foreignObject")
    .attr("class", "chart-tooltip")
    .attr("x", 20)
    .attr("y", 0)
    .attr("width", 200)
    .attr("height", 100)
    .style("display", "none");
  const tooltipContent = tooltip.append("xhtml:div")
    .attr("class", "chart-tooltip-content")
    .style("background-color", "#bababa")
    .style("border", "solid 1px #000000")
    .style("padding", "0.5rem")
    .style("display", "flex");
  const tooltipTitle = tooltipContent.append("div")
    .attr("class", "chart-tooltip-title")
    .style("width", "30px")
    .style("height", "80px");
  const tooltipBody = tooltipContent.append("div")
    .attr("class", "chart-tooltip-body")
    .style("margin-left", "0.5rem");

  const nav = d3.select("#chart-sunbrust-nav")
    .selectAll("div")
    .data(produtos)
    .join("div")
    .append("button")
    .attr("class", d => `chart-sunbrust-nav-item button-${getProductClass(d)}`)
    .style("background-color", d => color(d))
    .style("color", d => colorText(d))
    .html(d => d)
    .on("click", (e, d) => {
      if (currentProductSelected !== d) {
        d3.selectAll(".arcos").attr("fill-opacity", offOpacity);
        d3.selectAll(".chart-sunbrust-nav-item").style("opacity", offOpacity);
        d3.selectAll(`.arcos-${getProductClass(d)}`).attr("fill-opacity", 1);
        d3.selectAll(`.button-${getProductClass(d)}`).style("opacity", 1);
        currentProductSelected = d;
      } else {
        d3.selectAll(".arcos").attr("fill-opacity", 1);
        d3.selectAll(".chart-sunbrust-nav-item").style("opacity", 1);
      }
    });

  function labelVisible(d) {
    if (d.depth > 1) {
      return false;
    }
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * dimensions.radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  function getProductClass(p) {
    return p.replace(/ /g, "-");
  }

}
draw();