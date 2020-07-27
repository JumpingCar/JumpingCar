import * as React from 'react'
import { useState, useCallback } from 'react'

interface GeneEditorProps {
    handleGeneExport: (val: string) => void
    handleGeneImport: (val: string) => void
}

const GeneEditor: React.FC<GeneEditorProps> = ({ handleGeneExport, handleGeneImport }: GeneEditorProps) => {
    const [editorText, setEditorText] = useState('')

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => { setEditorText(e.target.value) }, 
        []
    )

    const handleExport = useCallback(
        () => { handleGeneExport(editorText) }, 
        [editorText]
    )

    const handleImport = useCallback(
        () => { handleGeneImport(editorText) }, 
        [editorText]
    )

    return (
        <div id="gene-editor">
            <h2 className='header'>Gene Editor</h2>
            <textarea onChange={handleChange}></textarea>
            <div className="buttons">
                <button onClick={handleImport}>Apply</button>
                <button onClick={handleExport}>Export</button>
            </div>
        </div>
    )
}

export default GeneEditor