var myApp = {};

myApp.margins = {top: 10, bottom: 30, left: 25, right: 15};
myApp.cw = 1080;
myApp.ch = 600;
myApp.xScale = undefined;
myApp.yScale = undefined;
myApp.xAxis = undefined;
myApp.yAxis = undefined;



//Escala de cor do mapa
myApp.makeScaleColor = function (data) {
    //console.log(data)
    let min = data[1].qnt
    let max = data[1].qnt
    data.forEach(function (d) {
        if (d.qnt > max) {
            max = d.qnt
        }
        else if ((d.qnt < min) && (d.qnt != 0)) {
            min = d.qnt
        }
    })
    //console.log('min',min,'max',max)
    return d3.scaleLinear().domain([min, max]).range(["yellow", "red"])
}

//
myApp.appendSvg = function (div) {
    let node = d3.select(div).append('svg')
        .attr('width', myApp.cw + myApp.margins.left + myApp.margins.right)
        .attr('height', myApp.ch + myApp.margins.top + myApp.margins.bottom);

    return node;
}

myApp.appendMap = function (svg, chtLine) {
    var path = d3.geoPath()
    let names = [];
    let eventsByYear = []
    d3.tsv("us-state-names.tsv", function (tsv) {
        // extract just the names and Ids
        tsv.forEach(function (d, i) {
            names[parseInt(d.id)] = {"name": d.name, "qnt": 0};
        });
        for (let i = 2013; i < 2019; i++) {
            for (let j = 1; j < 13; j++) {
                let stringData
                if (j < 10) {
                    stringData = i + "-0" + j
                }
                else {
                    stringData = i + "-" + j
                }
                let novaData = {
                    year: stringData,
                    qnt: 0
                }
                eventsByYear.push(novaData)
            }
        }
        d3.csv("gun-violence-data.csv", function (err, data) {
            data.forEach(function (d) {
                names.forEach(function (i) {
                    if (i.name === d.state) {
                        i.qnt += 1
                    }

                })
                eventsByYear.forEach(function (j) {
                    if ((d.date.split("-")[0] + "-" + d.date.split("-")[1]) === j.year) {
                        j.qnt += 1
                    }
                })

            })
            //console.log("eventsByYear",eventsByYear)
            d3.json("https://d3js.org/us-10m.v1.json", function (error, us) {
                let myColor = myApp.makeScaleColor(names)
                var states = topojson.feature(us, us.objects.states).features
                if (error) throw error;
                // console.log(path)
                //console.log(states)

                //Criando e pintando os estados
                svg.append("g")
                    .attr("class", "states")
                    .selectAll("path")
                    .data(states)
                    .enter().append("path")
                    .attr("d", path)
                    .style('fill', function (d) {
                            //console.log("d", d)
                            //console.log("color", names[parseInt(d.id)])
                            return myColor(names[parseInt(d.id)].qnt)
                        }
                    )
                    .on("mouseover", function(d) {
                        //console.log(d)
                        var xPosition = d3.mouse(this)[0] - 5;
                        var yPosition = d3.mouse(this)[1] - 5;
                        tooltip.style("display", null).transition().duration(1000)
                        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")").transition().duration(1000);
                        tooltip.select("text").text("Incidentes: "+names[parseInt(d.id)].qnt);

                    })
                     //.on("mouseout", function() { tooltip.style("display", "none").transition().duration(1000); })   // Fica piscando sem parar!!

                //desenhando as fronteiras de cada estado
                svg.append("path")
                    .attr("class", "state-borders")
                    .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
                        // console.log('a:',a)
                        // console.log('b:',b)
                        return a !== b;
                    })))

                svg.append("g")
                    .attr("class", "states-names")
                    .selectAll("text")
                    .data(states)
                    .enter()
                    .append("svg:text")
                    .text(function (d) {
                        //(d, names[parseInt(d.id)].name)
                        return names[parseInt(d.id)].name;
                    })
                    .attr("x", function (d) {
                        return path.centroid(d)[0];
                    })
                    .attr("y", function (d) {
                        return path.centroid(d)[1];
                    })
                    .attr("text-anchor", "middle")
                    .attr('fill', 'black')

                myApp.createAxes(chtLine)

                const lines = d3.line()
                    .x(d=> myApp.xScale(new Date(parseInt(d.year.split("-")[0]), parseInt(d.year.split("-")[1]), 0)))
                    .y(d=> myApp.yScale(d.qnt));
                console.log("Names",names)
                console.log("EventsByYear",eventsByYear)


                chtLine.selectAll("path")
                    .data([eventsByYear])
                    .enter()
                    .append('path')
                    .attr('class', 'line')
                    .attr('fill', 'none')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1')
                    //.attr('d',lines)
                    .attr('d', function (d) {
                        console.log(d)
                        console.log("lineD", myApp.xScale(new Date(parseInt(d.year.split("-")[0]), parseInt(d.year.split("-")[1]), 0)))
                        console.log("myscaleY", myApp.yScale(d.qnt))
                        //os pontos tão chegando corretamento, mas da erro na criação da linha???
                        return d3.line().x(function (d) {
                            console.log("chegou no x?")
                            //console.log("d",d)
                            //let data=new Date(parseInt(d.year.split("-")[0]),parseInt(d.year.split("-")[1]),0)
                            //console.log("DataD",data)
                            return myApp.xScale(new Date(parseInt(d.year.split("-")[0]), parseInt(d.year.split("-")[1]), 0));
                        })
                            .y(function (d) {
                                return myApp.yScale(d.qnt);
                            })

                    })
                //Criando tooltip pro estado mostrar a quantidade de incidentes
                var tooltip = svg.append("g")
                    .attr("class", "tooltip")
                    .style("display", "none");

                tooltip.append("rect")
                    .attr("width", 120)
                    .attr("height", 20)
                    .attr("fill", "white")
                    .style("opacity", 0.8);

                tooltip.append("text")
                    .attr("x", 60)
                    .attr("dy", "1.2em")
                    .style("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("font-weight", "bold");

                //criando a legenda do mapa
                var legend = svg.selectAll('legend')
                    .data(myColor.domain())
                    .enter().append('g')
                    .attr('class', 'legend')
                    .attr('transform', function (d, i) {
                        return 'translate(0,' + i * 20 + ')';
                    });
                legend.append('rect')
                    .attr('x', myApp.cw)
                    .attr('width', 18)
                    .attr('height', 18)
                    .style('fill', myColor);
                legend.append('text')
                    .attr('x', myApp.cw - 6)
                    .attr('y', 9)
                    .attr('dy', '.35em')
                    .style('text-anchor', 'end')
                    .text(function (d) {
                        return d;
                    });
            })
        })
    })
}
//append do chat
myApp.appendChartGroup = function (svg) {
    let chart = svg.append('g')
        .attr('width', myApp.cw)
        .attr('height', myApp.ch)
        .attr('transform', 'translate(' + myApp.margins.left + ',' + myApp.margins.top + ')');
    return chart;
}
//criando os eixos
myApp.createAxes = function (svg) {

    myApp.xScale = d3.scaleTime()
        .domain([new Date(2013, 0, 0), new Date(2019, 0, 0)])
        .rangeRound([0, myApp.cw]);
    myApp.yScale = d3.scaleLinear().domain([20000, 0]).range([0, 300]);
    let xAxisGroup = svg.append('g')
        .attr('class', 'xAxis')
        .attr('transform', 'translate(' + myApp.margins.left + ',' + (300 + myApp.margins.top) + ')');
    let yAxisGroup = svg.append('g')
        .attr('class', 'yAxis')
        .attr('transform', 'translate(' + myApp.margins.left + ',' + myApp.margins.top + ')');

    myApp.xAxis = d3.axisBottom(myApp.xScale);
    myApp.yAxis = d3.axisLeft(myApp.yScale);
    xAxisGroup.call(myApp.xAxis);
    yAxisGroup.call(myApp.yAxis);
}


myApp.run = function () {
    let svgMap = myApp.appendSvg("#mainDivTrab02");
    let svgLine = myApp.appendSvg("#secondDivTrab02");

    let chtLine = myApp.appendChartGroup(svgLine);
    let usaMap = myApp.appendMap(svgMap, chtLine);
    // myApp.appendMap(usaMap)

}

window.onload = myApp.run;