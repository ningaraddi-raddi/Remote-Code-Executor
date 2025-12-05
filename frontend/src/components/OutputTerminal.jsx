import React from 'react';
import { Terminal, XCircle, CheckCircle, Loader2, Play } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export default function OutputTerminal({ output, isLoading, isError, onRun }) {
    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] rounded-lg border border-gray-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-gray-800">
                <div className="flex items-center gap-2 text-gray-400">
                    <Terminal size={18} />
                    <span className="text-sm font-medium">Output Terminal</span>
                </div>

                <button
                    disabled={isLoading}
                    onClick={onRun}
                    className={twMerge(
                        "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
                        isLoading
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 active:scale-95"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <Play size={16} className="fill-current" />
                            <span>Run Code</span>
                        </>
                    )}
                </button>
            </div>

            <div className="flex-grow p-4 font-mono text-sm overflow-auto text-gray-300 relative bg-[#0f0f10]">
                {output ? (
                    <div className="space-y-2">
                        {output.map((line, i) => (
                            <div key={i} className="break-words">{line}</div>
                        ))}
                        {isError && (
                            <div className="text-red-400 flex items-center gap-2 mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md">
                                <XCircle size={16} />
                                <span>Process exited with error</span>
                            </div>
                        )}
                        {!isError && !isLoading && (
                            <div className="text-green-400 flex items-center gap-2 mt-4 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-md">
                                <CheckCircle size={16} />
                                <span>Execution Successful</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <Terminal size={48} className="mb-4 opacity-20" />
                        <p>Run your code to see the output here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
