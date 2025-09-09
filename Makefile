# Makefile for the CommunityMap Project

.PHONY: run setup clean help

# Target: help
# Description: Shows available commands
help:
	@echo "Available commands:"
	@echo "  make setup    - Install frontend dependencies"
	@echo "  make run      - Run both backend and frontend servers"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make help     - Show this help message"

# Target: setup
# Description: Installs npm dependencies for the frontend
setup:
	@echo "--- Installing frontend dependencies ---"
	cd frontend && npm install
	@echo "--- Setup complete ---"

# Target: run
# Description: Runs both the backend and frontend servers concurrently
run:
	@echo "--- Starting CommunityMap application ---"
	@echo "Backend will be available at http://localhost:8080"
	@echo "Frontend will be available at http://localhost:3000"
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@echo "Starting backend server..."
	@mvn spring-boot:run & \
	cd frontend && npm start

# Target: clean
# Description: Clean build artifacts
clean:
	@echo "--- Cleaning build artifacts ---"
	@mvn clean
	@cd frontend && rm -rf node_modules build
	@echo "--- Clean complete ---"
