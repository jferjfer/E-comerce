FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN apk add --no-cache maven
RUN mvn clean package -DskipTests

EXPOSE 3008

CMD ["java", "-jar", "target/servicio-credito-1.0.0.jar"]