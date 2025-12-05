# Remote Code Execution Engine

![React](https://img.shields.io/badge/React-18-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan) ![NodeJS](https://img.shields.io/badge/Node.js-18.x-green) ![Docker](https://img.shields.io/badge/Docker-Enabled-blue) ![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Message%20Queue-orange) ![Redis](https://img.shields.io/badge/Redis-Caching-red) ![Nginx](https://img.shields.io/badge/NGINX-Gateway-green)

A powerful, full-stack remote code execution platform. This project provides a beautiful, IDE-like web interface where users can write code in multiple languages (JavaScript, Python, Java, etc.) and execute it securely in isolated Docker containers.

## 🚀 Features

-   **Modern Frontend**: Built with **React**, **Vite**, and **Tailwind CSS**. Features a dark-themed, responsive UI.
-   **Monaco Editor**: Integrated **VS Code-like editor** with syntax highlighting and intelligent features.
-   **Secure Execution**: User code runs inside **ephemeral Docker containers** with no network access and strict resource limits (RAM/CPU).
-   **Microservices Architecture**:
    -   **API Service**: Handles HTTP requests and queues jobs.
    -   **Worker Service**: Consumes jobs from RabbitMQ and manages Docker containers.
    -   **Gateway**: NGINX reverse proxy for routing and CORS management.
-   **Scalable**: Uses **RabbitMQ** for job queuing and **Redis** for fast state management.

## 🏗 Architecture

The system follows a Producer-Consumer pattern:


<img width="1184" height="742" alt="image" src="https://github.com/user-attachments/assets/26801382-1e47-43b5-ae08-3287853bb513" />


## 🛠 Tech Stack

### Frontend
-   **React** (Vite): Fast, modern UI library.
-   **Tailwind CSS**: Utility-first styling for a sleek design.
-   **Monaco Editor**: The power of VS Code in the browser.
-   **Axios**: For API communication.
-   **Lucide React**: Beautiful icons.

### Backend
-   **Node.js & Express**: API handling.
-   **RabbitMQ**: Asynchronous message broker.
-   **Redis**: In-memory data store for job status.
-   **Dockerode**: Node.js library to control Docker.

### Infrastructure
-   **Docker & Docker Compose**: Container orchestration.
-   **NGINX**: API Gateway and Load Balancer.

## 🏁 Getting Started

### Prerequisites
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Must be running)
-   [Node.js](https://nodejs.org/) (v18+ recommended)

### Installation & Running

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ningaraddi-raddi/Remote-Code-Executor.git
    cd Remote-Code-Executor
    ```

2.  **Start Backend Services** (Docker)
    This starts Redis, RabbitMQ, API Service, Worker Service, and Nginx.
    ```bash
    docker-compose up -d --build
    ```
    *Wait a few moments for RabbitMQ and other services to initialize.*

3.  **Start Frontend** (Local Dev Server)
    Open a new terminal configuration.
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the Application**
    -   **Web UI**: Open [http://localhost:5173](http://localhost:5173) in your browser.
    -   **API**: Accessible at [http://localhost:8080/api](http://localhost:8080/api).

## 📂 Project Structure

```text
remote-code-executor/
├── api-service/          # Node.js API (Producer)
│   └── src/index.js      # API Routes (/execute, /status)
├── worker-service/       # Node.js Worker (Consumer)
│   └── src/index.js      # Docker execution logic
├── gateway/              # NGINX Configuration
│   └── nginx.conf        # Routing & CORS rules
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/   # Editor, Terminal, LanguageSelector
│   │   ├── api/          # API integration
│   │   └── App.jsx       # Main layout & logic
│   └── tailwind.config.js
└── docker-compose.yml    # Service orchestration
```

## 🔌 API Reference

### `POST /job` (via Gateway `/api/execute`)
Submit code for execution.
**Body:**
```json
{
  "language": "python",
  "code": "print('Hello World')"
}
```

### `GET /status/:jobId` (via Gateway `/api/status/:jobId`)
Check the execution status.
**Response:**
```json
{
  "status": "Completed", 
  "output": "Hello World\n",
  "submittedAt": "..."
}
```

## 🛡 Security Measures
-   **Network Isolation**: Docker containers run with `network_mode: none`.
-   **Resource Limits**: Containers are capped at 128MB RAM and 1 CPU core via `docker-compose` and Worker logic.
-   **Timeouts**: Execution is forcibly terminated after a set duration to prevent infinite loops.
-   **Read-Only Filesystem**: (Optional configuration) prevents malicious writes.

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
