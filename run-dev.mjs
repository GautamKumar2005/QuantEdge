import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n🚀 Starting QuantEdge Backend & Frontend concurrently...\n");

// 1. Spawn Python FastAPI Backend
const backendProcess = spawn('python', ['-m', 'uvicorn', 'backend.main:app', '--reload', '--port', '8000'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

// 2. Spawn Next.js Frontend
const frontendProcess = spawn('npm', ['run', 'next-dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

// Graceful exit handler
const cleanup = () => {
    console.log("\n🛑 Stopping servers...");
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
