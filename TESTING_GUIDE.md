# CommunityMap Testing Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Manual Testing](#manual-testing)
6. [Performance Testing](#performance-testing)
7. [API Testing](#api-testing)
8. [Test Data](#test-data)

---

## 🎯 Overview

This guide covers all aspects of testing the CommunityMap application, from unit tests to end-to-end testing.

### Test Types Covered
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **API Tests**: REST endpoint testing
- **UI Tests**: Frontend component testing
- **Manual Tests**: User acceptance testing
- **Performance Tests**: Load and stress testing

---

## 🔧 Backend Testing

### Running Backend Tests

#### All Tests
```bash
# Run all backend tests
mvn test

# Run tests with detailed output
mvn test -X

# Run tests with coverage report
mvn test jacoco:report
```

#### Specific Test Classes
```bash
# Run specific test class
mvn test -Dtest=ResourceServiceIntegrationTest

# Run tests matching pattern
mvn test -Dtest="*IntegrationTest"

# Run tests in specific package
mvn test -Dtest="com.example.communitymap.service.*"
```

#### Test Categories
```bash
# Run only unit tests
mvn test -Dtest="*Test" -DexcludedGroups="integration"

# Run only integration tests
mvn test -Dtest="*IntegrationTest"
```

### Test Structure

#### Unit Tests
```java
@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {
    
    @Mock
    private ResourceRepository resourceRepository;
    
    @InjectMocks
    private ResourceService resourceService;
    
    @Test
    void shouldAddResourceSuccessfully() {
        // Given
        Resource resource = createTestResource();
        when(resourceRepository.save(any(Resource.class)))
            .thenReturn(resource);
        
        // When
        Resource result = resourceService.addResource(resource);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Library");
        verify(resourceRepository).save(resource);
    }
}
```

#### Integration Tests
```java
@SpringBootTest
@Testcontainers
class ResourceServiceIntegrationTest {
    
    @Container
    static MongoDBContainer mongoDBContainer = 
        new MongoDBContainer("mongo:7.0");
    
    @Autowired
    private ResourceService resourceService;
    
    @Test
    void shouldFindResourcesNearby() {
        // Test implementation
    }
}
```

### Test Coverage

#### Generate Coverage Report
```bash
mvn clean test jacoco:report
```

#### View Coverage Report
```bash
# Open coverage report
open target/site/jacoco/index.html
# Or on Windows
start target/site/jacoco/index.html
```

#### Coverage Goals
- **Line Coverage**: > 80%
- **Branch Coverage**: > 70%
- **Method Coverage**: > 90%

---

## ⚛️ Frontend Testing

### Running Frontend Tests

#### All Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

#### Specific Tests
```bash
# Run specific test file
npm test -- MapView.test.js

# Run tests matching pattern
npm test -- --testNamePattern="MapView"

# Run tests in specific directory
npm test -- src/components/
```

### Test Structure

#### Component Tests
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MapView from './MapView';

describe('MapView', () => {
  test('renders map container', () => {
    render(<MapView />);
    const mapElement = screen.getByRole('application');
    expect(mapElement).toBeInTheDocument();
  });

  test('handles filter changes', () => {
    render(<MapView />);
    const libraryCheckbox = screen.getByLabelText(/libraries/i);
    fireEvent.click(libraryCheckbox);
    expect(libraryCheckbox).toBeChecked();
  });
});
```

#### Hook Tests
```javascript
import { renderHook, act } from '@testing-library/react';
import useApi from './useApi';

describe('useApi', () => {
  test('should fetch data successfully', async () => {
    const { result } = renderHook(() => useApi('/api/resources'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

### Test Utilities

#### Mock API Responses
```javascript
// __mocks__/axios.js
export default {
  get: jest.fn(() => Promise.resolve({
    data: [
      {
        id: '1',
        name: 'Test Library',
        type: 'LIBRARY',
        address: '123 Test St',
        location: { type: 'Point', coordinates: [-96.7970, 32.7767] }
      }
    ]
  }))
};
```

#### Test Setup
```javascript
// setupTests.js
import '@testing-library/jest-dom';

// Mock Leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(),
  tileLayer: jest.fn(),
  marker: jest.fn(),
  popup: jest.fn(),
  circle: jest.fn(),
  divIcon: jest.fn()
}));
```

---

## 🔗 Integration Testing

### End-to-End Tests

#### Setup Playwright
```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

#### E2E Test Example
```javascript
// e2e/map-interaction.spec.js
import { test, expect } from '@playwright/test';

test('should display resources on map', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for map to load
  await page.waitForSelector('.leaflet-container');
  
  // Check if markers are present
  const markers = await page.locator('.leaflet-marker-icon');
  await expect(markers).toHaveCount(8); // Expected number of sample resources
});

test('should filter resources by type', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Uncheck library filter
  await page.check('input[type="checkbox"][value="LIBRARY"]');
  
  // Verify markers are filtered
  const markers = await page.locator('.leaflet-marker-icon');
  await expect(markers).toHaveCount(5); // Only clinics and food banks
});
```

#### Run E2E Tests
```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test map-interaction.spec.js

# Run with UI mode
npx playwright test --ui
```

### API Integration Tests

#### Test API Endpoints
```bash
# Test health endpoint
curl -X GET http://localhost:8080/actuator/health

# Test resources endpoint
curl -X GET http://localhost:8080/api/resources

# Test nearby search
curl -X GET "http://localhost:8080/api/resources/search/nearby?lat=32.7767&lon=-96.7970&dist=1.0"
```

#### Postman Collection
```json
{
  "info": {
    "name": "CommunityMap API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Resources",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/resources",
          "host": ["{{baseUrl}}"],
          "path": ["api", "resources"]
        }
      }
    }
  ]
}
```

---

## 🧪 Manual Testing

### Test Scenarios

#### 1. **Application Startup**
- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Map displays correctly
- [ ] Sample data is loaded

#### 2. **Resource Display**
- [ ] All resources show as markers
- [ ] Markers have correct colors
- [ ] Popups display correct information
- [ ] Directions button works

#### 3. **Filtering**
- [ ] Checkboxes toggle correctly
- [ ] Map updates when filters change
- [ ] Resource count updates
- [ ] All combinations work

#### 4. **Map Interaction**
- [ ] Click to analyze works
- [ ] Search radius circle appears
- [ ] Nearby resources highlight
- [ ] Clear analysis works

#### 5. **Error Handling**
- [ ] Network errors show user-friendly messages
- [ ] Retry buttons work
- [ ] Loading states display
- [ ] Invalid inputs are handled

### Browser Testing

#### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

#### Test Checklist
```bash
# Test in different browsers
# Chrome
start chrome http://localhost:3000

# Firefox
start firefox http://localhost:3000

# Edge
start msedge http://localhost:3000
```

#### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## ⚡ Performance Testing

### Load Testing

#### Using Apache JMeter
```bash
# Download JMeter
# Create test plan with:
# - Thread Group: 100 users, 10 seconds ramp-up
# - HTTP Request: GET /api/resources
# - Response Assertion: Response time < 1000ms
```

#### Using Artillery
```bash
npm install -g artillery

# Create artillery.yml
artillery quick --count 100 --num 10 http://localhost:8080/api/resources
```

### Performance Metrics

#### Backend Metrics
- **Response Time**: < 500ms for API calls
- **Throughput**: > 100 requests/second
- **Memory Usage**: < 512MB
- **CPU Usage**: < 80%

#### Frontend Metrics
- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 4s
- **Time to Interactive**: < 5s
- **Bundle Size**: < 1MB

### Monitoring

#### Application Metrics
```bash
# Check health endpoint
curl http://localhost:8080/actuator/health

# Check metrics
curl http://localhost:8080/actuator/metrics

# Check specific metric
curl http://localhost:8080/actuator/metrics/http.server.requests
```

---

## 🔌 API Testing

### Automated API Tests

#### Using RestAssured
```java
@Test
void shouldGetAllResources() {
    given()
        .baseUri("http://localhost:8080")
    .when()
        .get("/api/resources")
    .then()
        .statusCode(200)
        .contentType(ContentType.JSON)
        .body("size()", greaterThan(0))
        .body("[0].name", notNullValue());
}
```

#### Using Newman (Postman CLI)
```bash
# Install Newman
npm install -g newman

# Run collection
newman run CommunityMap.postman_collection.json \
  --environment CommunityMap.postman_environment.json
```

### API Test Scenarios

#### 1. **Resource CRUD Operations**
```bash
# Create resource
curl -X POST http://localhost:8080/api/resources \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Resource","type":"LIBRARY","address":"123 Test St","location":{"type":"Point","coordinates":[-96.7970,32.7767]}}'

# Read resource
curl -X GET http://localhost:8080/api/resources/{id}

# Update resource
curl -X PUT http://localhost:8080/api/resources/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Resource",...}'

# Delete resource
curl -X DELETE http://localhost:8080/api/resources/{id}
```

#### 2. **Validation Tests**
```bash
# Test invalid data
curl -X POST http://localhost:8080/api/resources \
  -H "Content-Type: application/json" \
  -d '{"name":"","type":"INVALID","address":"","location":null}'
# Should return 400 Bad Request
```

#### 3. **Error Handling Tests**
```bash
# Test non-existent resource
curl -X GET http://localhost:8080/api/resources/nonexistent
# Should return 404 Not Found

# Test invalid coordinates
curl -X GET "http://localhost:8080/api/resources/search/nearby?lat=999&lon=999&dist=1"
# Should return 400 Bad Request
```

---

## 📊 Test Data

### Sample Data

#### Backend Test Data
```java
public class TestDataFactory {
    public static Resource createLibrary() {
        Resource resource = new Resource();
        resource.setName("Test Library");
        resource.setType("LIBRARY");
        resource.setAddress("123 Test St, Dallas, TX");
        resource.setLocation(new GeoJsonPoint(-96.7970, 32.7767));
        return resource;
    }
    
    public static List<Resource> createMultipleResources() {
        return Arrays.asList(
            createLibrary(),
            createClinic(),
            createFoodBank()
        );
    }
}
```

#### Frontend Test Data
```javascript
export const mockResources = [
  {
    id: '1',
    name: 'Test Library',
    type: 'LIBRARY',
    address: '123 Test St, Dallas, TX',
    location: {
      type: 'Point',
      coordinates: [-96.7970, 32.7767]
    }
  }
  // ... more test data
];
```

### Test Database

#### MongoDB Test Container
```java
@Container
static MongoDBContainer mongoDBContainer = 
    new MongoDBContainer("mongo:7.0")
        .withReuse(true);

@DynamicPropertySource
static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.data.mongodb.uri", 
        mongoDBContainer::getReplicaSetUrl);
}
```

---

## 📈 Test Reporting

### Test Reports

#### Backend Test Reports
```bash
# Generate Surefire report
mvn surefire-report:report

# View report
open target/site/surefire-report.html
```

#### Frontend Test Reports
```bash
# Generate coverage report
npm test -- --coverage

# View report
open frontend/coverage/lcov-report/index.html
```

### Continuous Integration

#### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Run backend tests
        run: mvn test
      - name: Run frontend tests
        run: |
          cd frontend
          npm install
          npm test -- --coverage
```

---

## 🚀 Running All Tests

### Complete Test Suite
```bash
# Backend tests
mvn clean test

# Frontend tests
cd frontend && npm test -- --coverage

# E2E tests
npx playwright test

# API tests
newman run api-tests.postman_collection.json
```

### Test Script
```bash
#!/bin/bash
echo "Running complete test suite..."

# Backend tests
echo "Running backend tests..."
mvn clean test
if [ $? -ne 0 ]; then
    echo "Backend tests failed!"
    exit 1
fi

# Frontend tests
echo "Running frontend tests..."
cd frontend
npm test -- --coverage
if [ $? -ne 0 ]; then
    echo "Frontend tests failed!"
    exit 1
fi

# E2E tests
echo "Running E2E tests..."
npx playwright test
if [ $? -ne 0 ]; then
    echo "E2E tests failed!"
    exit 1
fi

echo "All tests passed! 🎉"
```

---

## 📝 Test Checklist

### Pre-Release Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage > 80%
- [ ] Performance tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness tested
- [ ] Error scenarios tested
- [ ] Security tests completed

### Test Environment
- [ ] Test database is clean
- [ ] Test data is loaded
- [ ] All services are running
- [ ] Network connectivity is stable
- [ ] Test tools are installed

---

**Happy Testing! 🧪**
