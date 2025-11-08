# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
# Use a wildcard to copy both package.json and package-lock.json if it exists
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# The Express app listens on port 3000
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "server.js" ]