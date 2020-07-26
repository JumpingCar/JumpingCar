import Track from './track'
import * as p5 from 'p5'

const sketch = (p: p5): void => {
    const track = new Track()
    p.setup = (): void => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.createSpan("Generations: 0").id("#count").position(20, 20).style('color', '#fff').style('font-size', '30px')
        p.createSpan("Alive: 100").id("#alive").position(20, 60).style('color', '#fff').style('font-size', '30px')
        p.createSpan("Fittest").id("#fittest").position(20, 100).style('color', '#fff').style('font-size', '30px')
        track.setup(p)
    }

    p.draw = (): void => {
        p.background(50)
        track.draw(p)
    }
}

new p5(sketch)
