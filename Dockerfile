### STAGE 1: Build the React Frontend ###
FROM node:18-alpine AS frontend_build
WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package*.json ./
RUN npm ci --only=production --silent

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# Remove development dependencies to reduce image size
RUN rm -rf node_modules package-lock.json

### STAGE 2: Build the Spring Boot Backend ###
FROM maven:3.8-openjdk-17 AS backend_build
WORKDIR /app

# Copy Maven files first for better layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src
# Copy the compiled frontend code from the first stage
COPY --from=frontend_build /app/frontend/build ./src/main/resources/static

# Build the final JAR file with optimizations
RUN mvn clean package -Dmaven.test.skip=true -Dcheckstyle.skip=true -Dmaven.javadoc.skip=true

### STAGE 3: Final Production Image ###
FROM openjdk:17-jre-slim
WORKDIR /app

# Create non-root user for security
RUN addgroup --system spring && adduser --system spring --ingroup spring

# Copy the executable JAR from the backend build stage
COPY --from=backend_build /app/target/*.jar app.jar

# Change ownership to spring user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

EXPOSE 8080

# Optimize JVM settings for containers
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]