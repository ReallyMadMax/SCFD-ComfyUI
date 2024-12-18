// app/api/generate/route.js
import { generateImage } from '@/app/utils/comfyClient';

export async function POST(request) {
    try {
        const { prompt, negativePrompt, width, height, checkpoint, serverAddress } = await request.json();
       
        if (!serverAddress) {
            return Response.json(
                { success: false, error: 'Server address is required' },
                { status: 400 }
            );
        }

        if (!prompt) {
            return Response.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        console.log('Received generation request:', {
            prompt,
            negativePrompt,
            width,
            height,
            checkpoint,
            serverAddress
        });

        const images = await generateImage(
            prompt,
            negativePrompt || '', // Pass empty string if no negative prompt
            serverAddress,
            width,
            height,
            checkpoint
        );
       
        if (!images || images.length === 0) {
            throw new Error('No image generated');
        }

        // Convert buffer to base64
        const base64Image = `data:image/png;base64,${images[0].toString('base64')}`;
        
        return Response.json({
            success: true,
            imageData: base64Image
        });
    } catch (error) {
        console.error('Generation error:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}