// app/utils/comfyClient.js
import { ComfyUIClient } from 'comfy-ui-client';

export async function generateImage(userPrompt,negativePrompt, serverAddress, width = 768, height = 768, checkpoint = 'prefectPonyXL_v3.safetensors') {
    const randomSeed = Math.floor(Math.random() * 100000) + 1;
    
    if (!serverAddress) {
        throw new Error('Server address is required');
    }

    // Validate server address format
    if (!serverAddress.includes(':')) {
        throw new Error('Server address must include port number (e.g., domain:8188)');
    }

    // Test the server connectivity
    try {
        const [host, port] = serverAddress.split(':');
        const testResponse = await fetch(`http://${host}:${port}/history`);
        
        if (!testResponse.ok) {
            throw new Error(`Server returned status ${testResponse.status}`);
        }

        const contentType = testResponse.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error('Server is not responding with JSON. Received content-type: ' + contentType);
        }

        await testResponse.json(); // Verify we can parse the JSON
    } catch (error) {
        console.error('Server connectivity test failed:', error);
        throw new Error(`ComfyUI server connectivity test failed: ${error.message}`);
    }

    console.log('Generation Parameters:', {
        seed: randomSeed,
        checkpoint: checkpoint,
        width: width,
        height: height,
        serverAddress: serverAddress
    });

    const prompt = {
        '3': {
            class_type: 'KSampler',
            inputs: {
                cfg: 8,
                denoise: 1,
                latent_image: ['5', 0],
                model: ['4', 0],
                negative: ['7', 0],
                positive: ['6', 0],
                sampler_name: 'euler',
                scheduler: 'normal',
                seed: randomSeed,
                steps: 20,
            },
        },
        '4': {
            class_type: 'CheckpointLoaderSimple',
            inputs: {
                ckpt_name: checkpoint,
            },
        },
        '5': {
            class_type: 'EmptyLatentImage',
            inputs: {
                batch_size: 1,
                height: height,
                width: width,
            },
        },
        '6': {
            class_type: 'CLIPTextEncode',
            inputs: {
                clip: ['4', 1],
                text: userPrompt,
            },
        },
        '7': {
            class_type: 'CLIPTextEncode',
            inputs: {
                clip: ['4', 1],
                text: negativePrompt,
            },
        },
        '8': {
            class_type: 'VAEDecode',
            inputs: {
                samples: ['3', 0],
                vae: ['4', 2],
            },
        },
        '9': {
            class_type: 'SaveImage',
            inputs: {
                filename_prefix: 'ComfyUI',
                images: ['8', 0],
            },
        },
    };

    const clientId = `vercel-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const client = new ComfyUIClient(serverAddress, clientId);

    try {
        // Connect with timeout
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000);
        });

        await Promise.race([connectPromise, timeoutPromise]);

        // Generate image with timeout
        const generatePromise = client.getImages(prompt);
        const generateTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Generation timeout after 30s')), 30000);
        });

        const outputImages = await Promise.race([generatePromise, generateTimeoutPromise]);
        
        if (!outputImages || typeof outputImages !== 'object') {
            throw new Error('Invalid response format from server');
        }

        const imageNodeId = Object.keys(outputImages).find(nodeId =>
            outputImages[nodeId] && outputImages[nodeId].length > 0
        );

        if (!imageNodeId) {
            throw new Error('No image node found in output');
        }

        const imageOutput = outputImages[imageNodeId][0];
        const arrayBuffer = await imageOutput.blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return [buffer];
    } catch (error) {
        let errorMessage = error.message;
        if (error.message.includes('JSON.parse') || error.message.includes('Unexpected token')) {
            errorMessage = 'Server returned invalid response format. Please check if the ComfyUI server is properly configured and accessible.';
        }
        throw new Error(`Image generation failed: ${errorMessage}`);
    } finally {
        try {
            await client.disconnect();
        } catch (error) {
            console.error('Error during disconnect:', error);
        }
    }
}