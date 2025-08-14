#!/usr/bin/env node
/**
 * Simple Node.js server with PHP support for local development
 * Run with: npm start
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8000;

// Serve static files (CSS, JS, images, etc.)
app.use(express.static('.', {
  extensions: ['html', 'htm'],
  index: false
}));

// Handle PHP files
app.get('*.php', (req, res) => {
  const phpFile = req.path.slice(1); // Remove leading slash
  
  // Check if file exists
  if (!fs.existsSync(phpFile)) {
    return res.status(404).send('PHP file not found');
  }
  
  // Execute PHP
  const php = spawn('php', [phpFile]);
  let output = '';
  let error = '';
  
  php.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  php.stderr.on('data', (data) => {
    error += data.toString();
  });
  
  php.on('close', (code) => {
    if (code === 0) {
      res.send(output);
    } else {
      res.status(500).send(`PHP Error:\n${error}`);
    }
  });
  
  php.on('error', (err) => {
    if (err.code === 'ENOENT') {
      res.status(500).send(`
        <h1>PHP Not Found</h1>
        <p>PHP is not installed or not in PATH.</p>
        <p><strong>Install PHP:</strong></p>
        <ul>
          <li><strong>macOS:</strong> <code>brew install php</code></li>
          <li><strong>Ubuntu:</strong> <code>sudo apt install php-cli</code></li>
          <li><strong>Windows:</strong> Download from <a href="https://www.php.net/downloads">php.net</a></li>
        </ul>
        <p>Or use the Python server: <code>npm run dev</code></p>
      `);
    } else {
      res.status(500).send(`Server Error: ${err.message}`);
    }
  });
});

// Default route - serve index.php
app.get('/', (req, res) => {
  // Check if PHP is available
  const php = spawn('php', ['index.php']);
  let output = '';
  let error = '';
  
  php.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  php.stderr.on('data', (data) => {
    error += data.toString();
  });
  
  php.on('close', (code) => {
    if (code === 0) {
      res.send(output);
    } else {
      res.status(500).send(`PHP Error:\n${error}`);
    }
  });
  
  php.on('error', (err) => {
    if (err.code === 'ENOENT') {
      res.status(500).send(`
        <h1>PHP Not Found</h1>
        <p>PHP is required to run this application.</p>
        <p><strong>Install PHP:</strong></p>
        <ul>
          <li><strong>macOS:</strong> <code>brew install php</code></li>
          <li><strong>Ubuntu:</strong> <code>sudo apt install php-cli</code></li>
          <li><strong>Windows:</strong> Download from <a href="https://www.php.net/downloads">php.net</a></li>
        </ul>
      `);
    } else {
      res.status(500).send(`Server Error: ${err.message}`);
    }
  });
});

// Check if PHP is available
function checkPHP() {
  const php = spawn('php', ['--version']);
  php.on('error', () => {
    console.log('⚠️  PHP not found in PATH');
  });
  php.on('close', (code) => {
    if (code === 0) {
      console.log('✅ PHP support available');
    }
  });
}

app.listen(PORT, () => {
  console.log('🚀 Starting TOTransit local development server...');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`📂 Serving from: ${process.cwd()}`);
  console.log('💡 Press Ctrl+C to stop\n');
  
  checkPHP();
});