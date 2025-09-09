# CommunityMap - Live Community Resource Mapping Application

## Overview

CommunityMap is a full-stack web application that displays community resources like libraries, healthcare facilities, and food banks on an interactive map. The application fetches live data from OpenStreetMap using the Overpass API and provides real-time updates as users navigate the map.

## Technology Stack

### Version History
- v1.0.0 - Initial release with basic mapping functionality
- v1.1.0 - Added live data integration with Overpass API
- v1.2.0 - Fixed geospatial indexing and improved performance
- v1.3.0 - Optimized API calls and added caching layer
- v1.4.0 - Production deployment ready with Docker and CI/CD

### Backend
- **Java 17** - Programming language
- **Spring Boot 3.2.0** - Application framework
- **Spring Data MongoDB** - Database integration
- **Maven** - Build tool and dependency management
- **MongoDB** - NoSQL database for caching fetched data
- **RestTemplate** - HTTP client for API calls

### Frontend
- **React 18** - Frontend framework
- **React Leaflet** - Interactive map component
- **Axios** - HTTP client for API communication
- **CSS3** - Styling

### External APIs
- **Overpass API** - OpenStreetMap data query service
- **OpenStreetMap** - Geographic data source

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Multi-stage Dockerfile** - Optimized build process

## Project Structure

```
community_map/
├── src/main/java/com/example/communitymap/
│   ├── CommunityMapApplication.java          # Main Spring Boot application
│   ├── controller/
│   │   └── ResourceController.java           # REST API endpoints
│   ├── service/
│   │   ├── OverpassService.java              # OpenStreetMap data fetching
│   │   └── ResourceService.java              # Business logic
│   ├── model/
│   │   └── Resource.java                     # Data model
│   ├── repository/
│   │   └── ResourceRepository.java           # Database operations
│   └── exception/                            # Error handling
├── src/main/resources/
│   ├── application.properties                # Configuration
│   └── static/                              # Compiled React frontend
├── frontend/
│   ├── src/components/
│   │   ├── MapView.js                       # Main map component
│   │   ├── FilterPanel.js                   # Resource filtering
│   │   └── LoadingSpinner.js                # Loading indicators
│   └── package.json                         # Frontend dependencies
├── Dockerfile                               # Multi-stage build
├── docker-compose.yml                       # Container orchestration
└── pom.xml                                  # Maven configuration
```

## Features

- Interactive map with real-time resource discovery
- Live data fetching from OpenStreetMap
- Automatic map population on scroll and zoom
- Manual "Analyze Visible Area" button for immediate updates
- Resource filtering by type (libraries, healthcare, food assistance)
- Responsive design with modern UI
- Caching system for improved performance
- Error handling and loading states

## Prerequisites

- Docker and Docker Compose installed on your system
- Internet connection for fetching data from Overpass API

## Installation and Usage

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd community_map
```

2. Start the application:
```bash
docker-compose up --build
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

### Detailed Setup

The application uses a multi-stage Docker build process:

1. **Frontend Build Stage**: Compiles React application
2. **Backend Build Stage**: Builds Spring Boot application with embedded frontend
3. **Production Stage**: Creates optimized runtime image

The docker-compose.yml file orchestrates two services:
- **community-map-app**: Main application container
- **mongodb**: Database container for caching

### Configuration

The application is configured through `src/main/resources/application.properties`:

- **Database**: MongoDB connection settings
- **Server**: Port configuration (default: 8080)
- **Overpass API**: External API endpoint and timeout settings
- **Logging**: Application logging levels

### API Endpoints

The application provides the following REST endpoints:

- `GET /api/resources` - Get all cached resources
- `GET /api/resources/search/nearby` - Search resources near a location
- `GET /api/resources/fetch/overpass` - Fetch live data from Overpass API
- `POST /api/resources/fetch-and-save` - Fetch and cache data from Overpass API

### Usage Instructions

1. **Map Navigation**: Use mouse to pan and scroll wheel to zoom
2. **Automatic Updates**: Resources are automatically fetched when you move or zoom the map
3. **Manual Analysis**: Click "Analyze Visible Area" button to force immediate data refresh
4. **Filtering**: Use the filter panel to show/hide specific resource types
5. **Resource Details**: Click on map markers to view resource information

### Data Sources

The application fetches data from OpenStreetMap using Overpass API queries for:
- Libraries (amenity=library)
- Healthcare facilities (amenity=hospital, clinic, doctors, pharmacy)
- Food assistance (amenity=food_bank, social_facility)

### Performance Considerations

- Data is cached in MongoDB to reduce API calls
- Debounced requests prevent excessive API usage during map navigation
- Multi-stage Docker build optimizes image size
- Static frontend files are served efficiently by Spring Boot

### Troubleshooting

- Ensure Docker and Docker Compose are properly installed
- Check that ports 8080 and 27017 are available
- Verify internet connectivity for Overpass API access
- Check Docker logs for detailed error information:
```bash
docker logs community-map
docker logs community-map-mongo
```

### Development

For development purposes, you can run the frontend separately:

```bash
cd frontend
npm install
npm start
```

The frontend will run on port 3000 with proxy configuration to the backend API.

### Stopping the Application

To stop the application:
```bash
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

This application demonstrates a modern full-stack architecture with real-time data integration, providing users with up-to-date community resource information through an intuitive map interface.