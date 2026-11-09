FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig.json postcss.config.js tailwind.config.js ./
ENV VITE_USE_MOCK=false VITE_API_URL=/api
RUN npm run build

FROM maven:3.9-eclipse-temurin-21-alpine AS backend
WORKDIR /app
COPY obra360-backend/pom.xml ./pom.xml
COPY obra360-backend/src ./src
RUN mvn package -Dmaven.test.skip=true --batch-mode

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 10001 app && adduser -D -u 10001 -G app app && mkdir /app/data && chown app:app /app/data
COPY --from=backend /app/target/obra360-backend-1.0.0-SNAPSHOT.jar /app/app.jar
COPY --from=frontend /app/dist /app/public
ENV SPRING_PROFILES_ACTIVE=prod
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar","--spring.web.resources.static-locations=file:/app/public/"]
