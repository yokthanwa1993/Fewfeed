# Fewfeed - Facebook Auto-Publisher

A modern web application for automatically publishing content to Facebook using **Node.js**, **Express**, **React**, and **Vite**.

## 🚀 Features

- **Modern React UI** with Vite for fast development
- **Real-time publishing status** with streaming updates
- **Local image hosting** for faster uploads
- **Facebook Graph API integration** with JavaScript
- **Responsive design** for mobile and desktop
- **Auto-cleanup** of uploaded files

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **CSS3** - Responsive styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **node-fetch** - HTTP client for Facebook API

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Facebook Developer Account with valid access tokens

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yokthanwa1993/Fewfeed.git
cd Fewfeed
```

2. Install dependencies:
```bash
npm install
```

## 🚀 Development

### Run in development mode (with hot reload):
```bash
npm run dev
```
This starts:
- Backend server on `http://localhost:3000`
- Vite dev server on `http://localhost:5173`

### Run backend only:
```bash
npm run server
```

### Run frontend only:
```bash
npm run client
```

## 🏗 Production Build

1. Build the React app:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## 🐳 Docker Deployment

The app is ready for Docker deployment:

```bash
docker build -t fewfeed .
docker run -p 3000:3000 fewfeed
```

## 📁 Project Structure

```
Fewfeed/
├── src/
│   ├── App.jsx          # Main React component
│   ├── App.css          # Styles
│   └── main.jsx         # React entry point
├── server.js            # Express server + API
├── facebook-publisher.js # Facebook API integration
├── vite.config.js       # Vite configuration
├── Dockerfile           # Docker configuration
└── package.json         # Dependencies and scripts
```

## 🔌 API Endpoints

- `GET /api/defaults` - Get default configuration values
- `POST /publish` - Publish content to Facebook (streaming response)
- `GET /uploads/*` - Serve uploaded images

## 🎯 Usage

1. Open the web interface
2. Fill in your Facebook credentials:
   - Access Token (Facebook Graph API token)
   - Access Token 2 (Secondary token)
   - Cookie Data (Facebook session cookies)
3. Upload an image
4. Enter link URL and headline
5. Click "Publish to Facebook"
6. Watch real-time progress updates

## 🔒 Security

- Keep Facebook access tokens secure
- Never commit credentials to version control
- Use environment variables for sensitive data

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using React + Vite + Node.js**