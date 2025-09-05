# Use the official node Image
FROM node:22-slim

# Copy the dependencies of node. package.json and package-lock.json
COPY package*.json ./

# install the dependencies. Told me to use production but I don't have any developer only dependencies
RUN npm install

# Copy over the rest of the files
COPY . .

# Exposes the port, I will want to use an environment variable for this possibly
EXPOSE 7777

# Starts up the server
CMD ["npm", "run", "prod"]