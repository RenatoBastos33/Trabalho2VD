var myApp = {};

myApp.margins = {top: 10, bottom: 30, left: 25, right: 15};
myApp.cw = 1080;
myApp.ch = 600;
myApp.xScale = undefined;
myApp.yScale = undefined;
myApp.xAxis = undefined;
myApp.yAxis = undefined;
myApp.brush = undefined;
myApp.DATA = 0;
myApp.DOT = 1;

myApp.createCirclesData = function (n, label) {
    let circles = [];
    for (let i = 0; i < label.length; i++) {
        for (let id = 0; id < n; id++) {
            let x = (Math.random() * 30) - 10;
            let y = Math.random() * 10;
            let c = {'cx': x, 'cy': y, 'r': 3.5, 'label': label[i]};
            circles.push(c);
        }
    }


    return circles;
}

myApp.createRecData = function (n, label) {
    let recs = [];
    for (let i = 0; i < label.length; i++) {
        for (let id = 1; id < n; id++) {
            let y = Math.random() * 10;
            let r = {'cx': id, 'cy': y, 'label': label[i]};
            recs.push(r)
        }
    }
    return recs
}

myApp.createLinesData = function (n, label) {
    let lines = [];
    for (let i = 0; i < label.length; i++) {
        let line = []
        for (let id = 1; id < n; id++) {
            let y = Math.random() * 10;
            let r = {'cx': id, 'cy': y, 'label': label[i]};
            line.push(r)
        }
        lines.push(line)
    }
    console.log(lines)
    return lines

}



myApp.makeScaleColor = function (data) {
    console.log(data)
    let min = data[1].qnt
    let max = data[1].qnt
    data.forEach(function (d) {
        if (d.qnt > max) {
            max = d.qnt
        }
        else if (d.qnt < min) {
            min = d.qnt
        }
    })
    return d3.scaleLinear().domain([min, max]).range(["yellow", "red"])
}

myApp.appendSvg = function (div) {
    let node = d3.select(div).append('svg')
        .attr('width', myApp.cw + myApp.margins.left + myApp.margins.right)
        .attr('height', myApp.ch + myApp.margins.top + myApp.margins.bottom);

    return node;
}

myApp.appendMap = function (svg,svgLine) {
    var path = d3.geoPath()
    let names = [];
    let eventsByYear=[]
    d3.tsv("us-state-names.tsv", function (tsv) {
        // extract just the names and Ids

        tsv.forEach(function (d, i) {
            names[parseInt(d.id)] = {"name": d.name, "qnt": 0};
        });
        for(let i=2013;i<2019;i++){
            for(let j=1;j<13;j++){
                let stringData=i + "-" + j
                let novaData= {
                    year:stringData,
                    qnt:0
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
                    console.log(d.date.split("-")[0]+"-"+d.date.split("-")[1])
                    console.log(j)
                    if((d.date.split("-")[0]+"-"+d.date.split("-")[1])===j.year){
                        console.log("dData",d.date.split("-")[0]+"-"+d.date.split("-")[1])
                        console.log("jData",j.year)
                        j.qnt+=1
                    }
                })
            })
            console.log("eventsByYear",eventsByYear)
            d3.json("https://d3js.org/us-10m.v1.json", function (error, us) {
                let myColor = myApp.makeScaleColor(names)
                var states = topojson.feature(us, us.objects.states).features
                if (error) throw error;
                // console.log(path)
                console.log(states)
                svg.append("g")
                    .attr("class", "states")
                    .selectAll("path")
                    .data(states)
                    .enter().append("path")
                    .attr("d", path)
                    .style('fill', function (d) {
                            console.log("d", d)
                            console.log("color", names[parseInt(d.id)])
                            return myColor(names[parseInt(d.id)].qnt)
                        }
                    )
                svg.append("path")
                    .attr("class", "state-borders")
                    .attr("d", path(topojson.mesh(us, us.objects.states, function (a, b) {
                        // console.log('a:',a)
                        // console.log('b:',b)
                        return a !== b;
                    })));
                svg.append("g")
                    .attr("class", "states-names")
                    .selectAll("text")
                    .data(states)
                    .enter()
                    .append("svg:text")
                    .text(function (d) {
                        console.log(d, names[parseInt(d.id)].name)
                        return names[parseInt(d.id)].name;
                    })
                    .attr("x", function (d) {
                        return path.centroid(d)[0];
                    })
                    .attr("y", function (d) {
                        return path.centroid(d)[1];
                    })
                    .attr("text-anchor", "middle")
                    .attr('fill', 'black');
            })

        })
    })
}
myApp.appendChartGroup = function (svg) {
    let chart = svg.append('g')
        .attr('width', myApp.cw)
        .attr('height', myApp.ch)
        .attr('transform', 'translate(' + myApp.margins.left + ',' + myApp.margins.top + ')');
    return chart;
}
myApp.createAxes = function (svg, type = myApp.DOT) {
    if (type === myApp.DATA) {
        myApp.xScale = d3.scaleTime()
            .domain([new Date(2000, 0, 0), new Date(2012, 0, 0)])
            .rangeRound([0, myApp.cw]);

    } else {
        myApp.xScale = d3.scaleLinear().domain([0, 600]).range([0, myApp.cw]);
    }
    myApp.yScale = d3.scaleLinear().domain([10, 0]).range([0, 250]);


    let xAxisGroup = svg.append('g')
        .attr('class', 'xAxis')
        .attr('transform', 'translate(' + myApp.margins.left + ',' + (250 + myApp.margins.top) + ')');

    let yAxisGroup = svg.append('g')
        .attr('class', 'yAxis')
        .attr('transform', 'translate(' + myApp.margins.left + ',' + myApp.margins.top + ')');

    myApp.xAxis = d3.axisBottom(myApp.xScale);
    myApp.yAxis = d3.axisLeft(myApp.yScale);
    xAxisGroup.call(myApp.xAxis);
    yAxisGroup.call(myApp.yAxis);
}


// myApp.appendMap=function(div){
//     var projection = d3.geo.albersUsa()
//         .translate([width/2, height/2])    // translate to center of screen
//         .scale([1000]);          // scale things down so see entire US
//     var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
//         .projection(projection);  // tell path generator to use albersUsa projection
//
//     console.log(path)
// }


myApp.run = function () {
    let svgMap = myApp.appendSvg("#mainDivTrab02");
    let svgLine = myApp.appendSvg("#secondDivTrab02");
    let usaMap = myApp.appendMap(svgMap);
    let chtLine = myApp.appendChartGroup(svgLine);
    myApp.createAxes(svgLine);
    // myApp.appendMap(usaMap)

}

window.onload = myApp.run;