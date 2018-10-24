class Beziertool{
    constructor(canvas, width, height, color){
        // helpfull declaration since this changes when scope changes
        const self = this;
        // initialize Beziertool
        this.canvas = canvas;
        this.canvas.width = width || 500; // default width 500
        this.canvas.height = height || 500; // default height 500
        this.canvas.style.cursor = 'crosshair'; // set cursor style to crosshair
        this.context = canvas.getContext('2d'); 
        this.context.strokeStyle = color || 'rgba(0,0,0,1)'; //default color black
        this.bezierCurves = []; // keep track of all curves drawn on canvas
        this.allPoints = [];  //keep track of all points drawn on canvas
        this.selectedCurve; // keep track of curve that is manipulated by dragging its points

        // some helpfull variables
        this.isSecondPoint = false; // flag if next point added to canvas will be seconPoint of a curve
        this.mouseDown = false; // flag if mouse is currently pressed
        this.moving = false; //flag if mouse is currently moving

        // calculate position of cursor relative to canvas
        this.getCursorPosition = function(event){
            var rect = self.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            return new Point(x, y);
        };

        // eventlisteners

        // when user presses left mousebutton
        this.handleMouseDown = function(event){
            self.mouseDown = true;
            var pt = self.getCursorPosition(event);
            if (self.isPointSelected(pt)) { // clicked on an existing point, so it should move
                self.moving = true;
                //TODO moving stuff
            } else { // add new point
                self.moving = false;
                if (!self.isSecondPoint){ // starting Point of a new curve
                    var curve = new CubicBezierCurve();
                    curve.setStart(pt);
                    curve.drawCurve(self.context);
                    self.bezierCurves.push(curve);
                    self.isSecondPoint = !self.isSecondPoint;
                }else { // ending point of current curve
                    var currCurve = self.bezierCurves[self.bezierCurves.length - 1];
                    currCurve.setEnd(pt);
                    currCurve.setCtrl1(new Point(currCurve.start.x-10, currCurve.start.y-10));
                    currCurve.setCtrl2(new Point(pt.x+10, pt.y+10));
                    currCurve.drawCurve(self.context);
                    self.isSecondPoint = !self.isSecondPoint;
                }
            }
        };

        //when user holds left mouse button
        this.handleMouseMove = function(event){
            if (self.moving){
                var pt = self.getCursorPosition(event);
                self.updateSelectedPoint(pt);
                self.render();
            }
        };

        //when user releases left mouse button
        this.handleMouseUp = function(event){
            self.moving = false;
            self.mouseDown = false;
            if (self.selectedCurve){
                self.selectedCurve.selectedPoint = null;
                self.selectedCurve = null;
            }
        };

        // add eventlisteners to canvas
        this.canvas.addEventListener("mousedown", this.handleMouseDown, false);
        this.canvas.addEventListener("mousemove", this.handleMouseMove, false);
        this.canvas.addEventListener("mouseup", this.handleMouseUp, false);

        this.clear = function(){
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
        };

        this.render = function(){
            self.clear();
            for (var i = 0; i < self.bezierCurves.length; i++){
                self.bezierCurves[i].drawCurve(self.context);
            }
        };

        this.isPointSelected = function(point){
            for (var i = 0; i < self.bezierCurves.length; i++){
                if (self.bezierCurves[i].contains(point)){
                    self.selectedCurve = self.bezierCurves[i];
                    return true;
                }
            }
            return false;
        };

        this.updateSelectedPoint = function(newPos){
            self.selectedCurve.updateSelectedPoint(newPos);
            self.render();
        };

    }
};

class Point {
    constructor(x, y){
        // helpfull definition since this changes when changing scope
        const self = this;

        //initialize point
        this.x = x;
        this.y = y;

        this.RADIUS = 3;

        this.set = function(x, y){
            self.x = x;
            self.y = y;
        };

        this.drawSquare = function(context){
            context.fillRect(self.x - self.RADIUS, self.y - self.RADIUS, self.RADIUS * 2, self.RADIUS * 2);
        };

        this.intersect = function(point){
            var xIntersect = point.x >= self.x - self.RADIUS && point.x <= self.x + self.RADIUS;
            var yIntersect = point.y >= self.y - self.RADIUS && point.y <= self.y + self.RADIUS;
            return xIntersect && yIntersect;
        };
    }
};

class CubicBezierCurve {
    constructor(start, end, ctrl1, ctrl2){
        // helpfull definition, this chages when scope changes
        const self = this;

        // initialize CubicBezierCurve
        this.start = start; // start point
        this.end = end; // end point
        this.ctrl1 = ctrl1; // control point for start point
        this.ctrl2 = ctrl2; // control point for end point
        this.selectedPoint; // keep track of a selected Point

        this.drawCurve = function(context){
            if (self.start){
                self.start.drawSquare(context);
            }
            if (self.ctrl1){
                context.save();
                context.fillStyle = 'gray';
                context.strokeStyle = 'gray';
                context.beginPath();
                context.moveTo(self.start.x, self.start.y);
                context.lineTo(self.ctrl1.x, self.ctrl1.y);
                context.stroke();
                self.ctrl1.drawSquare(context);
                context.restore();
            }
            if (self.end){
                self.end.drawSquare(context);
            }
            if (self.ctrl2){
                context.save();
                context.fillStyle = 'gray';
                context.strokeStyle = 'gray';
                context.beginPath();
                context.moveTo(self.end.x, self.end.y);
                context.lineTo(self.ctrl2.x, self.ctrl2.y);
                context.stroke();
                self.ctrl2.drawSquare(context);
                context.restore();
            } if (self.start && self.end && self.ctrl1 && self.ctrl2){
                context.beginPath();
                context.moveTo(self.start.x, self.start.y);
                context.bezierCurveTo(self.ctrl1.x, self.ctrl1.y, self.ctrl2.x, self.ctrl2.y, self.end.x, self.end.y);
                context.stroke();
            }
        };

        this.setStart = function(start){
            self.start = start;
        };

        this.setEnd = function(end){
            self.end = end;
        };

        this.setCtrl1 = function(ctrl1){
            self.ctrl1 = ctrl1;
        };

        this.setCtrl2 = function(ctrl2){
            self.ctrl2 = ctrl2;
        };

        this.contains = function(point){
            if(self.start && self.start.intersect(point)){
                self.selectedPoint = self.start;
                return true;
            } else if (self.ctrl1 && self.ctrl1.intersect(point)){
                self.selectedPoint = self.ctrl1;
                return true;
            } else if (self.end && self.end.intersect(point)){
                self.selectedPoint = self.end;
                return true;
            } else if (self.ctrl2 && self.ctrl2.intersect(point)){
                self.selectedPoint = self.ctrl2;
                return true;
            } else {
                return false;
            }
        };

        this.updateSelectedPoint = function(newPos){
            self.selectedPoint.set(newPos.x, newPos.y);
        };
    }
}
