# Quest Backend

Simple Go backend for storing CSV files with API key authentication.

## API Endpoints

- `GET /csv/:filename` - Get CSV file content
- `POST /csv/:filename` - Save CSV file content (JSON body: `{"content": "csv data"}`)
- `GET /health` - Health check

## Authentication

All endpoints (except `/health`) require an API key sent via the `Authorization` header:

```
Authorization: Bearer your-api-key-here
```

## Configuration

Create a `.env` file or set environment variables:

```bash
PORT=8080                          # Server port (default: 8080)
DATA_DIR=./data                    # Data directory (default: ./data)
API_KEY=your-secret-api-key-here   # API key for authentication (optional)
```

If `API_KEY` is not set, authentication is disabled (not recommended for production).

## Run

```bash
# Development
API_KEY=my-secret-key go run main.go

# Or with .env file
export $(cat .env | xargs) && go run main.go
```

## Build

```bash
go build -o backend main.go
```

## Frontend Configuration

The frontend must be configured with matching credentials in `quest/.env`:

```
VITE_API_URL=http://localhost:8080
VITE_API_KEY=my-secret-key
```
