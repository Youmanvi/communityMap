# CommunityMap User Guide

## 📖 Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Using the Application](#using-the-application)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)
9. [Development](#development)

---

## 🚀 Quick Start

**Want to get up and running quickly?** Follow these steps:

1. **Start MongoDB**: `mongod` (or start MongoDB service)
2. **Backend**: `mvn spring-boot:run`
3. **Frontend**: `cd frontend && npm install && npm start`
4. **Open**: http://localhost:3000

---

## 📋 Prerequisites

### Required Software
- **Java 17+** - [Download here](https://adoptium.net/)
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **MongoDB 4.4+** - [Download here](https://www.mongodb.com/try/download/community)
- **Maven 3.6+** - [Download here](https://maven.apache.org/download.cgi)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

### Verify Installation
```bash
# Check Java version
java -version

# Check Node.js version
node --version

# Check MongoDB
mongod --version

# Check Maven
mvn --version
```

---

## 🛠 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd community_map
```

### 2. Backend Setup
```bash
# Install dependencies (Maven will handle this automatically)
mvn clean install

# Optional: Create Maven wrapper
mvn wrapper:wrapper
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Database Setup
```bash
# Start MongoDB (choose your method)

# Method 1: Command line
mongod

# Method 2: Windows Service
net start MongoDB

# Method 3: macOS (if installed via Homebrew)
brew services start mongodb-community

# Method 4: Linux (systemd)
sudo systemctl start mongod
```

---

## ▶️ Running the Application

### Backend (Spring Boot)
```bash
# From project root directory
mvn spring-boot:run

# Or using Maven wrapper
./mvnw spring-boot:run

# Or run the JAR file
mvn clean package
java -jar target/community-map-0.0.1-SNAPSHOT.jar
```

**Backend will start on**: http://localhost:8080

### Frontend (React)
```bash
# From frontend directory
cd frontend
npm start

# Or using yarn
yarn start
```

**Frontend will start on**: http://localhost:3000

### Verify Everything is Running
1. **Backend Health Check**: http://localhost:8080/actuator/health
2. **Frontend**: http://localhost:3000
3. **API Test**: http://localhost:8080/api/resources

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=ResourceServiceIntegrationTest

# Run with coverage
mvn test jacoco:report
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Integration Tests
```bash
# Backend integration tests (uses TestContainers)
mvn test -Dtest=*IntegrationTest

# End-to-end testing (if implemented)
npm run test:e2e
```

### Manual Testing
1. **API Testing**: Use Postman or curl
2. **UI Testing**: Test all features in the browser
3. **Performance Testing**: Use tools like Apache JMeter

---

## 🎯 Using the Application

### Main Features

#### 1. **Viewing Resources**
- All community resources are displayed as colored markers on the map
- **Green markers**: Libraries 📚
- **Blue markers**: Clinics 🏥
- **Yellow markers**: Food Banks 🍽️

#### 2. **Filtering Resources**
- Use the **Filter Panel** (top-left corner)
- Toggle checkboxes to show/hide different resource types
- Real-time filtering updates the map immediately

#### 3. **Analyzing Areas**
- **Click anywhere** on the map to analyze resources within 1 mile
- Nearby resources will turn **red**
- A **red circle** shows the search radius
- Results are displayed in the Filter Panel

#### 4. **Viewing Resource Details**
- **Click on any marker** to see a popup with:
  - Resource name
  - Type
  - Address
  - "Directions" button (opens Google Maps)

#### 5. **Navigation**
- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Reset**: Double-click to recenter

### User Interface Elements

#### Filter Panel
- **Location**: Top-left corner
- **Features**:
  - Resource type checkboxes
  - Analysis results
  - Clear analysis button

#### Resource Counter
- **Location**: Bottom-right corner
- **Shows**: "Showing X of Y resources"

#### Error Messages
- **Appear**: When API calls fail
- **Include**: Retry button for failed operations

---

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api/resources
```

### Endpoints

#### 1. Get All Resources
```http
GET /api/resources
```
**Response**: Array of all resources
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Central City Library",
    "type": "LIBRARY",
    "address": "1515 Young St, Dallas, TX 75201",
    "location": {
      "type": "Point",
      "coordinates": [-96.7970, 32.7767]
    }
  }
]
```

#### 2. Get Paginated Resources
```http
GET /api/resources/paginated?page=0&size=10
```
**Parameters**:
- `page`: Page number (default: 0)
- `size`: Items per page (default: 10)

#### 3. Get Resource by ID
```http
GET /api/resources/{id}
```

#### 4. Add New Resource
```http
POST /api/resources
Content-Type: application/json

{
  "name": "New Library",
  "type": "LIBRARY",
  "address": "123 Main St, Dallas, TX",
  "location": {
    "type": "Point",
    "coordinates": [-96.7970, 32.7767]
  }
}
```

#### 5. Update Resource
```http
PUT /api/resources/{id}
Content-Type: application/json

{
  "name": "Updated Library Name",
  "type": "LIBRARY",
  "address": "123 Main St, Dallas, TX",
  "location": {
    "type": "Point",
    "coordinates": [-96.7970, 32.7767]
  }
}
```

#### 6. Delete Resource
```http
DELETE /api/resources/{id}
```

#### 7. Find Nearby Resources
```http
GET /api/resources/search/nearby?lat=32.7767&lon=-96.7970&dist=1.0
```
**Parameters**:
- `lat`: Latitude
- `lon`: Longitude
- `dist`: Distance in miles (default: 1.0)

### Error Responses
```json
{
  "status": 400,
  "error": "Validation Error",
  "message": "Resource name is required",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Health Check
```http
GET /actuator/health
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **MongoDB Connection Error**
```
Error: Could not connect to MongoDB
```
**Solutions**:
- Ensure MongoDB is running: `mongod`
- Check connection string in `application.properties`
- Verify MongoDB port (default: 27017)

#### 2. **Port Already in Use**
```
Error: Port 8080 is already in use
```
**Solutions**:
- Change port: `server.port=8081` in `application.properties`
- Kill existing process: `lsof -ti:8080 | xargs kill -9`

#### 3. **Frontend Build Errors**
```
Error: Module not found
```
**Solutions**:
- Clear cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

#### 4. **CORS Errors**
```
Error: CORS policy blocks request
```
**Solutions**:
- Check CORS configuration in `ResourceController.java`
- Ensure frontend URL is whitelisted

#### 5. **Map Not Loading**
```
Error: Map tiles not loading
```
**Solutions**:
- Check internet connection
- Verify Leaflet CSS is imported
- Check browser console for errors

### Debug Mode

#### Backend Debugging
```bash
# Enable debug logging
export LOGGING_LEVEL_COM_EXAMPLE_COMMUNITYMAP=DEBUG

# Run with debug port
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

#### Frontend Debugging
```bash
# Enable React DevTools
npm start

# Check browser console for errors
# Use React Developer Tools extension
```

### Logs Location
- **Backend**: Console output
- **Frontend**: Browser console (F12)

---

## 🛠 Development

### Project Structure
```
community-map/
├── src/main/java/com/example/communitymap/
│   ├── model/           # Data models
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic
│   ├── controller/      # REST endpoints
│   ├── exception/       # Error handling
│   └── config/          # Configuration
├── src/test/java/       # Test classes
├── frontend/src/
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks
│   └── css/             # Stylesheets
└── docs/                # Documentation
```

### Adding New Features

#### 1. **Backend**
```java
// 1. Create model
@Entity
public class NewResource { ... }

// 2. Create repository
public interface NewResourceRepository extends MongoRepository<NewResource, String> { ... }

// 3. Create service
@Service
public class NewResourceService { ... }

// 4. Create controller
@RestController
public class NewResourceController { ... }
```

#### 2. **Frontend**
```javascript
// 1. Create component
const NewComponent = () => { ... };

// 2. Add to routing
<Route path="/new-feature" component={NewComponent} />

// 3. Update navigation
<Link to="/new-feature">New Feature</Link>
```

### Environment Variables
```bash
# Backend
export MONGODB_URI=mongodb://localhost:27017/community_map
export SERVER_PORT=8080

# Frontend
export REACT_APP_API_URL=http://localhost:8080
```

### Code Style
- **Backend**: Follow Spring Boot conventions
- **Frontend**: Use ESLint configuration
- **Commits**: Use conventional commit messages

---

## 📞 Support

### Getting Help
1. **Check this guide** for common issues
2. **Review logs** for error messages
3. **Search issues** in the project repository
4. **Create new issue** with detailed information

### Reporting Bugs
When reporting bugs, include:
- **OS**: Windows/macOS/Linux version
- **Java version**: `java -version`
- **Node.js version**: `node --version`
- **Error messages**: Full stack trace
- **Steps to reproduce**: Detailed steps
- **Expected vs actual behavior**

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Mapping! 🗺️**
