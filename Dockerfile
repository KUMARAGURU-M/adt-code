# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV REACT_APP_API_URL=https://arrowdatatech.com/api
RUN REACT_APP_API_URL=https://arrowdatatech.com/api npm run build

# Stage 2: Build Spring Boot backend
FROM maven:3.9.6-eclipse-temurin-17 AS backend-build
WORKDIR /app/backend
COPY backend/adt-production-report/pom.xml ./
RUN mvn dependency:go-offline -q
COPY backend/adt-production-report/src ./src
RUN mvn clean package -DskipTests -q

# Stage 3: Final image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
COPY --from=frontend-build /app/frontend/build ./static
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]