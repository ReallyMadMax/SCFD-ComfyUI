"use client"
// app/page.js
import { useState, useEffect } from 'react';
import CheckpointSelector from './components/CheckpointSelector';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checkpoints, setCheckpoints] = useState([]);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState('prefectPonyXL_v3.safetensors');
    const [dimensions, setDimensions] = useState({
        width: 768,
        height: 768
    });

    useEffect(() => {
        async function fetchCheckpoints() {
            try {
                const response = await fetch('/api/checkpoints');
                const data = await response.json();
                
                if (data.success && data.checkpoints) {
                    console.log('Available checkpoints:', data.checkpoints);
                    setCheckpoints(data.checkpoints);
                    
                    // If current selection isn't in the list, select the first available
                    if (data.checkpoints.length > 0 && !data.checkpoints.includes(selectedCheckpoint)) {
                        setSelectedCheckpoint(data.checkpoints[0]);
                    }
                } else {
                    throw new Error(data.error || 'No checkpoints found');
                }
            } catch (err) {
                console.error('Failed to fetch checkpoints:', err);
                setError('Failed to load checkpoints');
            }
        }

        fetchCheckpoints();
    }, [selectedCheckpoint]);

    const handleCheckpointChange = (checkpoint) => {
        console.log('Changing checkpoint to:', checkpoint);
        setSelectedCheckpoint(checkpoint);
    };

    const handleGenerate = async () => {
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
                    width: dimensions.width,
                    height: dimensions.height,
                    checkpoint: selectedCheckpoint
                }),
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }

            setImageData(data.imageData);
        } catch (err) {
            setError('Failed to generate image: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100">
            <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
                    Image Generator
                </h1>

                <div className="flex-grow flex gap-8">
                    {/* Controls Panel */}
                    <div className="w-64 bg-gray-800 p-4 rounded-lg h-fit space-y-6">
                        <h2 className="text-lg font-semibold mb-4">Image Settings</h2>
                        
                        {/* Checkpoint Selector */}
                        <CheckpointSelector
                            checkpoints={checkpoints}
                            selectedCheckpoint={selectedCheckpoint}
                            onCheckpointChange={handleCheckpointChange}
                        />

                        {/* Width Slider */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Width: {dimensions.width}px
                            </label>
                            <input
                                type="range"
                                min="512"
                                max="1024"
                                step="64"
                                value={dimensions.width}
                                onChange={(e) => setDimensions(prev => ({
                                    ...prev,
                                    width: parseInt(e.target.value)
                                }))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Height Slider */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Height: {dimensions.height}px
                            </label>
                            <input
                                type="range"
                                min="512"
                                max="1024"
                                step="64"
                                value={dimensions.height}
                                onChange={(e) => setDimensions(prev => ({
                                    ...prev,
                                    height: parseInt(e.target.value)
                                }))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow flex flex-col">
                        {error && (
                            <div className="text-red-400 bg-red-900/50 px-4 py-2 rounded-lg mb-4">
                                {error}
                            </div>
                        )}
                        
                        {imageData ? (
                            <div className="bg-gray-800 rounded-lg p-4 shadow-lg w-full">
                                <img 
                                    src={imageData} 
                                    alt="Generated" 
                                    className="max-w-full h-auto rounded-lg mx-auto"
                                />
                            </div>
                        ) : (
                            <div className="bg-gray-800/50 rounded-lg p-8 text-gray-400 border-2 border-dashed border-gray-700 flex items-center justify-center h-96">
                                Generated image will appear here
                            </div>
                        )}
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
                            disabled={loading || !prompt}
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