import * as p5 from 'p5'

export default class MathUtils {
    public static triangleSize(a: p5.Vector, b: p5.Vector, c: p5.Vector): number {
        const atob = p5.Vector.sub(b, a)
        const atoc = p5.Vector.sub(c, a)
        const crossed = atob.cross(atoc)
        return Math.abs(crossed.z) / 2
    }
}
