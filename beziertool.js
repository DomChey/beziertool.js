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

        // some helpfull static variables
        this.RADIUS = 3;

        this.getCursorPosition = function(event){
            var rect = self.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            return new Point(x, y);
        };

        // eventlisteners
        this.handleClick = function(event){
            var pt = self.getCursorPosition(event);
            pt.drawSquare(self.context);
        };

        // add eventlistener to canvas
        this.canvas.addEventListener("click", this.handleClick, false);

        
    }
};

class Point {
    constructor(x, y){
        // helpfull definition since this changes when changing scope
        const self = this;

        //initialize point
        this.xPos = x;
        this.yPos = y;

        this.RADIUS = 3;
        this.SELECT_RADIUS = this.RADIUS + 2;

        this.x = function(){
            return self.xPos;
        };

        this.y = function(){
            return self.yPos;
        };

        this.set = function(x, y){
            self.xPos = x;
            self.yPos = y;
        };

        this.drawSquare = function(context){
            context.fillRect(self.xPos - self.RADIUS, self.yPos - self.RADIUS, self.RADIUS * 2, self.RADIUS * 2);
        };
    }
}
