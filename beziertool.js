class Beziertool{
    constructor(canvas, width, height, color){
        // helpfull declaration since this changes when scope changes
        const self = this;
        // initialize Beziertool
        this.canvas = canvas;
        this.canvas.width = width || 500;
        this.canvas.height = height || 500;
        this.canvas.style.cursor = 'crosshair';
        this.context = canvas.getContext('2d');
        this.context.strokeStyle = color || 'rgba(0,0,0,1)';
        this.bezierCurves = [];

        // some helpfull variables
        this.isSecondPoint = false; // flag if next point added to canvas will be seconPoint of a curve

        this.getCursorPosition = function(event){
            var rect = self.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            return new Point(x, y);
        };

        // eventlisteners
        this.handleMouseDown = function(event){
            var pt = self.getCursorPosition(event);
            pt.drawSquare(self.context);
            if (!self.isSecondPoint){ // starting Point of a new curve
                var curve = new CubicBezierCurve();
                curve.setStart(pt);
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
        };

        // add eventlistener to canvas
        this.canvas.addEventListener("mousedown", this.handleMouseDown, false);

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
        this.SELECT_RADIUS = this.RADIUS + 2;

        this.set = function(x, y){
            self.x = x;
            self.y = y;
        };

        this.drawSquare = function(context){
            context.fillRect(self.x - self.RADIUS, self.y - self.RADIUS, self.RADIUS * 2, self.RADIUS * 2);
        };
    }
};

class CubicBezierCurve {
    constructor(start, end, ctrl1, ctrl2){
        // helpfull definition, this chages when scope changes
        const self = this;

        // initialize CubicBezierCurve
        this.start = start;
        this.end = end;
        this.ctrl1 = ctrl1;
        this.ctrl2 = ctrl2;

        this.drawCurve = function(context){
            self.ctrl1.drawSquare(context);
            self.ctrl2.drawSquare(context);
            context.beginPath();
            context.moveTo(self.start.x, self.start.y);
            context.bezierCurveTo(self.ctrl1.x, self.ctrl1.y, self.ctrl2.x, self.ctrl2.y, self.end.x, self.end.y);
            context.stroke();
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
    }
}
