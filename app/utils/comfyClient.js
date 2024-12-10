// app/utils/comfyClient.js
import { ComfyUIClient } from 'comfy-ui-client';

export async function generateImage(userPrompt, width = 768, height = 768, checkpoint = 'prefectPonyXL_v3.safetensors') {
    const randomSeed = Math.floor(Math.random() * 100000) + 1;

    console.log('Generation Parameters:', {
        seed: randomSeed,
        checkpoint: checkpoint,
        width: width,
        height: height
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
                text: 'bad hands, ugly, gross, disfigured',
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

    const serverAddress = '10.0.0.60:8188';
    const clientId = 'baadbabe-b00b-4206-9420-deadd00d1337';
    const client = new ComfyUIClient(serverAddress, clientId);

    try {
        await client.connect();
        const outputImages = await client.getImages(prompt);
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
        throw error;
    } finally {
        await client.disconnect();
    }
}