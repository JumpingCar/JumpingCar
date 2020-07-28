import * as React from 'react'
import Sketch from './Sketch'
import GeneEditor from './GeneEditor'
import MapEditor from './MapEditor'
import './app.css'

const App: React.FC = () => {
    return (
        <div>
            <Sketch />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <GeneEditor />
                <MapEditor />
            </div>
        </div>
    )
}

export default App
