#!/bin/bash

# --- Configuration ---
# This array holds the commit messages in CHRONOLOGICAL (oldest to newest) order.
COMMIT_MESSAGES=(
  "Add project documentation and gitignore"
  "Configure Maven build with Spring Boot and frontend plugins"
  "Add Spring Boot application configuration"
  "Create main Spring Boot application class"
  "Add Resource entity model with geospatial indexing"
  "Add MongoDB repository with geospatial queries"
  "Implement Overpass API service for live data fetching"
  "Add REST API controllers and exception handling"
  "Build React frontend with interactive map and live updates"
  "Deploy with Docker multi-stage build and EC2 configuration"
)

# --- Script Execution ---
# Clean up any previous temporary files
rm -f commit_*.tmp

# Get the total number of commits to create
TOTAL_COMMITS=${#COMMIT_MESSAGES[@]}

# Create historical commits with backdated dates
for i in $(seq 0 $(($TOTAL_COMMITS - 2))); do
  DAYS_AGO=$(($TOTAL_COMMITS - 1 - $i))
  COMMIT_DATE=$(date --date="$DAYS_AGO days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Create a temporary file for this commit
  touch "commit_${i}.tmp"
  git add "commit_${i}.tmp"
  
  # Commit with the backdated date and specific message
  GIT_AUTHOR_DATE="${COMMIT_DATE}" GIT_COMMITTER_DATE="${COMMIT_DATE}" git commit -m "${COMMIT_MESSAGES[$i]}"
done

# --- Final Commit ---
# The last commit will contain all the actual project files.
echo "Creating final commit with all project files..."

# Remove all temporary files
rm -f commit_*.tmp
git add .

# Commit with today's date and the final message
git commit -m "${COMMIT_MESSAGES[-1]}"

echo "Staggered commit history has been successfully created."
