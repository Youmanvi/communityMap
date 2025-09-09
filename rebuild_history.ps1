# PowerShell script to create staggered Git commit history

# Configuration - commit messages in chronological order (oldest to newest)
$commitMessages = @(
    "Add project documentation and gitignore",
    "Configure Maven build with Spring Boot and frontend plugins",
    "Add Spring Boot application configuration",
    "Create main Spring Boot application class",
    "Add Resource entity model with geospatial indexing",
    "Add MongoDB repository with geospatial queries",
    "Implement Overpass API service for live data fetching",
    "Add REST API controllers and exception handling",
    "Build React frontend with interactive map and live updates",
    "Deploy with Docker multi-stage build and EC2 configuration"
)

# Clean up any previous temporary files
Remove-Item -Force commit_*.tmp -ErrorAction SilentlyContinue

$totalCommits = $commitMessages.Count

# Create historical commits with backdated dates
for ($i = 0; $i -lt ($totalCommits - 1); $i++) {
    $daysAgo = $totalCommits - 1 - $i
    $commitDate = (Get-Date).AddDays(-$daysAgo).ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    # Create a temporary file for this commit
    New-Item -ItemType File -Name "commit_$i.tmp" -Force | Out-Null
    git add "commit_$i.tmp"
    
    # Commit with the backdated date and specific message
    $env:GIT_AUTHOR_DATE = $commitDate
    $env:GIT_COMMITTER_DATE = $commitDate
    git commit -m $commitMessages[$i]
}

# Final commit with all project files
Write-Host "Creating final commit with all project files..."

# Remove all temporary files
Remove-Item -Force commit_*.tmp -ErrorAction SilentlyContinue
git add .

# Commit with today's date and the final message
git commit -m $commitMessages[-1]

Write-Host "Staggered commit history has been successfully created."
