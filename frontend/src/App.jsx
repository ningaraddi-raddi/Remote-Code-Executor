import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import OutputTerminal from './components/OutputTerminal';
import { executeCode, getStatus } from './api/api';
import { Code2 } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('console.log("Hello World");');
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput(null);
    setIsError(false);

    try {
      // 1. Submit Job
      const { jobId } = await executeCode(language, code);

      // 2. Poll Status
      const intervalId = setInterval(async () => {
        try {
          const statusResult = await getStatus(jobId);

          if (statusResult.status === 'Completed' || statusResult.status === 'Error') {
            clearInterval(intervalId);
            setIsLoading(false);

            // Format output mainly for logs
            if (statusResult.output) {
              setOutput(statusResult.output.split('\n'));
            } else if (statusResult.error) {
              setOutput([statusResult.error]);
              setIsError(true);
            }

            if (statusResult.status === 'Error') {
              setIsError(true);
            }
          }
        } catch (err) {
          console.error(err);
          clearInterval(intervalId);
          setIsLoading(false);
          setIsError(true);
          setOutput(["Error fetching execution status."]);
        }
      }, 1000);

    } catch (error) {
      setIsLoading(false);
      setIsError(true);
      setOutput(["Failed to submit execution job."]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 bg-[#0f0f10]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Code2 size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Remote Code Executor
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Editor Section */}
          <div className="h-full min-h-[500px]">
            <CodeEditor
              language={language}
              setLanguage={setLanguage}
              code={code}
              setCode={setCode}
              onCodeChange={() => { }}
            />
          </div>

          {/* Output Section */}
          <div className="h-full min-h-[500px]">
            <OutputTerminal
              output={output}
              isLoading={isLoading}
              onRun={handleRunCode}
              isError={isError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
