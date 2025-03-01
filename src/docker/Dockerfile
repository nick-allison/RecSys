# Use an official lightweight Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Install required Python packages
RUN pip install --no-cache-dir fastapi uvicorn pandas numpy tensorflow

# Copy the application code and model files into the container
COPY main.py /app/
COPY movie_embeddings.csv /app/
COPY model.keras /app/

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Command to run the app with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
