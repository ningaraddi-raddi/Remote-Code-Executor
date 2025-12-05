import React from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const LANGUAGE_VERSIONS = {
    javascript: '18.15.0',
    typescript: '5.0.3',
    python: '3.10.0',
    java: '15.0.2',
    csharp: '6.12.0',
    php: '8.2.3',
};

const languages = Object.entries(LANGUAGE_VERSIONS);

export default function LanguageSelector({ language, onSelect }) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative ml-2 mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Language:</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-48 px-3 py-2 bg-[#1e1e1e] border border-gray-700 rounded-md text-gray-200 hover:border-blue-500 transition-colors"
            >
                <span className="capitalize">{language}</span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-[#1e1e1e] border border-gray-700 rounded-md shadow-lg max-h-[300px] overflow-auto">
                    {languages.map(([lang, version]) => (
                        <div
                            key={lang}
                            onClick={() => {
                                onSelect(lang);
                                setIsOpen(false);
                            }}
                            className={twMerge(
                                "px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors flex justify-between items-center",
                                lang === language ? "bg-gray-800 text-blue-400" : "text-gray-300"
                            )}
                        >
                            <span className="capitalize">{lang}</span>
                            <span className="text-xs text-gray-500">v{version}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
