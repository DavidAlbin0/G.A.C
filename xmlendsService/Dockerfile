# --- Fase de Construcción ---
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copiar configuración de dependencias y código fuente
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src

# Compilar el JAR ejecutable usando Maven
RUN mvn clean package -DskipTests

# --- Fase de Ejecución ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado
COPY --from=build /app/target/*.jar app.jar

# Exponer el puerto del microservicio de XMLends
EXPOSE 10102

ENTRYPOINT ["java", "-jar", "app.jar"]
