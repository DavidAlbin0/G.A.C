# --- Fase de Construcción ---
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copiar archivos de configuración de Maven
COPY pom.xml /app/pom.xml

# Descargar dependencias para aprovechar la caché de Docker
RUN mvn dependency:go-offline -B || true

# Copiar el código fuente y compilar el JAR
COPY src /app/src
RUN mvn clean package -DskipTests

# --- Fase de Ejecución ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado en la fase anterior
COPY --from=build /app/target/*.jar app.jar

# Crear directorio para subidas de archivos
RUN mkdir -p /app/uploads

# Exponer el puerto de Spring Boot
EXPOSE 10100

ENTRYPOINT ["java", "-jar", "app.jar"]
