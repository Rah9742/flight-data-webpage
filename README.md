# DfT Aviation Data Portal

An interactive aviation data portal for monitoring and analyzing flight status data in real-time.

## Prerequisites

Before you begin, ensure you have the following installed on your macOS:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository or download the source code

2. Open Terminal and navigate to the project directory:
   ```bash
   cd /path/to/flight-data-webpage
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

## Running the Application

This application consists of both a frontend and a backend server. You'll need to run both servers simultaneously.

1. Start the backend server:
   ```bash
   npm start
   ```
   This will start the Express server on port 5001

2. In a new Terminal window, start the frontend development server:
   ```bash
   npm run dev
   ```
   This will start the Vite development server on port 3000

3. Open your web browser and visit:
   ```
   http://localhost:3000
   ```

## Project Structure

```
├── src/
│   ├── components/      # React components
│   ├── server/          # Express backend server
│   ├── App.jsx          # Main React component
│   ├── index.jsx        # React entry point
│   └── theme.js         # Material-UI theme configuration
├── vite.config.js       # Vite configuration
└── package.json         # Project dependencies and scripts
```

## Available Scripts

- `npm run dev`: Starts the Vite development server
- `npm start`: Starts the Express backend server
- `npm run build`: Builds the frontend for production
- `npm run preview`: Previews the production build locally

## Features

- Real-time flight status updates
- Historical flight data analysis
- Filtering by airlines, airports, and flight status
- Interactive data grid display
- WebSocket integration for live updates

## Dependencies

- React and React Router for frontend
- Material-UI for UI components
- Express.js for backend server
- Socket.IO for real-time updates
- Axios for HTTP requests
- Vite for build tooling and development server