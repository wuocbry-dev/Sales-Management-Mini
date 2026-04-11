# Build JAR rồi chạy JRE 21 — DB/JWT truyền qua biến môi trường (docker-compose).
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1000 app && adduser -u 1000 -G app -D app
COPY --from=build /app/target/quan-ly-ban-hang-backend-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
