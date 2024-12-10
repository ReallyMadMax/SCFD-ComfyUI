// app/components/CheckpointSelector.js
export default function CheckpointSelector({ 
    checkpoints, 
    selectedCheckpoint, 
    onCheckpointChange 
}) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium">
                Model Checkpoint
            </label>
            <select
                value={selectedCheckpoint}
                onChange={(e) => onCheckpointChange(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer hover:bg-gray-600 transition-colors"
            >
                {checkpoints.map((checkpoint) => (
                    <option 
                        key={checkpoint} 
                        value={checkpoint}
                        className="bg-gray-700"
                    >
                        {checkpoint}
                    </option>
                ))}
            </select>
        </div>
    );
}