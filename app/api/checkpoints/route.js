// app/api/checkpoints/route.js
import { ComfyUIClient } from 'comfy-ui-client';

export async function GET() {
    try {
        const client = new ComfyUIClient('10.0.0.60:8188', 'baadbabe-b00b-4206-9420-deadd00d1337');
        
        await client.connect();
        
        const allInfo = await client.getObjectInfo();
        const checkpointInfo = allInfo.CheckpointLoaderSimple;
        
        // Extract the checkpoints array from the correct path
        const checkpoints = checkpointInfo?.input?.required?.ckpt_name?.[0] || [];
        
        //debugging
        //console.log('Found checkpoints:', checkpoints);
        
        await client.disconnect();
        
        if (!checkpoints.length) {
            throw new Error('No checkpoints found');
        }
        
        return Response.json({ 
            success: true, 
            checkpoints 
        });
    } catch (error) {
        console.error('Error fetching checkpoints:', error);
        return Response.json(
            { success: false, error: error.message }, 
            { status: 500 }
        );
    }
}