#!/bin/bash

# TOTransit Development Setup Script

echo "🚀 Setting up TOTransit development environment..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed."
    echo "Please install it first:"
    echo "  macOS: brew install mkcert"
    echo "  Linux: See https://github.com/FiloSottile/mkcert#installation"
    exit 1
fi

# Check if mkcert root CA is installed
if ! mkcert -CAROOT &> /dev/null; then
    echo "🔧 Installing mkcert root CA..."
    mkcert -install
fi

# Create certs directory
mkdir -p docker/certs

# Generate local SSL certificates
echo "🔐 Generating SSL certificates..."
cd docker/certs
mkcert localhost 127.0.0.1 ::1
cd ../..

echo "✅ Setup complete!"
echo ""
echo "Now run:"
echo "  docker-compose up --build"
echo ""
echo "Then visit: https://localhost"