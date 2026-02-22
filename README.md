# CarizmaX - Online Resume Builder

A full-stack web application to build professional resumes with ease.

## Features
- **Authentication**: JWT based login/register with password hashing.
- **Dashboard**: Manage multiple resumes (Create, Edit, Delete).
- **Live Preview**: Real-time update as you type.
- **Templates**: Multiple professional templates to choose from.
- **PDF Generation**: High-quality PDF export using jsPDF and html2canvas.
- **Responsive Design**: Works on all screen sizes.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Auth**: JWT, bcryptjs
- **PDF**: jsPDF, html2canvas

## Project Structure
```
/client
  /css
    style.css
  /js
    api.js
    builder.js
  index.html
  login.html
  register.html
  dashboard.html
  builder.html
/server
  /controllers
  /models
  /routes
  /middleware
  server.js
package.json
.env
```

## Setup Instructions

### 1. Prerequisites
- Node.js installed on your machine.
- MongoDB Atlas account (or local MongoDB).

### 2. Installation
1. Clone the repository or extract the files.
2. Open terminal in the project root.
3. Install dependencies:
   ```bash
   npm install
   ```

### 3. Environment Configuration
Create a `.env` file in the root directory and add:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 4. Running the Application
**Development mode (using nodemon):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will be available at `http://localhost:5000`.

## Deployment Guide

### 1. Database (MongoDB Atlas)
1.  Log in to MongoDB Atlas.
2.  Go to **Network Access** and click **Add IP Address**.
3.  Select **Allow Access From Anywhere** (or add Render's specific outbound IPs if known) and click **Confirm**.
4.  Get your connection string from **Database -> Connect -> Drivers**.

### 2. Backend (Render)
1.  Push your code to GitHub.
2.  In Render, create a new **Web Service**.
3.  Connect your repository.
4.  **Runtime**: `Node`
5.  **Build Command**: `npm install`
6.  **Start Command**: `node server/server.js`
7.  **Environment Variables**:
    *   `MONGODB_URI`: Your Atlas connection string.
    *   `JWT_SECRET`: A long random string.
    *   `PORT`: `5000`

### 3. Frontend (Vercel)
1.  Open `client/js/api.js` and update `API_URL` with your **Render URL**.
    *   Example: `const API_URL = 'https://your-app.onrender.com/api';`
2.  Push changes to GitHub.
3.  In Vercel, create a new project and import your repository.
4.  Set **Root Directory** to `client`.
5.  Leave **Build Command** and **Output Directory** as defaults.
6.  Deploy!

## Security
- **CORS**: The backend is configured to allow requests from your frontend.
- **JWT**: Tokens are stored in `localStorage`. For production, consider using HttpOnly cookies.
- **Data**: Ensure your MongoDB Atlas connection is secure and your IP whitelist is managed.
