# --- Fase de Construcción ---
FROM gradle:8.14-jdk21 AS build
WORKDIR /app

# Copiar configuración de dependencias y código fuente
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src

# Compilar el JAR ejecutable usando la instalación global de Gradle
RUN gradle bootJar --no-daemon -x test

# --- Fase de Ejecución ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el JAR generado
COPY --from=build /app/build/libs/*.jar app.jar

# Exponer el puerto del microservicio de XMLends
EXPOSE 10102

ENTRYPOINT ["java", "-jar", "app.jar"]
