import { generateImage } from '@/app/utils/comfyClient';

export async function POST(request) {
    try {
        const { prompt, width, height, checkpoint } = await request.json();
        
        console.log('Received generation request:', {
            prompt,
            width,
            height,
            checkpoint
        });

        const images = await generateImage(prompt, width, height, checkpoint);
        
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