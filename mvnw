#!/bin/sh
# Root mvnw for Unix/Bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/.maven/apache-maven-3.9.8/bin/mvn" "$@"
