import Track from './track'
import * as p5 from 'p5'

const sketch = (p: p5): void => {
    const track = new Track()
    p.preload = (): void => {
        return;
    }
    p.setup = (): void => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        track.setup(p)
    }

    p.draw = (): void => {
        p.background(50)
        track.draw(p)
    }
}

new p5(sketch)
