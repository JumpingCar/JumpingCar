import * as React from 'react'
import { useEffect } from 'react'
import Track from '../track'
import * as p5 from 'p5'

const sketch = (p: p5): void => {
    const track = new Track()
    const colorDictionary = [ 
        { label: ' 8% Elites', colorLabel: 'red', color: [252, 53, 3] }, 
        { label: '12% Random', colorLabel: 'orange', color: [252, 152, 3] }, 
        { label: '20% Hard-Mutated', colorLabel: 'lime', color: [173, 252, 3] }, 
        { label: '20% Soft-Mutated', colorLabel: 'blue', color: [3, 161, 252] }, 
        { label: '40% Offspring', colorLabel: 'purple', color: [186, 3, 252] } 
    ]
    p.setup = (): void => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.createSpan("Generations: 0").id("#count").position(20, 20).style('color', '#fff').style('font-size', '30px')
        p.createSpan("Alive: 100 / 100").id("#alive").position(20, 60).style('color', '#fff').style('font-size', '30px')
        p.createSpan("Fittest").id("#fittest").position(20, 100).style('color', '#fff').style('font-size', '30px')
        p.createSpan("Lap Count").id("#lap-count").position(20, 140).style('color', '#fff').style('font-size', '30px')

        for (let i = 0; i < colorDictionary.length; i++) {
            p.createSpan().class('color').position(20, 190 + i * 40).style('background-color', p.color(colorDictionary[i].color[0], colorDictionary[i].color[1], colorDictionary[i].color[2]))
            p.createSpan(colorDictionary[i].label).class('color-label').position(50, 190 + i * 40)
        }

        track.setup(p)
    }

    p.draw = (): void => {
        p.background(50)
        track.draw(p)
    }
}

const Sketch: React.FC = () => {
    const container: React.RefObject<HTMLDivElement> = React.createRef()

    useEffect(() => {
        const canvas = new p5(sketch, container.current)

        return () => { canvas.remove() }
    }, [])

    return <div id="container" ref={container} />
}

export default Sketch