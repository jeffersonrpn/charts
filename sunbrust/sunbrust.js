async function draw() {
  const idAcessor = d => d.id;
  const nameAcessor = d => d.name;
  const parentAcessor = d => d.parent;
  const valueAcessor = d => +d.value;

  const dimensions = {
    width: 800
  }
  dimensions.radius = dimensions.width / 7;

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

  const color = d3.scaleOrdinal().domain([
    "Armazenamento",
    "Digitalização de serviços públicos",
    "Fornecimento de informações",
    "Identificação de pessoas",
    "Mapeamento da evolução da COVID-19",
    "Monitoramento de temperatura",
    "Monitoramento de uso de máscara",
    "Monitoramento do fluxo de pessoas",
    "Rastreamento de contatos",
    "Telemedicina",
    "Não informado",
  ]).range([
    "#c7f64a",
    "#1ebf70",
    "#87e089",
    "#7095f1",
    "#755285",
    "#dedab4",
    "#b7a1ff",
    "#2e2f46",
    "#87e0d4",
    "#3d60d9",
    "blue"
  ]);

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(dimensions.radius * 5)
    .innerRadius(d => d.y0 * dimensions.radius)
    .outerRadius(d => Math.max(d.y0 * dimensions.radius, d.y1 * dimensions.radius - 3))

  const wrapper = d3.select("#chart-sunbrust")
    .append("svg")
    .attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.width)
    .attr("width", "100%");

  const bounds = wrapper.append("g")
    .attr("transform", `translate(${dimensions.width / 2}, ${dimensions.width / 2})`);

  const tooltip = wrapper.append("foreignObject")
    .attr("class", "chart-tooltip")
    .attr("x", 60)
    .attr("y", 0)
    .attr("width", 150)
    .attr("height", 100)
    .style("display", "none");
  const tooltipContent = tooltip.append('xhtml:div')
    .attr("class", "chart-tooltip-content");
  const tooltipTitle = tooltipContent.append('div')
    .attr('class', 'chart-tooltip-title');
  const tooltipBody = tooltipContent.append('div')
    .attr('class', 'chart-tooltip-body');

  const path = bounds.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("id", d => `arco-${d.data.data.id}`)
    .attr("class", d => `arcos arcos-${d.data.data.parent}`)
    .attr("fill", (d, i) => {
      if (d.depth > 1) {
        return color(d.data.data.name);
      }
      return (i % 2) ? "#d2d2d2" : "#bababa";
    })
    .attr("fill-opacity", 1)
    .attr("d", d => arc(d))
    .style("cursor", "pointer")
    .on("mouseover", (e, d) => {
      if (d.depth > 1) {
        d3.selectAll(".arcos").style("opacity", 0.2);
        d3.select("#arco-" + d.data.data.id).style("opacity", 1);
      } else {
        d3.selectAll(".arcos").style("opacity", 0.2);
        d3.selectAll(`.arcos-${d.data.data.name}`).style("opacity", 1);
        d3.select("#arco-" + d.data.data.id).style("opacity", 1);
      }
    })
    .on("mouseout", (e, d) => {
      d3.selectAll(".arcos").style("opacity", 1);
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

}
draw();