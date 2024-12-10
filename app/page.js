"use client"
import React, { useState, useEffect } from 'react';
import CheckpointSelector from './components/CheckpointSelector';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checkpoints, setCheckpoints] = useState([]);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState('prefectPonyXL_v3.safetensors');
    const [imageDimensions, setImageDimensions] = useState({
        width: 768,
        height: 768
    });
    const [containerDimensions, setContainerDimensions] = useState({
        width: 0,
        height: 0
    });
    const [serverAddress, setServerAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [connectionLoading, setConnectionLoading] = useState(false);

    const containerRef = React.useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setContainerDimensions({ width, height });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial calculation

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

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
                    width: imageDimensions.width,
                    height: imageDimensions.height,
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

    const handleImageDimensionChange = (dimension, value) => {
        // Maintain the aspect ratio
        if (dimension === 'width') {
            setImageDimensions(prev => ({
                width: value,
                height: Math.round(value * (prev.height / prev.width))
            }));
        } else {
            setImageDimensions(prev => ({
                width: Math.round(value * (prev.width / prev.height)),
                height: value
            }));
        }
    };

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100">
            <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen" ref={containerRef}>
                {/* Header with title and connection controls */}
                <div className="flex justify-between items-center mb-8">
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
                    <div className="text-red-400 bg-red-900/50 px-4 py-2 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <div className="flex-grow flex gap-8">
                    {/* Controls Panel */}
                    <div className="w-64 bg-gray-800 p-4 rounded-lg h-fit space-y-6">
                        <h2 className="text-lg font-semibold mb-4">Image Settings</h2>
                        
                        <CheckpointSelector
                            checkpoints={checkpoints}
                            selectedCheckpoint={selectedCheckpoint}
                            onCheckpointChange={handleCheckpointChange}
                        />

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Width: {imageDimensions.width}px
                            </label>
                            <input
                                type="range"
                                min="512"
                                max="1024"
                                step="64"
                                value={imageDimensions.width}
                                onChange={(e) => handleImageDimensionChange('width', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Height: {imageDimensions.height}px
                            </label>
                            <input
                                type="range"
                                min="512"
                                max="1024"
                                step="64"
                                value={imageDimensions.height}
                                onChange={(e) => handleImageDimensionChange('height', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow flex flex-col">
                        <div className="bg-gray-800 rounded-lg p-4 shadow-lg w-full h-full">
                            {imageData ? (
                                <img 
                                    src={imageData} 
                                    alt="Generated" 
                                    className="max-w-full max-h-full rounded-lg mx-auto"
                                    style={{
                                        width: `${Math.min((containerDimensions.width * 0.8), imageDimensions.width)}px`,
                                        height: `${Math.min((containerDimensions.height * 0.8), imageDimensions.height)}px`
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <span className="text-gray-400">Generated image will appear here</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="w-full max-w-2xl mx-auto bg-gray-800 p-4 rounded-lg shadow-lg mt-8">
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
                </div>
            </div>
        </main>
    );
}