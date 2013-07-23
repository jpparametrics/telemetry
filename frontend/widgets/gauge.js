function Gauge(_config) {
    $('.container').append("<div class=\"widget " + config.id + "\" id=\"widget " + config.id + "\"></div>");

    var self = this;

    this.value = 0;

    var config = _config;
       id = config.id || "guage";

    config.labelTextConfig = {
        size: Math.round(config.size / 9),
        x: config.size / 2,
        y: 3 * config.size / 10,
        anchor: "middle"
    };

    config.valueTextConfig = {
        size: Math.round(config.size / 10),
        x: config.size / 2,
        y: 4 * config.size / 5,
        anchor: "middle"
    };

    config.radius = config.size * 0.97 / 2;

    config.min = config.min || 0;
    config.max = config.max || 100;
    config.range = config.max - config.min;

    config.majorTicks = config.majorTicks || 5;
    config.minorTicks = config.minorTicks || 2;

    config.greenColor  = "#109618";
    config.yellowColor = "#FF9900";
    config.redColor    = "#DC3912";

    this.render = function() {

        svg = d3.select(".widget." + id).append("svg")
            .attr("class", "gauge")
            .attr("width", config.size)
            .attr("height", config.size)
            .style("background-color", "white");

        svg.append("circle")
        .attr("cx", config.size / 2)
        .attr("cy", config.size / 2)
        .attr("r", config.radius)
        .style("fill", "#ccc")
        .style("stroke", "#000")
        .style("stroke-width", "0.5px");

        svg.append("circle")
        .attr("cx", config.size / 2)
        .attr("cy", config.size / 2)
        .attr("r", 0.9 * config.radius)
        .style("fill", "#fff")
        .style("stroke", "#e0e0e0")
        .style("stroke-width", "2px");


        //this.drawBand(config.greenZones[index].from, config.greenZones[index].to, self.config.greenColor);

        var yellowFrom = (config.yellowPercent / 100.0) * config.max;
        var yellowTo = (config.redPercent / 100.0) * config.max;
        var redFrom = (config.redPercent / 100.0) * config.max;
        var redTo = config.max;

        this.drawBand(yellowFrom, yellowTo, self.config.yellowColor);

        this.drawBand(redFrom, redTo, self.config.redColor);

        this.appendText(svg, config.label, config.labelTextConfig);

        var majorDelta = config.range / (config.majorTicks - 1);
        for (var major = config.min; major <= config.max; major += majorDelta) {
            var minorDelta = majorDelta / config.minorTicks;
            for (var minor = major + minorDelta; minor < Math.min(major + majorDelta, config.max); minor += minorDelta) {
                var point1 = this.valueToPoint(minor, 0.75);
                var point2 = this.valueToPoint(minor, 0.85);

                svg.append("line")
                .attr("x1", point1.x)
                .attr("y1", point1.y)
                .attr("x2", point2.x)
                .attr("y2", point2.y)
                .style("stroke", "#666")
                .style("stroke-width", "1px");
            }

            var point1 = this.valueToPoint(major, 0.7);
            var point2 = this.valueToPoint(major, 0.85);

            svg.append("line")
            .attr("x1", point1.x)
            .attr("y1", point1.y)
            .attr("x2", point2.x)
            .attr("y2", point2.y)
            .style("stroke", "#333")
            .style("stroke-width", "2px");

            if (major == config.min || major == config.max) {
                var point = this.valueToPoint(major, 0.63);
                var refTextConfig = {
                    size: Math.round(config.size / 16),
                    x: point.x,
                    y: point.y,
                    anchor: major == config.min ? "start" : "end"
                };

                this.appendText(svg, major, refTextConfig);
            }
        }

        this.render();

        var pointerContainer = svg.append("g").attr("class", "pointerContainer");

        this.drawPointer(this.value);
        pointerContainer.append("circle")
        .attr("cx", config.size / 2)
        .attr("cy", config.size / 2)
        .attr("r", 0.12 * config.radius)
        .style("fill", "#4684EE")
        .style("stroke", "#666")
        .style("opacity", 1);
    };

    // TODO currently duplicated across all widgets... I want inheritence dammit!
    this.putJSON = function(jsonObject) {
        config.controls.forEach(function(control) {
            // TODO bail if source does not cointain '.'
            var source = control.source.split('.');
            if (source[0] == jsonObject.fieldID) {
                if (source[1] in jsonObject) {
                    var value = eval('jsonObject.' + source[1]);
                    self.put(control.label, value);
                }
            }
        });
    };

    this.put = function(controlName, value) {
        this.value = value;
    };

    this.draw = function() {
        this.drawPointer(this.value);
    };

    this.drawBand = function(start, end, color) {
        if (0 >= end - start) return;

        svg.append("path")
        .style("fill", color)
        .attr("d", d3.svg.arc()
            .startAngle(this.valueToRadians(start))
            .endAngle(this.valueToRadians(end))
            .innerRadius(0.65 * config.radius)
            .outerRadius(0.85 * config.radius))
        .attr("transform", function() { return "translate(" + self.config.size / 2 + ", " + self.config.size / 2 + ") rotate(270)"; });
    };

    this.drawPointer = function(value) {
        var delta = config.range / 13,
            head = this.valueToPoint(value, 0.85),
            head1 = this.valueToPoint(value - delta, 0.12),
            head2 = this.valueToPoint(value + delta, 0.12),

            tailValue = value -  (config.range * (1/(270/360)) / 2),
            tail = this.valueToPoint(tailValue, 0.28),
            tail1 = this.valueToPoint(tailValue - delta, 0.12),
            tail2 = this.valueToPoint(tailValue + delta, 0.12),

            data = [head, head1, tail2, tail, tail1, head2, head],

            line = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate("basis"),

            pointerContainer = svg.select(".pointerContainer"),
            pointer = pointerContainer.selectAll("path").data([data]);

        pointer.enter()
            .append("path")
            .attr("d", line)
            .style("fill", "#dc3912")
            .style("stroke", "#c63310")
            .style("fill-opacity", 0.7);

        pointer.transition()
            .attr("d", line)
            .ease("linear")
            .duration(100);

        var container =    pointerContainer.selectAll("text")
            .data([value])
            .text(Math.round(value))
            .enter();

        this.appendText(container, Math.round(value), config.valueTextConfig);
    };

    this.valueToDegrees = function(value) {
        return value / config.range * 270 - 45;
    };

    this.valueToRadians = function(value) {
        return this.valueToDegrees(value) * Math.PI / 180;
    };

    this.valueToPoint = function(value, factor) {
        var point = {
            x: config.size / 2 - config.radius * factor * Math.cos(this.valueToRadians(value)),
            y: config.size / 2 - config.radius * factor * Math.sin(this.valueToRadians(value))
        };

        return point;
    };

    this.appendText = function(obj, text, textConfig) {
        obj.append("text")
            .attr("x", textConfig.x)
            .attr("y", textConfig.y)
            .attr("dy", textConfig.size / 2)
            .attr("text-anchor", textConfig.anchor)
            .text(text)
            .style("font-size", textConfig.size + "px")
            .style("fill", "#333")
            .style("stroke-width", "0px");
    };
}
