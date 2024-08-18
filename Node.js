const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Google Drive API Setup
const CLIENT_ID = '1039609089231-fjaai67fkp49vk629qqvt4anekglji8u.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04P2_GhktRgilCgYIARAAGAQSNwF-L9IroCDf-1DLUPxMWBnnb18qBExjv7P7y3FRI5IZ4BoSwfzKDmGoKZlx8lj3DyRrBYLnRQU';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

// Serve the HTML file on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('audio'), async (req, res) => {
    const filePath = path.join(__dirname, req.file.path);

    try {
        // Upload file to Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: 'recording.mp3',
                mimeType: 'audio/mp3',
            },
            media: {
                mimeType: 'audio/mp3',
                body: fs.createReadStream(filePath),
            },
        });

        const fileId = response.data.id;

        // Set file permissions
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'writer',
                type: 'anyone',
            },
        });

        // Generate downloadable link
        const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

        // Send back the download link
        res.json({ link: downloadLink });
    } catch (error) {
        res.status(500).send('Error uploading file');
    } finally {
        // Delete the file from the server
        fs.unlinkSync(filePath);
    }
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
