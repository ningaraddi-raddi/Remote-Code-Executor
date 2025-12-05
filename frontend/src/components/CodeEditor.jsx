import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import LanguageSelector from './LanguageSelector';

export default function CodeEditor({ onCodeChange, language, setLanguage, code, setCode }) {

    const handleEditorChange = (value) => {
        if (value !== undefined) {
            setCode(value);
            onCodeChange(value);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] rounded-lg border border-gray-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <LanguageSelector language={language} onSelect={setLanguage} />
            </div>
            <div className="flex-grow relative">
                <Editor
                    height="100%"
                    language={language}
                    defaultValue="// Write your code here"
                    value={code}
                    theme="vs-dark"
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                        fontLigatures: true,
                    }}
                />
            </div>
        </div>
    );
}
