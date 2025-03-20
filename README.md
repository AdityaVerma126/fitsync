# FitSync - Fitness Tracking Mobile App 💪

FitSync is a comprehensive fitness tracking application built with React Native and Expo, featuring user authentication, exercise tracking, diet monitoring, and schedule management.

## Features

- **User Authentication**: Secure login and registration system
- **Home Dashboard**: Overview of your fitness journey with quick access to all features
- **Exercise Tracking**: Add, update, and track your workouts with timers
- **Diet Monitoring**: Record meals and track calorie intake
- **Schedule Management**: Calendar view to plan and manage your fitness events
- **Profile Management**: Personalized user profile with statistics and settings

## Get Started

### Client Setup (React Native App)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

3. Open the app using one of the following:
   - Press `a` to open on Android emulator
   - Press `i` to open on iOS simulator
   - Scan the QR code with the Expo Go app on your device
   - Press `w` to open in a web browser

### Server Setup (MongoDB + Express)

1. Make sure MongoDB is installed and running on your machine
   - If not installed, download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start MongoDB service on your machine

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Start the server:
   ```bash
   cd server
   npm start
   ```

## Configuration

- The MongoDB connection is configured in `server/index.js`
- The API endpoint configuration is in `src/services/mongoService.js` 
  - For Android emulator, it's set to `http://10.0.2.2:5000`
  - For iOS simulator or physical device, update to your machine's IP address

## Technologies Used

- **Frontend**: React Native, Expo, React Navigation
- **Backend**: Express.js, MongoDB
- **Authentication**: JWT, bcrypt for password hashing
- **Storage**: Expo SecureStore for token storage

## Development Notes

- For real-world deployment, consider using environment variables for sensitive information
- The server is configured for local development; additional setup would be required for production deployment
- The current implementation uses a very basic MongoDB setup; consider adding more robust data validation and error handling for production

## License

This project is open source and available under the MIT License.
