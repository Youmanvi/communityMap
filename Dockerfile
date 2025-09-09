### STAGE 1: Build the React Frontend ###
FROM node:18-alpine AS frontend_build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

### STAGE 2: Build the Spring Boot Backend ###
FROM maven:3.8-openjdk-17 AS backend_build
WORKDIR /app
# Copy the Maven project file
COPY pom.xml .
# Copy the backend source code
COPY src ./src
# Copy the compiled frontend code from local filesystem
COPY src/main/resources/static ./src/main/resources/static
# Build the final JAR file - skip tests completely
RUN mvn clean package -Dmaven.test.skip=true -Dcheckstyle.skip=true

### STAGE 3: Final Production Image ###
FROM openjdk:17-jdk-slim
WORKDIR /app
# Copy the executable JAR from the backend build stage
COPY --from=backend_build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]