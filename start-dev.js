const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Study Buddy application in development mode...');

const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'inherit'
});

const cleanup = (code) => {
  console.log(`\nStopping all services (exit code ${code})...`);
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit(code);
};

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
process.on('exit', (code) => cleanup(code));

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  cleanup(code);
});

frontend.on('exit', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  cleanup(code);
});
