// worker-service/src/index.js
const amqp = require('amqplib');
const Redis = require('ioredis');
const Docker = require('dockerode');

// 1. SETUP DOCKER CONNECTION (Socket mapped from Host)
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// 2. CONSTANTS
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'code_execution_queue';

// 3. REDIS CONNECTION
const redis = new Redis({ host: REDIS_HOST, port: 6379 });

async function startWorker() {
    try {
        // 4. CONNECT TO RABBITMQ
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        // ⚠️ CRITICAL: Only process 1 job at a time per worker instance
        // This prevents your laptop from crashing by accepting 100 jobs at once.
        channel.prefetch(1);

        console.log('👷 Worker Service started. Waiting for jobs...');

        // 5. CONSUME MESSAGES
        channel.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;

            const { jobId, code, language } = JSON.parse(msg.content.toString());
            console.log(`🔄 Processing Job: ${jobId}`);

            // A. Update Status -> Processing
            await redis.set(jobId, JSON.stringify({ status: 'Processing' }));

            try {
                // B. EXECUTE CODE (The Magic)
                const output = await runCodeInDocker(jobId, code, language);
                
                // C. Update Status -> Completed
                await redis.set(jobId, JSON.stringify({ 
                    status: 'Completed', 
                    output: output 
                }));
                await redis.expire(jobId, 3600); // Clean up after 1 hr

                console.log(`✅ Job ${jobId} Completed`);
            } catch (err) {
                console.error(`❌ Job ${jobId} Failed:`, err);
                await redis.set(jobId, JSON.stringify({ 
                    status: 'Failed', 
                    error: err.message 
                }));
            }

            // D. Acknowledge Job (Tell RabbitMQ we are done)
            channel.ack(msg);
        });

    } catch (error) {
        console.error('Failed to start worker:', error);
        setTimeout(startWorker, 5000); // Retry logic
    }
}

// ---------------------------------------------------------
// THE SANDBOX LOGIC (Dockerode)
// ---------------------------------------------------------

// worker-service/src/index.js (Partial Update)

// ... (Rest of the file stays the same) ...

async function runCodeInDocker(jobId, code, language) { // <--- Added language param
    const encodedCode = Buffer.from(code).toString('base64');
    
    let image, cmd;

    // 1. SELECT LANGUAGE RUNTIME
    switch(language) {
        case 'python':
            image = 'python:3.10-alpine';
            // Pipe base64 -> decode -> python
            cmd = ['sh', '-c', `echo "${encodedCode}" | base64 -d | python3`];
            break;
        
        case 'javascript':
            image = 'node:18-alpine';
            // Pipe base64 -> decode -> write to file -> run node
            cmd = ['sh', '-c', `echo "${encodedCode}" | base64 -d > app.js && node app.js`];
            break;
            
        case 'bash':
            image = 'alpine:3.17';
            // Pipe base64 -> decode -> bash
            cmd = ['sh', '-c', `echo "${encodedCode}" | base64 -d | sh`];
            break;
            
        default:
            throw new Error(`Unsupported language: ${language}`);
    }

    console.log(`🐳 Spawning ${image} for Job ${jobId}`);

    let container;
    try {
        container = await docker.createContainer({
            Image: image,
            Cmd: cmd,
            Tty: false,
            NetworkDisabled: true, // Security: No Internet
            HostConfig: {
                Memory: 128 * 1024 * 1024, // 128MB Limit
                NanoCpus: 1000000000,      // 1 CPU Core
            }
        });

        await container.start();
        
        // Wait for container to finish
        const stream = await container.wait();

        const logs = await container.logs({ stdout: true, stderr: true });
        await container.remove();

        return stripDockerHeaders(logs);

    } catch (err) {
        if (container) try { await container.remove({ force: true }); } catch (e) {}
        throw err;
    }
}

// ... (Helper function stripDockerHeaders stays the same) ...
// async function runCodeInDocker(code) {
//     const encodedCode = Buffer.from(code).toString('base64');
    
//     // Command: Echo base64 code -> decode it -> pipe to python
//     // This avoids "escaping" issues with quotes in user code.
//     const cmd = [
//         'sh', 
//         '-c', 
//         `echo "${encodedCode}" | base64 -d | python3`
//     ];

//     let container;
//     try {
//         // 1. Create Container (Alpine is fast!)
//         container = await docker.createContainer({
//             Image: 'python:3.10-alpine',
//             Cmd: cmd,
//             Tty: false,
//             // SECURITY LOCKDOWN 🔒
//             NetworkDisabled: true, // No Internet access
//             HostConfig: {
//                 Memory: 128 * 1024 * 1024, // Limit RAM to 128MB
//                 NanoCpus: 1000000000,      // Limit to 1 CPU core
//             }
//         });

//         // 2. Start Container
//         await container.start();

//         // 3. Wait for finish (or timeout manually if needed)
//         // Note: For production, you need a Promise.race() here with a setTimeout
//         // to kill containers that run infinite loops.
//         const stream = await container.wait();

//         // 4. Get Logs (Stdout + Stderr)
//         const logs = await container.logs({
//             stdout: true,
//             stderr: true,
//         });

//         // 5. Cleanup (Remove container immediately)
//         await container.remove();

//         // 6. Clean Docker Output (Docker adds header bytes to logs)
//         return stripDockerHeaders(logs);

//     } catch (err) {
//         // Ensure cleanup even if it fails
//         if (container) {
//             try { await container.remove({ force: true }); } catch (e) {}
//         }
//         throw err;
//     }
// }

// Helper: Docker Multiplexing Header Removal
// Docker log streams have 8 bytes of header info we need to strip.
function stripDockerHeaders(buffer) {
    // If it's a raw buffer, we might see odd characters.
    // Ideally, we parse the multiplexed stream, but for simple text:
    return buffer.toString('utf8').replace(/[\x00-\x08]/g, ''); 
}

startWorker();