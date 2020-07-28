import * as React from 'react'

const GeneEditor: React.FC = () => {
    return (
        <div id="map-editor">
            <h2 className='header'>Map Editor</h2>
            <textarea id="map-editor-textarea"></textarea>
            <div className="buttons">
                <button id="map-import">Import</button>
                <button id="map-export">Export</button>
            </div>
        </div>
    )
}

export default GeneEditor