# 🚀 Remote Code Execution Engine

![NodeJS](https://img.shields.io/badge/Node.js-18.x-green) ![Docker](https://img.shields.io/badge/Docker-Enabled-blue) ![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Message%20Queue-orange) ![Redis](https://img.shields.io/badge/Redis-Caching-red) ![Nginx](https://img.shields.io/badge/NGINX-Gateway-green)

A robust, scalable **asynchronous code execution system** (similar to the engine behind LeetCode or Judge0). Built using a microservices architecture, it allows users to submit code in various languages, executes them safely inside isolated ephemeral Docker containers, and returns the output.

---

## 🏗 Architecture & Design

The system follows the **Producer-Consumer** pattern to handle high concurrency. It decouples the ingestion layer (API) from the execution layer (Worker), ensuring the server remains responsive even under heavy load.

```mermaid
graph LR
    User[Client] -- POST /execute --> NGINX[NGINX Gateway]
    NGINX --> API[API Service]
    API -- Push Job --> RMQ[(RabbitMQ)]
    API -- Set Status --> Redis[(Redis)]
    
    RMQ -- Pull Job --> Worker[Worker Service]
    Worker -- Spawn --> Sandbox[Docker Sandbox]
    
    Sandbox -- Output --> Worker
    Worker -- Update Status --> Redis
    
    User -- Polling --> API
    API -- Get Result --> Redis
Key ComponentsComponentTech StackRoleIngress GatewayNGINXReverse proxy, request routing, and future load balancing.API ServiceNode.js / ExpressHandles HTTP requests, validation, and pushes jobs to the queue.Message BrokerRabbitMQBuffers incoming jobs to prevent system overload (Backpressure).Worker ServiceNode.jsConsumes jobs and manages the lifecycle of Docker containers.RuntimeDocker (Alpine)executes user code in isolated, network-restricted containers.State StoreRedisFast read/write storage for job status (Pending -> Processing -> Completed).✨ FeaturesMulti-Language Support: Currently supports Python, JavaScript (Node.js), and Bash.Sandboxing: Code runs in isolated containers with no network access (--network none) and limited resources (CPU/RAM caps).Horizontal Scalability: The Worker Service can be scaled up (e.g., docker-compose up --scale worker=5) to handle higher throughput.Fault Tolerance: RabbitMQ persistence ensures jobs aren't lost if the worker crashes.🛠 Installation & SetupPrerequisitesDocker & Docker Compose installed.1. Clone the RepositoryBashgit clone [https://github.com/ningaraddi-raddi/Remote-Code-Executor.git](https://github.com/ningaraddi-raddi/Remote-Code-Executor.git)
cd Remote-Code-Executor
2. Run with Docker ComposeThis command builds the images and starts all 5 services (API, Worker, Redis, RabbitMQ, Nginx).Bashdocker-compose up --build
🔌 API Documentation1. Execute CodeEndpoint: POST /api/executeRequest Body:JSON{
  "language": "python",
  "code": "print('Hello from the Isolated Docker Sandbox!')"
}
Response:JSON{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pending",
  "message": "Job submitted successfully"
}
2. Check Status / Get ResultEndpoint: GET /api/status/:jobIdResponse (Processing):JSON{ "status": "Processing" }
Response (Success):JSON{
  "status": "Completed",
  "output": "Hello from the Isolated Docker Sandbox!\n",
  "submittedAt": "2025-11-30T10:00:00.000Z"
}
📂 Project StructurePlaintext/remote-code-executor
├── /api-service        # Express API (Producer)
├── /worker-service     # Node.js Worker (Consumer + Dockerode)
├── /gateway            # NGINX Configuration
├── docker-compose.yml  # Container Orchestration
└── README.md           # Documentation
🛡 Security Measures implementedNetwork Isolation: Sandbox containers have no internet access.Resource Limits: Containers are capped at 128MB RAM and 1 CPU core to prevent DoS (infinite loops).Ephemeral Filesystem: Containers are destroyed immediately after execution.Base64 Encoding: Source code is passed via Base64 injection to prevent command injection attacks.🚀 Future Roadmap[ ] Add WebSockets for real-time result streaming (removing polling).[ ] Implement Warm Pools of containers to reduce startup latency.[ ] Add Authentication (JWT) to rate-limit users.
