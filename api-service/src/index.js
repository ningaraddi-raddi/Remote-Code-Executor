// api-service/src/index.js
const express = require('express');
const amqp = require('amqplib');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(cors());

// 1. CONSTANTS (Environment variables from docker-compose)
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const PORT = process.env.PORT || 3000;
const QUEUE_NAME = 'code_execution_queue';

// 2. CONNECT TO REDIS
const redis = new Redis({
    host: REDIS_HOST,
    port: 6379,
});

// 3. CONNECT TO RABBITMQ
let channel;
async function connectQueue() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true }); // Durable = survive restarts
        console.log(`✅ Connected to RabbitMQ at ${RABBITMQ_URL}`);
    } catch (error) {
        console.error('❌ RabbitMQ Connection Error:', error);
        // Simple retry logic (wait 5s and try again)
        setTimeout(connectQueue, 5000);
    }
}
connectQueue();

// ----------------------------------------------------------------
// ROUTE 1: SUBMIT JOB (/execute)
// ----------------------------------------------------------------
app.post('/execute', async (req, res) => {
    const { code, language } = req.body;

    // Simple Validation
    if (!code || !language) {
        return res.status(400).json({ error: 'Code and Language are required' });
    }

    const jobId = uuidv4(); // Generate unique Ticket ID

    // A. Save Initial Status to Redis (TTL 1 hour)
    await redis.set(jobId, JSON.stringify({ status: 'Pending', submittedAt: new Date() }));
    await redis.expire(jobId, 3600); 

    // B. Push Job to RabbitMQ
    const jobPayload = { jobId, code, language };
    
    if (channel) {
        // We must send data as a Buffer
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(jobPayload)), {
            persistent: true // Save to disk if RabbitMQ crashes
        });
        console.log(`📤 Job ${jobId} sent to queue`);
        
        res.json({ jobId, status: 'Pending', message: 'Job submitted successfully' });
    } else {
        res.status(500).json({ error: 'Queue system is currently unavailable' });
    }
});

// ----------------------------------------------------------------
// ROUTE 2: CHECK STATUS (/status/:id)
// ----------------------------------------------------------------
app.get('/status/:jobId', async (req, res) => {
    const { jobId } = req.params;
    
    // Fetch from Redis
    const result = await redis.get(jobId);

    if (!result) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json(JSON.parse(result));
});

// Health Check
app.get('/health', (req, res) => res.send('API Service is Healthy 🚀'));

app.listen(PORT, () => {
    console.log(`🚀 API Service running on port ${PORT}`);
});