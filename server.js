const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');

const app = express();
const storage = new Storage();
const upload = multer({ storage: multer.memoryStorage() });

// GANTI INI dengan nama bucket Anda
const BUCKET_NAME = process.env.BUCKET_NAME || 'gdgocbinus';

// CORS configuration - allow all origins for development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files (index.html)
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', bucket: BUCKET_NAME });
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const blob = storage.bucket(BUCKET_NAME).file(Date.now() + '-' + req.file.originalname);
        const blobStream = blob.createWriteStream();

        blobStream.on('error', (err) => {
            res.status(500).json({ error: err.message });
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${blob.name}`;
            res.json({
                success: true,
                url: publicUrl,
                filename: blob.name
            });
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));