# --- Fase de Construcción ---
FROM gradle:8.14-jdk21 AS build
WORKDIR /app

# Copiar archivos de configuración de Gradle
COPY gradle /app/gradle
COPY gradlew /app/gradlew
COPY settings.gradle.kts /app/settings.gradle.kts
COPY build.gradle.kts /app/build.gradle.kts

# Asegurar permisos de ejecución para gradlew
RUN chmod +x /app/gradlew

# Descargar dependencias para aprovechar la caché de Docker
RUN ./gradlew dependencies --no-daemon || true

# Copiar el código fuente y compilar el JAR
COPY src /app/src
RUN ./gradlew bootJar --no-daemon -x test

# --- Fase de Ejecución ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado en la fase anterior
COPY --from=build /app/build/libs/*.jar app.jar

# Crear directorio para subidas de archivos
RUN mkdir -p /app/uploads

# Exponer el puerto de Spring Boot
EXPOSE 10100

ENTRYPOINT ["java", "-jar", "app.jar"]
