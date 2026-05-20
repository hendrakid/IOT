# Mosquitto (development)

Anonymous access on port **1883** for local development.

## Start

From repository root:

```bash
docker compose up -d
```

## Optional authentication (production)

1. Create password file inside the container or mount `passwd` and set `password_file` in `mosquitto.conf`.
2. Set `allow_anonymous false`.
3. Configure `MQTT_USERNAME` / `MQTT_PASSWORD` in `web/.env` and `MQTT_USERNAME` / `MQTT_PASSWORD` in `firmware/include/config.h`.
