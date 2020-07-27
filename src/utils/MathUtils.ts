import * as p5 from 'p5'

export default class MathUtils {
    public static triangleSize(a: p5.Vector, b: p5.Vector, c: p5.Vector): number {
        const atob = p5.Vector.sub(b, a)
        const atoc = p5.Vector.sub(c, a)
        const crossed = atob.cross(atoc)
        return Math.abs(crossed.z) / 2
    }

    // (x1, y1) - (x2, y2): line | (x3, y3): dot
    public static lineDotDistance(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        return Math.abs(x1 * y2 + x2 * y3 + x3 * y1 - x2 * y1 - x3 * y2 - x1 * y3) / Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
    }

}
