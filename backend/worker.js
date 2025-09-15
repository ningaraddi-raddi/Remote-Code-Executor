import { spawn } from 'child_process';
import amqp from 'amqplib';
import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'code_queue';

async function startWorker() {
    console.log('👷 Worker waiting for jobs...');
    const redis = createClient({ url: REDIS_URL });
    redis.on('error', (e) => console.error('Redis error', e));
    await redis.connect();

    const conn = await amqp.connect(RABBIT_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;
        const { jobId, language, code } = JSON.parse(msg.content.toString());

        await redis.set(`job:${jobId}`, JSON.stringify({ status: 'running', startedAt: Date.now() }), { EX: 3600 });
        console.log(`⚡ Processing job: ${jobId}`);

        // Create a temporary folder for the job
        const tempDir = path.join(os.tmpdir(), `job-${jobId}`);
        fs.mkdirSync(tempDir, { recursive: true });

        let fileName;
        switch (language) {
            case 'cpp': fileName = 'Main.cpp'; break;
            case 'python': fileName = 'main.py'; break;
            case 'java': fileName = 'Solution.java'; break;
            default: {
                fs.rmSync(tempDir, { recursive: true, force: true });
                channel.ack(msg);
                return console.error('Unsupported language');
            }
        }
        const tempFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(tempFilePath, code);
        
        let stdout = '';
        let stderr = '';
        
        // Redis client to subscribe to stdin
        const stdinSub = redis.duplicate();
        await stdinSub.connect();

        try {
            const dockerImage = language === 'cpp' ? 'code-runner-cpp' :
                               language === 'python' ? 'code-runner-python' :
                               'code-runner-java';

            let commandArgs;
            if (language === 'cpp') {
                commandArgs = ['sh', '-c', `g++ /app/${fileName} -o /app/Main && /app/Main`];
            } else if (language === 'python') {
                commandArgs = ['python3', `/app/${fileName}`];
            } else if (language === 'java') {
                commandArgs = ['sh', '-c', `javac /app/${fileName} && java -cp /app Solution`];
            }

            const proc = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '--network', 'none',
                '-v', `${tempDir}:/app`,
                dockerImage,
                ...commandArgs
            ], { stdio: ['pipe', 'pipe', 'pipe'] });
            
            // Subscribe to stdin messages
            stdinSub.subscribe(`stdin:${jobId}`, (message) => {
                const { data } = JSON.parse(message);
                if (proc.stdin) {
                    proc.stdin.write(data);
                }
            });

            // Set up a timeout to kill the process
            const timeout = setTimeout(() => {
                proc.kill('SIGKILL');
                stderr += '[Process killed: timeout]\n';
                redis.publish('job-updates', JSON.stringify({ jobId, type: 'stderr', payload: '[Process killed: timeout]\n' }));
                console.log(`⏳ Job ${jobId} timed out`);
            }, 60000); // 60 seconds

            // Listen for output from the Docker container
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                redis.publish('job-updates', JSON.stringify({ jobId, type: 'stdout', payload: data.toString() }));
            });
            
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                redis.publish('job-updates', JSON.stringify({ jobId, type: 'stderr', payload: data.toString() }));
            });

            proc.on('close', async (exitCode) => {
                clearTimeout(timeout);
                stdinSub.unsubscribe(`stdin:${jobId}`);
                stdinSub.quit();
                fs.rmSync(tempDir, { recursive: true, force: true });
                
                await redis.set(`job:${jobId}`, JSON.stringify({
                    status: 'completed',
                    output: stdout,
                    error: stderr,
                    exitCode: exitCode,
                    finishedAt: Date.now(),
                }), { EX: 3600 });

                redis.publish('job-updates', JSON.stringify({ jobId, type: 'completion', payload: { exitCode } }));
                channel.ack(msg);
                console.log(`✅ Job ${jobId} finished with code ${exitCode}`);
            });

        } catch (err) {
            console.error('Job error', err);
            await redis.set(`job:${jobId}`, JSON.stringify({ status: 'error', error: err.message }), { EX: 3600 });
            channel.ack(msg);
        }
    }, { noAck: false });
}

startWorker().catch(err => console.error('❌ Worker startup error', err));