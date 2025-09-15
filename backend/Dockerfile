# Use the official k6 Docker image as the base
FROM grafana/k6

# Copy your test script into the container
COPY load_test.js /load_test.js

# Set the command to run the test when the container starts
CMD ["run", "/load_test.js"]