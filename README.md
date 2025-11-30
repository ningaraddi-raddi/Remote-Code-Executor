Remote Code Execution Engine










A robust, scalable asynchronous code execution platform inspired by systems like LeetCode, Judge0, and HackerRank.
This engine securely executes user-submitted code inside isolated Docker sandboxes, managed through a modern microservices architecture.

🏗️ Architecture Overview

The system uses a Producer–Consumer model for fault tolerance and scalability.
The API never directly executes code; instead, it offloads jobs to RabbitMQ, and Workers asynchronously execute them inside Docker containers.

🧩 Key Components
Component	Tech	Responsibility
Ingress Gateway	NGINX	Reverse-proxy, routing, load balancing
API Service	Node.js (Express)	Receives jobs, validates input, pushes tasks to RabbitMQ
RabbitMQ	Message Broker	Job queueing + backpressure
Worker Service	Node.js	Consumes tasks, executes code in Docker
Sandbox Runtime	Docker	Isolated container execution (network disabled, limited resources)
Redis	Cache	Stores job states: Pending → Processing → Completed
✨ Features

🖥️ Multi-language support (Python, JavaScript, Bash)

🛡️ Full sandboxing via Docker

🔌 No network access inside containers (--network none)

⚖️ Resource limits (128MB RAM, 1 CPU core)

📦 Persistent RabbitMQ queue (crash-safe)

📈 Horizontal scalability (docker-compose up --scale worker=5)

⚡ Fast result fetching through Redis

🛡️ Security Measures

Isolated execution inside ephemeral containers

Network disabled containers

Timeout-based execution kill (prevents infinite loops)

Memory + CPU limits

Base64 encoded user code to prevent command injection

Strict validation for incoming payloads

📦 Installation & Setup
✅ Prerequisites

Docker

Docker Compose

1️⃣ Clone the Project
git clone https://github.com/ningaraddi-raddi/Remote-Code-Executor.git
cd Remote-Code-Executor

2️⃣ Run All Services

Start API, Worker, Redis, RabbitMQ, and the Gateway:

docker-compose up --build


All services are available via:

http://localhost:8080

🔌 API Documentation
1. Submit Code for Execution

Endpoint:
POST /api/execute

Request Body:

{
  "language": "python",
  "code": "print('Hello from the sandbox!')"
}


Response:

{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pending",
  "message": "Job submitted successfully"
}

2. Check Job Status

Endpoint:
GET /api/status/:jobId

Response (Processing)
{ "status": "Processing" }

Response (Completed)
{
  "status": "Completed",
  "output": "Hello from the sandbox!\n",
  "submittedAt": "2025-11-30T10:00:00.000Z"
}

📂 Project Structure
remote-code-executor/
├── api-service/          # Express API (Producer)
├── worker-service/       # Worker + Docker execution logic
├── gateway/              # NGINX reverse proxy
├── docker-compose.yml    # Orchestrates all services
└── README.md             # Documentation

🧠 How It Works (Simplified)

User submits code → API validates request

API generates jobId and sets job as Pending in Redis

API pushes job to RabbitMQ

Worker pulls job → Creates a Docker sandbox

Code executes with limited CPU/RAM

Worker updates Redis with job result

User polls /api/status/:jobId for output

🚀 Future Improvements

 WebSockets for real-time logs

 Warm Docker container pools (faster execution)

 JWT-based authentication & rate limiting

 More languages (C++, Java, Go, Rust)

 Multi-file project execution

 Per-user execution quotas

🤝 Contributing

Pull requests and suggestions are welcome!

📄 License

This project is open-source and available under the MIT License.
