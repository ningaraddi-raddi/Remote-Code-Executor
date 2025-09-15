import express from 'express';
import bodyParser from 'body-parser';
import amqp from 'amqplib';
import { createClient } from 'redis';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { Server } from "socket.io";
import http from 'http';

dotenv.config();

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'code_queue';

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: '100kb' }));

// Redis clients for publishing and subscribing
const redis = createClient({ url: REDIS_URL });
const redisSub = redis.duplicate();

redis.on('error', (e) => console.error('Redis error', e));
await redis.connect();
await redisSub.connect();

// RabbitMQ channel for job queueing
const conn = await amqp.connect(RABBIT_URL);
const channel = await conn.createChannel();
await channel.assertQueue(QUEUE_NAME, { durable: true });

// HTTP and Socket.IO server setup
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Server subscribes to a general Redis channel for all job updates
redisSub.subscribe('job-updates', (message) => {
    const data = JSON.parse(message);
    // Emits a job-specific update to the frontend
    io.emit(`job-update:${data.jobId}`, data);
});

// Socket.IO connection handler
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Listen for stdin input from the frontend
    socket.on('stdin', ({ jobId, data }) => {
        // Publish the stdin data to a Redis channel specific to this job
        redis.publish(`stdin:${jobId}`, JSON.stringify({ data }));
    });
});

// API endpoint to submit a new code execution job
app.post('/run', async (req, res) => {
    const { language, code } = req.body;
    if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required' });
    }

    const jobId = uuidv4();
    const payload = { jobId, language, code };

    await redis.set(`job:${jobId}`, JSON.stringify({ status: 'queued', createdAt: Date.now() }), { EX: 3600 });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), { persistent: true });

    res.json({ jobId });
});

// API endpoint for frontend to check the job status
app.get('/result/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const val = await redis.get(`job:${jobId}`);
    if (!val) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(JSON.parse(val));
});

const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`API listening on ${port}`));