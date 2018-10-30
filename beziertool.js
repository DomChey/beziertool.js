class Beziertool{
    constructor(canvas, width, height, color){
        // helpfull declaration since this changes when scope changes
        const self = this;
        // initialize Beziertool
        this.canvas = canvas;
        this.canvas.width = width || 500; // default width 500
        this.canvas.height = height || 500; // default height 500
      //  this.canvas.style.cursor = 'crosshair'; // set cursor style to crosshair
        this.context = canvas.getContext('2d'); 
        this.context.strokeStyle = color || 'rgba(0,0,0,1)'; //default color black
        this.context.fillStyle = color || 'rgba(0,0,0,1)';
        this.bezierCurves = []; // keep track of all curves drawn on canvas
        this.allPoints = [];  //keep track of all points drawn on canvas
        this.selectedCurves = []; // keep track of curves that are manipulated by dragging their points

        // some helpfull variables
        this.isSecondPoint = false; // flag if next point added to canvas will be seconPoint of a curve
        this.moving = false; //flag if mouse is currently moving

        // calculate position of cursor relative to canvas
        this.getCursorPosition = function(event){
            var rect = self.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            return new Point(x, y);
        };

        // eventlisteners

        // when user presses left mousebutton either a new point is added or if there
        // is a point at this location this point is marked as selected and can now be moved
        this.handleMouseDown = function(event){
            switch (event.which) {
            case 1: // left button was pressed
                self.handleLeftButtonDown(event);
                break;
            case 3: // right button was pressed
                self.handleRightButtonDown(event);
            }
        };

        //when user holds left mouse buttion over a point this point is moved around
        this.handleMouseMove = function(event){
            if (self.moving){
                var pt = self.getCursorPosition(event);
                self.updateSelectedPoint(pt);
                self.render();
            }
        };

        //when user releases left mouse button selected point is unselected
        this.handleMouseUp = function(event){
            self.moving = false;
            if (self.selectedCurves.length > 0){
                for (var i = 0; i < self.selectedCurves.length; i ++){
                    self.selectedCurves[i].selectedPoint = null;
                }
                self.selectedCurves = [];
            }
        };

        // if right button was clicked add a new point and if it was the second point
        // draw a new Bezier curve
        this.handleRightButtonDown = function(event){
            var pt = self.getCursorPosition(event);
            if (self.startOrEndSelected(pt)){ // clicked onto already existing start or end point of another curve
                // give new point exact same coordinates as selected point to avoid inaccuracies
                pt.x = self.selectedCurves[self.selectedCurves.length -1].selectedPoint.x;
                pt.y = self.selectedCurves[self.selectedCurves.length -1].selectedPoint.y;
                // now deselect curve
                self.selectedCurves[self.selectedCurves.length -1].selectedPoint = null;
                self.selectedCurves = [];
            }
            if (!self.isSecondPoint){ // starting Point of a new curve
                var curve = new CubicBezierCurve();
                curve.setStart(pt);
                curve.drawCurve(self.context);
                self.bezierCurves.push(curve);
            }else { // ending point of current curve
                var currCurve = self.bezierCurves[self.bezierCurves.length - 1];
                currCurve.setEnd(pt);
                // calculate vector pointing from start to end 
                var delta = self.calculateDelta(currCurve.start, currCurve.end);
                // scale vector lenght
                var scale = 10;
                // shift control points along a straight line between start end end of curve so curve is initally a line
                var ctrl1 = new Point((currCurve.start.x - delta.x * scale), (currCurve.start.y - delta.y * scale));
                var ctrl2 = new Point((currCurve.end.x + delta.x * scale), (currCurve.end.y + delta.y * scale));
                currCurve.setCtrl1(ctrl1);
                currCurve.setCtrl2(ctrl2);
                currCurve.drawCurve(self.context);
            }
            self.isSecondPoint = !self.isSecondPoint;
        };

        // If user clicked onto an existing point this point should move
        this.handleLeftButtonDown = function(event){
            var pt = self.getCursorPosition(event);
            if (self.isPointSelected(pt)) { // clicked on an existing point, so it should move
                self.moving = true;
            }
        };

        // add eventlisteners to canvas
        this.canvas.addEventListener("mousedown", this.handleMouseDown, false);
        this.canvas.addEventListener("mousemove", this.handleMouseMove, false);
        this.canvas.addEventListener("mouseup", this.handleMouseUp, false);
        this.canvas.addEventListener("contextmenu", event => event.preventDefault()); // prevent opening of contextmenu when rigthclicking on canvas

        // calculate a vector along the line from start to end point and normalize it 
        this.calculateDelta = function(startPt, endPt){
            var DeltaX = endPt.x - startPt.x;
            var DeltaY = endPt.y - startPt.y;
            var DeltaLength = Math.sqrt(Math.pow(DeltaX, 2) + Math.pow(DeltaY, 2));
            return new Point((DeltaX/DeltaLength), (DeltaY/DeltaLength));
        };

        // clear the canvas
        this.clear = function(){
            self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
        };

        // clear the canvas and redraw all curves
        this.render = function(){
            self.clear();
            for (var i = 0; i < self.bezierCurves.length; i++){
                self.bezierCurves[i].drawCurve(self.context);
            }
        };

        // is there a point at the location currently clicked on? And if so mark this point
        // and the curve it belongs to as selected 
        this.isPointSelected = function(point){
            for (var i = self.bezierCurves.length -1 ; i >= 0; i--){ // start from end of bezierCurves so the points added later are on top of older points
                if (self.bezierCurves[i].contains(point)){
                    // since different curves share points add all curves whose points were selected
                    self.selectedCurves.push(self.bezierCurves[i]);
                }
            }
            if (self.selectedCurves.length > 0){ // are there any selected curves?
                return true;
            } else {
                return false;
            }
        };

        // check if user clicked on existing start or end point of a curve as a new start or end point
        // for a new curve and if so mark this point and the curve it belongs to as selected
        this.startOrEndSelected = function(point){
            for (var i = 0; i < self.bezierCurves.length; i++){
                if (self.bezierCurves[i].startOrEndClicked(point)){
                    self.selectedCurves.push(self.bezierCurves[i]);
                    return true;
                }
            }
            return false;
        };

        // if selected point is moved around update its coordinates and redraw the canvas
        this.updateSelectedPoint = function(newPos){
            for (var i = 0; i < self.selectedCurves.length; i++){
                self.selectedCurves[i].updateSelectedPoint(newPos);
            }
            self.render();
        };

        // deletes point added last
        this.deleteLatestPoint = function(){
            if (self.bezierCurves.length > 0){ // are there any curves
                // get the curve added last 
                var lastCurve = self.bezierCurves[self.bezierCurves.length - 1];
                if (!lastCurve.isSaved()){
                    if (lastCurve.hasEndPoint()){ // curve has an ending point
                        // remove ending point and the control points
                        lastCurve.removeEndPoint();
                        self.isSecondPoint = true;
                    } else { // curve has only a starting point
                        // remove entire curve
                        self.bezierCurves.pop();
                        self.isSecondPoint = false;
                    }
                    // since curves changed render everything
                    self.render();
                }
            }
        };

        // save all curves not saved so far. Saved curves can no longer be manipulated
        this.saveAllUnsavedCurves = function(){
            for (var i = 0; i < self.bezierCurves.length; i++){
                if (!self.bezierCurves[i].isSaved()){ // curve not saved so far
                    self.bezierCurves[i].save(); // save it
                }
            }
            // curves changed, render everything
            self.render();
        };

    }
}

class Point {
    constructor(x, y){
        // helpfull definition since this changes when changing scope
        const self = this;

        //initialize point
        this.x = x;
        this.y = y;

        this.RADIUS = 3;
        this.SELECT_RADIUS = this.RADIUS;

        // give point new coordinates
        this.set = function(x, y){
            self.x = x;
            self.y = y;
        };

        // draw a suare around the point coordinates
        this.drawSquare = function(context){
            context.fillRect(self.x - self.RADIUS, self.y - self.RADIUS, self.RADIUS * 2, self.RADIUS * 2);
        };

        // does user clicked on a point?
        this.intersect = function(point){
            var xIntersect = point.x >= self.x - self.SELECT_RADIUS && point.x <= self.x + self.SELECT_RADIUS;
            var yIntersect = point.y >= self.y - self.SELECT_RADIUS && point.y <= self.y + self.SELECT_RADIUS;
            return xIntersect && yIntersect;
        };
    }
}

class CubicBezierCurve {
    constructor(start, end, ctrl1, ctrl2){
        // helpfull definition, this chages when scope changes
        const self = this;

        // initialize CubicBezierCurve
        this.start = start; // start point
        this.end = end; // end point
        this.ctrl1 = ctrl1; // control point for start point
        this.ctrl2 = ctrl2; // control point for end point
        this.selectedPoint = null; // keep track of a selected Point
        this.saved = false; // saved curves can no longer be modified and their control points will be hidden

        // draw curve on canvas: draw squares around all existing points and lines
        // between points and their control points and the cubic bezier curve between
        // start and ending point. If curve is saved its control points will not be
        // drawn and its start and ending point and the curve itself will be drawn transparent
        this.drawCurve = function(context){
            if (self.saved){ // curve is saved it should be drawn transparent
                context.save();
                context.globalAlpha = 0.4;
            }
            if (self.start){
                self.start.drawSquare(context);
            }
            if (self.ctrl1 && !self.saved){ // if curve is saved do not draw control points
                context.save();
                context.globalAlpha = 0.4;
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
            if (self.ctrl2 && !self.saved){ // if curve is saved do not draw control points
                context.save();
                context.globalAlpha = 0.4;
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
            if (self.saved){ // restore original context after manipulating alpha value
                context.restore();
            }
        };

        // set start point of curve
        this.setStart = function(start){
            self.start = start;
        };

        // set end point of curve
        this.setEnd = function(end){
            self.end = end;
        };

        // set control point for start point of curve
        this.setCtrl1 = function(ctrl1){
            self.ctrl1 = ctrl1;
        };

        // set control point for end point of curve
        this.setCtrl2 = function(ctrl2){
            self.ctrl2 = ctrl2;
        };

        // does user clicked on one of the points if the curve?
        this.contains = function(point){
            if (self.saved){ // curve is saved it can no longer be selected
                return false;
            }
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

        // does user clicked on start or end point of the curve?
        this.startOrEndClicked = function(point){
            if (self.saved){ // curve is saved it can no longer be selected
                return false;
            }
            if(self.start && self.start.intersect(point)){
                self.selectedPoint = self.start;
                return true;
            } else if (self.end && self.end.intersect(point)){
                self.selectedPoint = self.end;
                return true;
            } else {
                return false;
            }
        };

        // update point that user draggs around
        this.updateSelectedPoint = function(newPos){
            self.selectedPoint.set(newPos.x, newPos.y);
        };

        // is curve saved
        this.isSaved = function(){
            return self.saved;
        };

        // save the curve this means it can no longer be manipulated
        this.save = function(){
            self.saved = true;
        };

        // does curve has an end point?
        this.hasEndPoint = function(){
            if (self.end){
                return true;
            } else {
                return false;
            }
        };

        // does curve has a start point?
        this.hasStartPoint = function(){
            if (self.start){
                return true;
            } else {
                return false;
            }
        };

        // remove end point of curve, this also removes the control points ofs
        // the curve. No need to control a curve that has only a start point
        this.removeEndPoint = function(){
            self.end = null;
            self.ctrl1 = null;
            self.ctrl2 = null;
        };
    }
}
