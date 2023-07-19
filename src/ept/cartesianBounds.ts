import { Point } from "types";
import { Bounds } from "./bounds";
import { Key } from "./key";
import { Step } from "./step";

export type CartesianBounds = {
    center: Point,
    length: Point,
}

function min(bounds: CartesianBounds): Point {
    return bounds.center.map((c, i) => c - bounds.length[i] / 2) as Point;
}

function max(bounds: CartesianBounds): Point {
    return bounds.center.map((c, i) => c + bounds.length[i] / 2) as Point;
}

function mid(bounds: CartesianBounds): Point {
    return bounds.center;
}

function step(bounds: CartesianBounds, [a, b, c]: Step): CartesianBounds {
    return {
        center: [
            a ? bounds.center[0] + bounds.length[0] / 4 : bounds.center[0] - bounds.length[0] / 4,
            b ? bounds.center[1] + bounds.length[1] / 4 : bounds.center[1] - bounds.length[1] / 4,
            c ? bounds.center[2] + bounds.length[2] / 4 : bounds.center[2] - bounds.length[2] / 4,
        ],
        length: [
            bounds.length[0] / 2,
            bounds.length[1] / 2,
            bounds.length[2] / 2,
        ],
    }
}

function stepTo(bounds: CartesianBounds, [d, x, y, z]: Key) {
    for (let i = d - 1; i >= 0; --i) {
        bounds = step(bounds, [(x >> i) & 1, (y >> i) & 1, (z >> i) & 1] as Step)
    }
    return bounds
}

function fromBounds(bounds: Bounds): CartesianBounds {
    return {
        center: Bounds.mid(bounds),
        length: [
            Bounds.width(bounds),
            Bounds.depth(bounds),
            Bounds.height(bounds),
        ],
    }
}

function offsetHeight(b: CartesianBounds, zOffset: number): CartesianBounds {
    return {
        center: [
            b.center[0],
            b.center[1],
            b.center[2] + zOffset,
        ],
        length: b.length,
    }
}

export const CartesianBounds = {
    max,
    min,
    mid,
    step,
    stepTo,
    fromBounds,
    offsetHeight
}