import React, { createRef, useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface ILinePlotComponent {
  width: number;
  height: number;
  values: number[];
  id: string;
}

const LinePlotComponent = (props: ILinePlotComponent) => {
  const [svg, setSvg] = useState(undefined);
  const [axisAdded, setAxisAdded] = useState(false);

  const svgContainerRef = useRef();

  var margin = { top: 10, right: 30, bottom: 30, left: 60 };
  const height = props.height - margin.top - margin.bottom;
  const width = props.width - margin.left - margin.right;

  useEffect(() => {
    const svg = d3
      .select(`#data_viz_${props.id}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    setSvg(svg);
  }, []);

  useEffect(() => {
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
    if (!svg) return;

    if (!axisAdded) {
      svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      svg.append("g").call(d3.axisLeft(y).ticks(5));
      setAxisAdded(true);
    }

    svg.selectAll(`path`).remove();

    svg
      .append("path")
      .datum(props.values)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x((d, i) => x(i))
          .y((d) => {
            // @ts-ignore
            return y(d);
          })
      );
  }, [props.values, svg]);

  return <div id={`data_viz_${props.id}`} ref={svgContainerRef}></div>;
};

export default LinePlotComponent;
