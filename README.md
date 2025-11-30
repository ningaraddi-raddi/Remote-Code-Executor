```markdown
# Remote Code Execution Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)]()

A robust, scalable asynchronous code execution platform inspired by systems like LeetCode, Judge0, and HackerRank. This engine securely runs user-submitted code inside ephemeral Docker sandboxes and uses a microservices architecture for reliability and scale.

Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Security](#security)
- [Quickstart](#quickstart)
- [API](#api)
- [Project Structure](#project-structure)
- [How it works](#how-it-works)
- [Future improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project implements a Producer–Consumer model where an API accepts jobs and workers execute them asynchronously. The API pushes jobs to RabbitMQ; workers consume the jobs and run the code inside restricted Docker containers. Redis is used as a fast job state store.

## Architecture

- Ingress Gateway: NGINX — reverse proxy, routing and load balancing
- API Service: Node.js (Express) — validates input and enqueues jobs
- Message Broker: RabbitMQ — reliable job queue with persistence and backpressure
- Worker Service: Node.js — consumes jobs and executes code inside Docker sandboxes
- Sandbox Runtime: Docker — isolated execution (network disabled)
- Cache / State Store: Redis — stores job states and results

A simplified flow:
User → API → RabbitMQ → Worker → Docker Sandbox → Redis → User polls API for result

## Features

- Multi-language support: Python, JavaScript, Bash (extendable)
- Full sandboxing using Docker
- No network access inside containers (--network none)
- Resource limits (example: 128MB RAM, 1 CPU core)
- Persistent RabbitMQ queues (crash-safe)
- Horizontal scaling (e.g., docker-compose up --scale worker=5)
- Fast result lookup via Redis
- Timeout-based execution and automatic termination for runaway processes

## Security

- Ephemeral isolated containers per job
- Disabled container networking
- CPU and memory limits enforced by Docker
- Execution timeouts to avoid infinite loops
- Base64-encoded user code to reduce command injection risk
- Strict validation of incoming payloads at the API layer
- Workers run with minimal permissions (follow the principle of least privilege)

## Quickstart

Prerequisites
- Docker
- Docker Compose

1. Clone the repository
```bash
git clone https://github.com/ningaraddi-raddi/Remote-Code-Executor.git
cd Remote-Code-Executor
```

2. Build and start all services
```bash
docker-compose up --build
```

The API will be available at: http://localhost:8080

(If you wish to run services detached: docker-compose up -d --build)

## API

Base: http://localhost:8080

1. Submit Code for Execution
- Endpoint: POST /api/execute
- Request (JSON)
```json
{
  "language": "python",
  "code": "print('Hello from the sandbox!')"
}
```

- Response (success)
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pending",
  "message": "Job submitted successfully"
}
```

2. Check Job Status
- Endpoint: GET /api/status/:jobId

- Response (Processing)
```json
{ "status": "Processing" }
```

- Response (Completed)
```json
{
  "status": "Completed",
  "output": "Hello from the sandbox!\n",
  "submittedAt": "2025-11-30T10:00:00.000Z"
}
```

Notes
- The API returns a jobId which you can poll via the /api/status endpoint.
- For large outputs or logs you may store truncated or paginated results to Redis or a blob storage.

## Project Structure

```
remote-code-executor/
├── api-service/          # Express API (producer)
├── worker-service/       # Worker + Docker execution logic (consumer)
├── gateway/              # NGINX reverse proxy
├── docker-compose.yml    # Orchestrates all services
└── README.md             # Documentation
```

## How it works (Simplified)

1. User submits code to the API
2. API validates input, generates a jobId, and stores a Pending state in Redis
3. API serializes the job and pushes it to RabbitMQ
4. Worker picks up the job, spins up a Docker container with strict limits (--network=none, CPU/memory caps)
5. Worker executes the code inside the container, captures stdout/stderr and exit code
6. Worker updates Redis with the result and final status (Completed/Failed)
7. Client polls /api/status/:jobId to get outputs and status

## Configuration & Environment

Example configs (docker-compose, environment variables) live in the repository. Key items to configure:
- RabbitMQ host/credentials
- Redis host/credentials
- Execution timeouts and resource caps
- Worker concurrency / Docker runtime options

## Future improvements

- WebSockets for real-time execution logs
- Warm container pools to reduce cold-start latency
- JWT-based authentication & rate limiting
- Support for more languages: C/C++, Java, Go, Rust
- Multi-file project execution and volume-based file imports
- Per-user execution quotas and billing

## Contributing

Pull requests and suggestions are welcome. Please:
- Open an issue to discuss larger changes
- Add tests for new features
- Keep container and host security in mind

## License

This project is open-source and available under the MIT License.

```
