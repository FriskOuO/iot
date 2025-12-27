require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mDNS = require('multicast-dns');
const ip = require('ip');

const app = express();
app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = 3005; // Change port to 3005 to avoid conflicts
const HOSTNAME = 'meme-parking.local';

// --- mDNS Setup ---
const mdns = mDNS();

mdns.on('query', (query) => {
  if (query.questions.some(q => q.name === HOSTNAME)) {
    const localIp = ip.address();
    console.log(`mDNS: Responding to query for ${HOSTNAME} -> ${localIp}`);
    
    mdns.respond({
      answers: [{
        name: HOSTNAME,
        type: 'A',
        ttl: 300,
        data: localIp
      }]
    });
  }
});

console.log(`mDNS Responder started: ${HOSTNAME} -> ${ip.address()}`);

// Configure Nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Must be an App Password, not login password
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).json({ message: 'Email sent successfully', info });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// NTP Simulation Endpoint (Handler)
const handleNTP = (req, res) => {
  const now = new Date();
  res.json({
    t1: req.query.t0 || Date.now(),
    t2: Date.now(),
    t3: Date.now(),
    stratum: 2,
    refId: "GOOG",
    serverTime: now.toISOString()
  });
};

// Support both paths to handle proxy stripping behavior
app.get('/api/ntp', handleNTP);
app.get('/ntp', handleNTP);

// Health Check
app.get('/', (req, res) => {
  res.send('Meme Parking Backend is Running!');
});

// 404 Handler for debugging
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send(`Not Found: ${req.method} ${req.url}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
