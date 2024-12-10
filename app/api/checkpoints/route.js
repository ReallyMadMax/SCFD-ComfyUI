// app/api/checkpoints/route.js
import { ComfyUIClient } from 'comfy-ui-client';

export async function POST(request) {
    try {
        const { serverAddress } = await request.json();
        
        if (!serverAddress) {
            return Response.json(
                { success: false, error: 'Server address is required' },
                { status: 400 }
            );
        }

        const client = new ComfyUIClient(serverAddress, 'baadbabe-b00b-4206-9420-deadd00d1337');
        
        await client.connect();
        
        // Get all object info
        const allInfo = await client.getObjectInfo();
        
        // Get the checkpoint options from CheckpointLoaderSimple
        const checkpointInfo = allInfo.CheckpointLoaderSimple;
        const availableCheckpoints = checkpointInfo.input.required.ckpt_name[0];
        
        await client.disconnect();
        
        return Response.json({ 
            success: true, 
            checkpoints: availableCheckpoints 
        });
    } catch (error) {
        console.error('Error fetching checkpoints:', error);
        return Response.json(
            { success: false, error: error.message }, 
            { status: 500 }
        );
    }
}