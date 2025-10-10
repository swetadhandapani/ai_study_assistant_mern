require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

connectDB();
const app = express();

// ✅ CORS setup 
const allowedOrigins = [
  "http://localhost:3000",
  "http://54.198.181.106:3000",
  "http://54.198.181.106", // if you serve frontend directly from EC2
  "https://your-domain.com", // optional if you use a custom domain later
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
// Serve uploads without /api
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//  Serve uploaded files
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    if (/\.(pdf|docx|xlsx|pptx)$/i.test(filePath)) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.basename(filePath)}"`
      );
    }
  },
}));

//  Backend API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/audio', require('./routes/audio'));

//  Serve React frontend (after running `npm run build` in frontend)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ✅ React Router fallback (for Dashboard, Profile, Upload, etc.)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ✅ Start server
let server;
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = { app, server };
