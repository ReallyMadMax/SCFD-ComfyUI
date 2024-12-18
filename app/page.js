"use client"
import React, { useState, useEffect } from 'react';
import CheckpointSelector from './components/CheckpointSelector';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checkpoints, setCheckpoints] = useState([]);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState('prefectPonyXL_v3.safetensors');
    
    // Generation dimensions (controlled by sliders)
    const [genWidth, setGenWidth] = useState(768);
    const [genHeight, setGenHeight] = useState(768);
    
    const [serverAddress, setServerAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [connectionLoading, setConnectionLoading] = useState(false);

    const containerRef = React.useRef(null);

    const handleConnect = async () => {
        setConnectionLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serverAddress }),
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to connect to server');
            }

            setIsConnected(true);
            fetchCheckpoints();
        } catch (err) {
            setError('Connection failed: ' + err.message);
            setIsConnected(false);
        } finally {
            setConnectionLoading(false);
        }
    };

    const fetchCheckpoints = async () => {
        try {
            const response = await fetch('/api/checkpoints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serverAddress }),
            });
            const data = await response.json();
            
            if (data.success && data.checkpoints) {
                setCheckpoints(data.checkpoints);
                if (data.checkpoints.length > 0 && !data.checkpoints.includes(selectedCheckpoint)) {
                    setSelectedCheckpoint(data.checkpoints[0]);
                }
            } else {
                throw new Error(data.error || 'No checkpoints found');
            }
        } catch (err) {
            setError('Failed to fetch checkpoints: ' + err.message);
        }
    };

    const handleCheckpointChange = (checkpoint) => {
        setSelectedCheckpoint(checkpoint);
    };

    const handleGenerate = async () => {
        if (!isConnected) {
            setError('Please connect to a server first');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt,
                    negativePrompt,
                    width: genWidth,
                    height: genHeight,
                    checkpoint: selectedCheckpoint,
                    serverAddress
                }),
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }

            setImageData(data.imageData);
        } catch (err) {
            setError('Failed to generate image: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100">
            <div className="container mx-auto px-4 py-8 flex flex-col h-screen" ref={containerRef}>
                <div className="flex justify-between items-center mb-8 flex-none">
                    <h1 className="text-3xl font-bold text-blue-400">
                        Image Generator
                    </h1>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={serverAddress}
                            onChange={(e) => setServerAddress(e.target.value)}
                            placeholder="ComfyUI address EX: 10.0.0.60:8188"
                            className="w-64 p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            disabled={isConnected}
                        />
                        <button
                            onClick={handleConnect}
                            disabled={connectionLoading || !serverAddress || isConnected}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors min-w-[100px]"
                        >
                            {connectionLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </span>
                            ) : isConnected ? (
                                'Connected'
                            ) : (
                                'Connect'
                            )}
                        </button>
                    </div>
                </div>
    
                {error && (
                    <div className="text-red-400 bg-red-900/50 px-4 py-2 rounded-lg mb-4 flex-none">
                        {error}
                    </div>
                )}
    
                <div className="flex gap-8 min-h-0 flex-grow overflow-auto">
                    <div className="w-64 bg-gray-800 p-4 rounded-lg h-fit space-y-6 flex-none">
                        <h2 className="text-lg font-semibold mb-4">Generation Settings</h2>
                        
                        <CheckpointSelector
                            checkpoints={checkpoints}
                            selectedCheckpoint={selectedCheckpoint}
                            onCheckpointChange={handleCheckpointChange}
                        />
    
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Width: {genWidth}px
                            </label>
                            <input
                                type="range"
                                min="512"
                                max="1024"
                                step="64"
                                value={genWidth}
                                onChange={(e) => setGenWidth(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
    
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Height: {genHeight}px
                            </label>
                            <input
                                type="range"
                                min="512"
                                max="1024"
                                step="64"
                                value={genHeight}
                                onChange={(e) => setGenHeight(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
    
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="bg-gray-800 rounded-lg p-4 shadow-lg w-full h-full flex items-center justify-center overflow-auto">
                            {imageData ? (
                                <img
                                    src={imageData}
                                    alt="Generated"
                                    className="rounded-lg w-auto h-auto object-contain max-w-full max-h-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <span className="text-gray-400">Generated image will appear here</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
    
                <div className="w-full max-w-2xl mx-auto bg-gray-800 p-4 rounded-lg shadow-lg mt-8 flex-none">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your prompt..."
                                className="flex-grow p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !prompt || !isConnected}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate'
                                )}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="Enter negative prompt..."
                            className="w-full p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}