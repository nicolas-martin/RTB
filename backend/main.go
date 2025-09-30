package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Server struct {
	dataDir string
	apiKey  string
	mu      sync.RWMutex
}

func NewServer(dataDir string, apiKey string) *Server {
	return &Server{
		dataDir: dataDir,
		apiKey:  apiKey,
	}
}

func (s *Server) authenticate(r *http.Request) bool {
	if s.apiKey == "" {
		return true // No auth required if API key not set
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return false
	}

	// Support both "Bearer <key>" and direct key
	token := strings.TrimPrefix(authHeader, "Bearer ")
	return token == s.apiKey
}

func (s *Server) enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

// GET /csv/:filename - Get CSV file content
func (s *Server) getCSV(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	filename := strings.TrimPrefix(r.URL.Path, "/csv/")
	log.Printf("[GET] /csv/%s from %s", filename, r.RemoteAddr)

	if !s.authenticate(r) {
		log.Printf("[GET] /csv/%s - UNAUTHORIZED", filename)
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if filename == "" {
		log.Printf("[GET] /csv/ - BAD REQUEST: filename required")
		http.Error(w, "filename required", http.StatusBadRequest)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	filePath := filepath.Join(s.dataDir, filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Return empty CSV with just headers if file doesn't exist
			var emptyCSV string
			switch filename {
			case "quest_completions.csv":
				emptyCSV = "userAddress,projectId,questId,completed,timestamp,customProgress\n"
			case "user_points.csv":
				emptyCSV = "userAddress,projectId,points\n"
			default:
				log.Printf("[GET] /csv/%s - NOT FOUND: unknown file", filename)
				http.Error(w, "unknown file", http.StatusNotFound)
				return
			}
			log.Printf("[GET] /csv/%s - OK: empty file, returning headers", filename)
			w.Header().Set("Content-Type", "text/csv")
			w.Write([]byte(emptyCSV))
			return
		}
		log.Printf("[GET] /csv/%s - ERROR: %v", filename, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("[GET] /csv/%s - OK: %d bytes", filename, len(data))
	w.Header().Set("Content-Type", "text/csv")
	w.Write(data)
}

// POST /csv/:filename - Save CSV file content
func (s *Server) saveCSV(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	filename := strings.TrimPrefix(r.URL.Path, "/csv/")
	log.Printf("[POST] /csv/%s from %s", filename, r.RemoteAddr)

	if !s.authenticate(r) {
		log.Printf("[POST] /csv/%s - UNAUTHORIZED", filename)
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if filename == "" {
		log.Printf("[POST] /csv/ - BAD REQUEST: filename required")
		http.Error(w, "filename required", http.StatusBadRequest)
		return
	}

	// Only allow specific filenames for security
	if filename != "quest_completions.csv" && filename != "user_points.csv" {
		log.Printf("[POST] /csv/%s - BAD REQUEST: invalid filename", filename)
		http.Error(w, "invalid filename", http.StatusBadRequest)
		return
	}

	var body struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("[POST] /csv/%s - BAD REQUEST: invalid json - %v", filename, err)
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	filePath := filepath.Join(s.dataDir, filename)
	if err := os.WriteFile(filePath, []byte(body.Content), 0644); err != nil {
		log.Printf("[POST] /csv/%s - ERROR: %v", filename, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("[POST] /csv/%s - OK: %d bytes written", filename, len(body.Content))
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) handleCSV(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		s.getCSV(w, r)
	case "POST":
		s.saveCSV(w, r)
	case "OPTIONS":
		s.enableCORS(w)
		w.WriteHeader(http.StatusOK)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

type Config struct {
	Port    string `envconfig:"PORT" default:"8080"`
	DataDir string `envconfig:"DATA_DIR" default:"./data"`
	ApiKey  string `envconfig:"API_KEY"`
}

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Parse config from environment
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatal(err)
	}

	if cfg.ApiKey == "" {
		log.Println("WARNING: No API_KEY set - authentication disabled")
	}

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		log.Fatal(err)
	}

	server := NewServer(cfg.DataDir, cfg.ApiKey)

	http.HandleFunc("/csv/", server.handleCSV)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s", addr)
	log.Printf("Data directory: %s", cfg.DataDir)
	log.Fatal(http.ListenAndServe(addr, nil))
}
