async function draw() {

  const width = 800;
  const height = 750;

  const x = d3.scaleLinear().rangeRound([0, width]);
  const y = d3.scaleLinear().rangeRound([0, height]);

  const svg = d3.select("#chart-treemap")
    .append("svg")
    .attr("viewBox", [0.5, -30.5, width, height + 30]);

  function tile(node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height);
    for (const child of node.children) {
      child.x0 = x0 + child.x0 / width * (x1 - x0);
      child.x1 = x0 + child.x1 / width * (x1 - x0);
      child.y0 = y0 + child.y0 / height * (y1 - y0);
      child.y1 = y0 + child.y1 / height * (y1 - y0);
    }
  }

  const data = await d3.csv("data1.csv");
  const root = d3.stratify()
    .id(d => d.name)
    .parentId(d => d.parent)(data);
  root.sum(d => +d.value);
  root.sort((a, b) => b.value - a.value);

  const treemap = d3.treemap()
    .tile(tile)(root);

  let group = svg.append("g")
    .call(render, treemap);

  function render(group, root) {
    const node = group
      .selectAll("g")
      .data(root.children.concat(root))
      .join("g");
    node
      .filter(d => d === root ? d.parent : d.children)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        tooltip.style("display", "none");
        if (d === root) {
          zoomout(root);
        } else {
          zoomin(d);
        }
      })
      .on("mouseover", () => {
        tooltip.style("display", null);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      })
      .on("mousemove", (event, d) => {
        const xy = d3.pointer(event);
        let xt = xy[0] + x(d.x0);
        if (xt > width * 0.5) {
          xt -= 280;
        }
        let yt = xy[1] + y(d.y0);
        if (yt > height * 0.7) {
          yt -= 120;
        }
        tooltipBody.html(d.children.map(d => `${d.data.desc} <strong style="text-decoration: underline;">${d.data.value}</strong>`).join("<br>"));
        tooltip.attr("transform", `translate(${xt}, ${yt})`);
      });

    // node.append("title")
    //   .text(d => `${name(d)}\n${d.data.value}`);
    node.append("rect")
      .attr("id", d => d.data.id)
      .attr("fill", (d) => {
        if (d === root) {
          return "#3d60d9";
        } else if (d.data.id % 2) {
          return "#3d60d9";
        }
        return "#87e089";
        // d === root ?  : d.children ? "#3d60d9" : "#ddd"
      })
      .attr("stroke", "#030420")
      .attr("stroke-width", d => d === root ? 2 : d.children ? 2 : 4);

    // node.append("clipPath")
    //   .attr("id", d => `clip-${d.data.id}`)
    //   .append("use")
    // .attr("xlink:href", d => d.leafUid.href);

    // node.append("text")
    //   .attr("clip-path", d => `clip-${d.data.id}`)
    //   .attr("font-weight", d => d === root ? "bold" : null)
    //   .selectAll("tspan")
    //   .data(d => (d === root ? name(d) : d.data.desc).split(/(?=[A-Z][^A-Z])/g).concat(d.value))
    //   .join("tspan")
    //   .attr("x", 3)
    //   .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
    //   .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
    //   .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
    //   .text(d => d);
    node.append("text")
      .attr("x", 10)
      .attr("y", d => (d === root ? 20 : 25))
      .attr("font-size", d => (x(d.x1) - x(d.x0) > 120) ? "1.2rem" : "0.8rem")
      .attr("fill", "#ffffff")
      .text(d => (d === root ? name(d) : d.data.desc));
    node
      .filter(d => d !== root)
      .append("text")
      .attr("x", 10)
      .attr("y", 45)
      .attr("font-size", d => (x(d.x1) - x(d.x0) > 120) ? "1.2rem" : "0.8rem")
      .attr("font-family", "informative-bold")
      .attr("text-decoration", "underline")
      .attr("fill", "#ffffff")
      .text(d => d.value);
    node
      .filter(d => d === root)
      .append("text")
      .attr("x", width - 20)
      .attr("y", 20)
      .attr("font-size", "1.2rem")
      .attr("font-family", "informative-bold")
      .attr("fill", "#ffffff")
      .attr("opacity", d => (d.depth > 0) ? "1" : "0")
      .text("X");

    group.call(position, root);
  }

  const tooltip = svg.append("foreignObject")
    .attr("class", "chart-tooltip")
    .attr("x", 20)
    .attr("y", 0)
    .attr("width", 250)
    .attr("height", 400)
    .style("display", "none");
  const tooltipContent = tooltip.append("xhtml:div")
    .attr("class", "chart-tooltip-content")
    .style("background-color", "#cccccc")
    .style("border", "solid 1px #000000")
    .style("padding", "1rem");
  const tooltipBody = tooltipContent.append("div")
    .attr("class", "chart-tooltip-body");
  tooltipContent.append("div")
    .attr("class", "chart-tooltip-footer")
    .style("padding-top", "1rem")
    .style("font-family", "informative-bold")
    .style("font-size", "0.8rem")
    .style("color", "#3d60d9")
    .html(`CLIQUE PARA EXPANDIR`);

  function name(d) {
    return d.ancestors().reverse().splice(1).map(d => d.data.desc).join("/");
  }

  function position(group, root) {
    group.selectAll("g")
      .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
      .select("rect")
      .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
      .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
  }

  function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.append("g").call(render, d);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    svg.transition()
      .duration(750)
      .call(t => group0.transition(t).remove()
        .call(position, d.parent))
      .call(t => group1.transition(t)
        .attrTween("opacity", () => d3.interpolate(0, 1))
        .call(position, d));
  }

  function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.insert("g", "*").call(render, d.parent);

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg.transition()
      .duration(750)
      .call(t => group0.transition(t).remove()
        .attrTween("opacity", () => d3.interpolate(1, 0))
        .call(position, d))
      .call(t => group1.transition(t)
        .call(position, d.parent));
  }
}
draw();