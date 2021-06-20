async function draw() {

  const dimensions = {
    width: 800,
    height: 800,
    margin: {
      top: 50,
      right: 180,
      bottom: 50,
      left: 120
    },
    nodeWidth: 15
  }
  dimensions.wrapperWidth = dimensions.width + dimensions.margin.left + dimensions.margin.right;
  dimensions.wrapperHeight = dimensions.height + dimensions.margin.top + dimensions.margin.top;

  const links = await d3.csv("data3.csv");
  links.map(l => {
    l.value = +l.value;
    l.count = +l.count;
  });
  const nodes = Array.from(new Set(links.flatMap(l => [l.source, l.target])),
    name => ({
      name,
      category: name.replace(/ .*/, "")
    }));
  nodes.map(d => Object.assign({}, d));
  const data = {
    nodes,
    links,
    units: "qtd"
  }

  const sankey = d3.sankey()
    .nodeId(d => d.name)
    .nodeAlign(d3.sankeyJustify)
    .nodeWidth(dimensions.nodeWidth)
    .nodePadding(5)
    .nodeSort(null)
    .extent([[1, 2], [dimensions.width - 1, dimensions.height - 5]]);

  const sankeyData = sankey(data);
  const colorMunicipio = d3.scaleOrdinal()
    .domain([
      "Centro-Oeste",
      "Nordeste",
      "Norte",
      "Sudeste",
      "Sul"
    ]).range([
      "#f7faaf",
      "#9fe79f",
      "#5dc8ea",
      "#3d60d9",
      "#8553a4"
    ]);
  const colorFuncao = d3.scaleOrdinal()
    .domain([
      "Monitoramento do fluxo de pessoas",
      "Telemedicina",
      "Monitoramento de temperatura",
      "Rastreamento de contatos",
      "Identificação de pessoas",
      "Fornecimento de informações",
      "Mapeamento da evolução da COVID-19",
      "Digitalização de serviços públicos",
      "Monitoramento de uso de máscara"
    ]).range([
      "#f73848",
      "#de4d4a",
      "#f57f4e",
      "#fed382",
      "#fee1d4",
      "#edd391",
      "#f5a034",
      "#edfdb6",
      "#ffffff"
    ]);

  const wrapper = d3.select("#chart-sankey")
    .append("svg")
    .attr("viewBox", "0 0 " + dimensions.wrapperWidth + " " + dimensions.wrapperHeight)
    .attr("width", "100%");

  const bounds = wrapper.append("g")
    .attr("transform", "translate(" + dimensions.margin.left + ", " + dimensions.margin.top + ")");

  bounds.append("g")
    .attr("stroke", "none")
    .selectAll("rect")
    .data(sankeyData.nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => (d.x0 > 20 && d.x0 < dimensions.width - 20) ? "#ffffff" : "none")
    // .attr("fill", "#ffffff")
    .append("title")
    .text(d => `${d.name}\n${d.value}`);

  const link = bounds.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.8)
    .selectAll("g")
    .data(sankeyData.links)
    .join("g");

  link.append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => {
      if (d.tipo === "regiao") {
        return colorMunicipio(d.regiao);
      } else {
        return colorFuncao(d.funcao);
      }
    })
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("id", d => "link" + d.index)
    .attr("class", "sankey-link")
    .on("mouseover", (event, element) => {
      d3.selectAll(".sankey-link").attr("stroke-opacity", 0.8)
      d3.select("#link" + element.index).attr("stroke-opacity", 1)
    })
    .on("mouseout", () => {
      d3.selectAll(".sankey-link").attr("stroke-opacity", 0.8)
    });

  link.append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);

  bounds.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(sankeyData.nodes)
    .join("text")
    .attr("x", d => d.x0 < dimensions.width / 2 ? d.x1 - dimensions.nodeWidth - 2 : d.x0 + dimensions.nodeWidth + 2)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < dimensions.width / 2 ? "end" : "start")
    .attr("fill", d => {
      if (d.x0 < 20) {
        if (typeof d.sourceLinks[0] !== 'undefined') {
          return colorMunicipio(d.sourceLinks[0].regiao);
        }
      } else if (d.x0 > dimensions.width - 20) {
        if (typeof d.targetLinks[0] !== 'undefined') {
          return colorFuncao(d.targetLinks[0].funcao);
        }
      }
      return "none";
    })
    .text(d => d.name);

  function dragmove(d) {
    console.log("passou");
    d3.select(this)
      .attr("transform",
        "translate("
        + d.x + ","
        + (d.y = Math.max(
          0, Math.min(height - d.dy, d3.event.y))
        ) + ")");
    sankey.relayout();
    link.attr("d", sankey.link());
  }

}
draw();