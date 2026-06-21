const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const TELEGRAM_BOT_TOKEN = '8614752449:AAFiqOv4F4NEVYArqO4Ti6Mz9UgKkmeS_w8'; 
const CHAT_ID = '-1004362065864';

app.use(express.json());

// CORS Error Fix
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// 1. VIDEO UPLOAD ROUTE
app.post('/upload-video', upload.single('video'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('video', fs.createReadStream(filePath));

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
        const response = await axios.post(telegramUrl, form, { headers: form.getHeaders() });

        const fileId = response.data.result.video.file_id;
        fs.unlinkSync(filePath);

        res.json({ success: true, fileId: fileId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// 2. VIDEO STREAMING ROUTE (Isse video player mein chalegi)
app.get('/stream/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
        const fileData = await axios.get(url);
        const filePath = fileData.data.result.file_path;
        
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
        
        // Telegram se video stream karke client ko bhejna
        res.redirect(fileUrl);
    } catch (error) {
        res.status(500).send("Video stream nahi ho pa rahi hai.");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Intube Backend is running on port ${PORT}`));
