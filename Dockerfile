FROM alpine:3.20

WORKDIR /app

# Minimal runtime dependencies for a generic containerized app entrypoint.
RUN apk add --no-cache bash curl

COPY . /app

# The actual app start command is supplied via APP_START_COMMAND in .env.
CMD sh -c "${APP_START_COMMAND:-echo 'APP_START_COMMAND is not set. Update .env before deploying.' && tail -f /dev/null}"
