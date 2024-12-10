// app/api/connect/route.js
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

        // Try to connect to the server
        const client = new ComfyUIClient(serverAddress, 'test-connection');
        await client.connect();
        await client.disconnect();

        return Response.json({ 
            success: true,
            message: 'Successfully connected to server'
        });
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}