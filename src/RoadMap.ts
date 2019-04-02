import {vec3, vec4, mat3, mat4, quat} from 'gl-matrix';
import Turtle from './Turtle';

class RoadMap {
    turtle: Turtle;
    turtleStack: Turtle[];
    roadStack: Turtle[];
    map: Uint8Array;
    height: number;
    width: number;
    branches: number;

    transforms: mat4[] = [];

    // Store roads as sets of edges and intersections to connect roads
    edges: Edge[] = [];
    highwayEdges: Edge[] = [];
    intersections: Intersection[] = [];

    constructor(texture: Uint8Array) {
        this.map = new Uint8Array(texture.length);
        for (var i = 0; i < texture.length; i++) {
            this.map[i] = texture[i];
        }
        // Turtle will begin from a random point in the bounds of the screen
        this.turtle = new Turtle(vec3.fromValues(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, 0.0), quat.create());

        console.log(this.turtle.position);
        this.turtleStack = new Array();
        this.turtleStack.push(this.turtle);
        let intersection = new Intersection(this.turtle.position);
        this.intersections.push(intersection);
        this.branches = 2;
        // Draw highways first
        this.drawHighways();
        // Draw grids/smaller streets
        this.drawGrids();
    }

    // Generate Highways
    drawHighways() {
        // Generate initial turtles
        this.initialTurtles();

        let count: number = 0;

        // Basic road branching: main roads follow population density as a metric for directional bias
        while (this.turtleStack.length > 0) {
            if (count > 100) return;
            
            this.turtle = this.turtleStack.pop();
            
            // Choose which way to go to follow population density
            let new1 = new Turtle(vec3.fromValues(this.turtle.position[0],this.turtle.position[1], this.turtle.position[2]), this.turtle.orientation);
            let new2 = new Turtle(vec3.fromValues(this.turtle.position[0],this.turtle.position[1], this.turtle.position[2]), this.turtle.orientation);
            
            let rot1 = this.randomAngle();
            let rot2 = this.randomAngle();

            new1.rotate(rot1, 0, 0);
            new1.moveForward(0.1);
            let popDens1 = this.getPopDensity(new1.position);

            new2.rotate(rot2, 0, 0);
            new2.moveForward(0.1);
            let popDens2 = this.getPopDensity(new2.position);

            if (popDens1 > popDens2) {
                this.turtle.rotate(rot1, 0, 0);
            } else {
                this.turtle.rotate(rot2, 0, 0);
            }

            // TODO: Using this.branches, branch in 2 or 3 directions

            this.addHighwayEdge();
            this.turtleStack.push(this.turtle);
            count++;
        }
    }

    addHighwayEdge() {
        let testTurtle = new Turtle(vec3.fromValues(this.turtle.position[0],this.turtle.position[1], this.turtle.position[2]), this.turtle.orientation);
        testTurtle.moveForward(0.1);
        let edge = new Edge(this.turtle.position, testTurtle.position, 0.01);
        // TODO: Check intersections
        // Add intersection to intersections array

        this.edges.push(edge);
        this.highwayEdges.push(edge);
        let inter = new Intersection(vec3.fromValues(edge.end[0], edge.end[1], 0.0));
        this.intersections.push(inter);
        this.transforms.push(edge.getTranformation());
        this.turtle.moveForward(0.1);
    }

    // Checkered road networking: roads aligned with global direction vector w/ max block width and length
    drawGrids() {
        // Generate grids
        for (let i = 0; i < this.highwayEdges.length; i++) {
            let currEdge = this.highwayEdges[i];
            
            // TODO: branch in ~90 degree angles
            // forward Turtle

            // left Turtle

            // right Turtle
        }
    }

    // Make multiple turtles for the highway
    initialTurtles() {
        let turtle1 = new Turtle(vec3.fromValues(0.5, 2.0, 0), quat.create());
        let turtle2 = new Turtle(vec3.fromValues(-1.0, 1.0, 0), quat.create());
        let turtle3 = new Turtle(vec3.fromValues(0, 0.1, 0), quat.create());
        this.turtleStack.push(turtle1);
        this.turtleStack.push(turtle2);
        this.turtleStack.push(turtle3);
        let inter1 = new Intersection(turtle1.position);
        let inter2 = new Intersection(turtle2.position);
        let inter3 = new Intersection(turtle3.position);
        this.intersections.push(inter1);
        this.intersections.push(inter2);
        this.intersections.push(inter3);
    }

    randomAngle() : number{
        return (150 * Math.random() - 50);
    }

    // Get the transformation matrices for each edge
    getTransforms() : mat4[] {
        return this.transforms;
    }

    // Check if the road/point will be in water
    inWater(pos: vec3) : boolean {
        let x = Math.floor((pos[0] + 1.0) / 2.0 * this.width);
        let y = Math.floor((pos[1] + 1.0) / 2.0 * this.height);
        let land = this.map[x * 4.0 + y * this.width * 4.0 + 1.0];
        let water = this.map[x * 4.0 + y * this.width * 4.0 + 2.0];

        if (water > land) {
            return true;
        } else {
            return false;
        }
    }

    // Returns population density
    getPopDensity(pos: vec3) : number {
        let x = Math.floor((pos[0] + 1.0) / 2.0 * this.width);
        let y = Math.floor((pos[1] + 1.0) / 2.0 * this.height);
        let pop: number = this.map[x * 4.0 + y * this.width * 4.0 + 2.0];
        return pop;
    }

    // Get point of intersection given two edges
    // Reference: https://github.com/emily-vo/city-forgery/blob/master/src/voronoi.js
    intersectionTest(e: Edge, f: Edge) : Intersection{
        let e1 = e.start;
        let e2 = e.end;
        let f1 = f.start;
        let f2 = f.end;
        let A1 = e2[1] - e1[1];
        let B1 = e1[0] - e2[0];
        var C1 = A1 * e1[0] + B1 * e1[1];
        let A2 = f2[1] - f1[1];
        let B2 = f1[0] - f2[0];
        let C2 = A2 * f1[0] + B2 * f1[1];
        var det = A1 * B2 - A2 * B1;
        if (Math.abs(det) < 0.001) {
            return undefined;
        } else {
			let x = (B2 * C1 - B1 * C2) / det;
            let y = (A1 * C2 - A2 * C1) / det;
            let inter = new Intersection(vec3.fromValues(x, y, 0));
            return inter;
        }
    }

    setBranches(num: number) {
        this.branches = num;
    }

    reset() {
        this.edges = [];
        this.intersections = [];
        this.highwayEdges = [];
        this.transforms = [];    
        this.turtleStack = new Array();
        this.turtle = new Turtle(vec3.fromValues(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, 0.0), quat.create());
    }
}

class Edge {
    start: vec3;
    end: vec3;
    direction: vec3;
    width: number;

    constructor(start: vec3, end: vec3, width: number) {
        this.start = start;
        this.end = end;
        this.width = width;
    }

    getTranformation() : mat4 {
        let transformation: mat4 = mat4.create();

        // Rotate - axis angle
        let axis = vec3.fromValues(0, 0, 1);
        let dir = vec3.create();
        vec3.subtract(dir, this.end, this.start);
        let yVec = vec3.fromValues(0, 1, 0);
        let lengths = vec3.length(yVec) * vec3.length(dir);
        let angle = Math.acos(vec3.dot(yVec, dir) / lengths);
        let rotate = quat.create();
        quat.setAxisAngle(rotate, axis, angle);

        // Translate - get midpoint of edge
        let x = this.start[0] + this.end[0];
        let y = this.start[1] + this.end[1];
        let z = this.start[2] + this.end[2];
        let translate = vec3.fromValues(x/2, y/2, z/2);
        
        // Scale
        let scale = vec3.fromValues(this.width, vec3.length(dir), 1);

        mat4.fromRotationTranslationScale(transformation, rotate, translate, scale);
        return transformation;
    }
}

class Intersection {
    position: vec3;

    constructor(position: vec3) {
        this.position = position;
    }
}
export default RoadMap;