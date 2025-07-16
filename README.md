# Fewfeed - Facebook Auto-Publisher

A modern web application for Facebook publishing using Next.js

## Features

- 🚀 Built with Next.js 14
- 📱 Responsive design
- 🔄 Real-time publishing status
- 📤 Image upload support
- 🎯 Facebook Graph API integration
- ⚡ Server-side API routes

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm 8.0.0 or later

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fewfeed
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
fewfeed/
├── pages/
│   ├── api/
│   │   ├── defaults.js      # Default configuration API
│   │   └── publish.js       # Facebook publishing API
│   ├── _app.js              # Next.js app component
│   └── index.js             # Main page
├── lib/
│   └── facebook-publisher.js # Facebook API integration
├── styles/
│   ├── globals.css          # Global styles
│   └── Home.module.css      # Home page styles
├── public/
│   └── uploads/             # Temporary file uploads
└── next.config.js           # Next.js configuration
```

## API Routes

- `GET /api/defaults` - Get default configuration values
- `POST /api/publish` - Publish content to Facebook

## Configuration

Update the default values in `/pages/api/defaults.js` or use environment variables for sensitive data.

## Technologies Used

- **Next.js** - React framework
- **React** - UI library
- **Multer** - File upload handling
- **Facebook Graph API** - Social media integration
- **CSS Modules** - Styling

## License

MIT