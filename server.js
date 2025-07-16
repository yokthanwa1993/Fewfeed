const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const port = 3000;

// Function to upload image to freeimage.host
async function uploadToFreeImageHost(filePath) {
    const fetch = (await import('node-fetch')).default;
    
    try {
        const form = new FormData();
        form.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Free API key
        form.append('action', 'upload');
        form.append('source', fs.createReadStream(filePath));
        form.append('format', 'json');

        const response = await fetch('https://freeimage.host/api/1/upload', {
            method: 'POST',
            body: form
        });

        const result = await response.json();
        
        if (result.status_code === 200) {
            return result.image.url;
        } else {
            throw new Error(`Upload failed: ${result.error?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('❌ Failed to upload to freeimage.host:', error);
        throw error;
    }
}

// Setup for file uploads
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

app.use(express.static(__dirname));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint to get default values from publish_to_facebook.sh
app.get('/api/defaults', (req, res) => {
    const scriptContent = fs.readFileSync('./publish_to_facebook.sh', 'utf8');
    
    // Extract default values using regex
    const extractValue = (varName) => {
        const regex = new RegExp(`${varName}="\\$\\{${varName}:-([^}]+)\\}"`);
        const match = scriptContent.match(regex);
        return match ? match[1] : '';
    };
    
    const defaults = {
        accessToken: extractValue('ACCESS_TOKEN'),
        accessToken2: extractValue('ACCESS_TOKEN2'),
        cookieData: extractValue('COOKIE_DATA'),
        adAccountId: extractValue('AD_ACCOUNT_ID'),
        pageId: extractValue('PAGE_ID'),
        caption: extractValue('CAPTION'),
        description: extractValue('DESCRIPTION'),
        linkUrl: extractValue('LINK_URL'),
        linkName: extractValue('LINK_NAME')
    };
    
    res.json(defaults);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/publish', upload.single('imageFile'), async (req, res) => {
    // Extract all form fields
    const { 
        accessToken, 
        accessToken2, 
        cookieData, 
        linkUrl, 
        linkName,
        adAccountId,
        pageId,
        caption,
        description
    } = req.body;
    
    if (!req.file) {
        return res.status(400).send('Error: No image file was uploaded.');
    }
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write('📤 Uploading image to freeimage.host...\n');
    
    let imageUrl;
    try {
        // Upload image to freeimage.host
        imageUrl = await uploadToFreeImageHost(req.file.path);
        res.write(`✅ Image uploaded successfully: ${imageUrl}\n\n`);
        
        console.log('=== DEBUG: Image Upload ===');
        console.log('Uploaded file:', req.file.filename);
        console.log('Public Image URL:', imageUrl);
        console.log('==========================');
    } catch (error) {
        res.write(`❌ Failed to upload image: ${error.message}\n`);
        fs.unlinkSync(req.file.path); // Clean up local file
        res.end();
        return;
    }

    // Debug: Log received values
    console.log('=== DEBUG: Received form data ===');
    console.log('ACCESS_TOKEN:', accessToken ? accessToken.substring(0, 20) + '...' : 'undefined');
    console.log('ACCESS_TOKEN2:', accessToken2 ? accessToken2.substring(0, 20) + '...' : 'undefined');
    console.log('COOKIE_DATA:', cookieData ? cookieData.substring(0, 50) + '...' : 'undefined');
    console.log('AD_ACCOUNT_ID:', adAccountId);
    console.log('PAGE_ID:', pageId);
    console.log('CAPTION:', caption);
    console.log('DESCRIPTION:', description);
    console.log('LINK_URL:', linkUrl);
    console.log('LINK_NAME:', linkName);
    console.log('================================');

    // We no longer need to check for message here
    if (!accessToken || !cookieData || !linkUrl || !linkName) {
        fs.unlinkSync(req.file.path);
        return res.status(400).send('Error: Access Token, Cookie Data, Link URL and Link Name are required.');
    }

    const scriptPath = './publish_to_facebook.sh';
    
    // Add timeout to prevent hanging
    const child = spawn('bash', [scriptPath], {
        env: {
            ...process.env,
            ACCESS_TOKEN: accessToken,
            ACCESS_TOKEN2: accessToken2,
            COOKIE_DATA: cookieData,
            IMAGE_URL: imageUrl,
            LINK_URL: linkUrl,
            LINK_NAME: linkName,
            AD_ACCOUNT_ID: adAccountId,
            PAGE_ID: pageId,
            CAPTION: caption,
            DESCRIPTION: description
        },
        timeout: 120000 // 2 minutes timeout
    });
    
    child.stdout.on('data', (data) => {
        res.write(data.toString());
    });

    child.stderr.on('data', (data) => {
        res.write(`Error: ${data.toString()}`);
    });

    // Add timeout handler
    const timeoutId = setTimeout(() => {
        res.write('\n❌ Process timed out after 2 minutes. This might be due to:\n');
        res.write('- Invalid Facebook access tokens\n');
        res.write('- Expired cookies\n');
        res.write('- Network connectivity issues\n');
        res.write('- Facebook API rate limiting\n\n');
        res.write('Please check your credentials and try again.\n');
        child.kill('SIGTERM');
        res.end();
    }, 120000);

    child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        // Clean up local file immediately since image is now hosted on freeimage.host
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`✅ Cleaned up local file: ${req.file.filename}`);
            } catch (err) {
                console.log(`⚠️  File already deleted: ${req.file.filename}`);
            }
        }
        
        if (code !== 0) {
            res.write(`\n❌ Script exited with code ${code}\n`);
            if (code === null) {
                res.write('Process was terminated (likely due to timeout)\n');
            }
        }
        res.end();
    });

    child.on('error', (error) => {
        clearTimeout(timeoutId);
        res.write(`\n❌ Process error: ${error.message}\n`);
        res.end();
    });
});

app.listen(port, () => {
    console.log(`✅ Server is running!`);
    console.log(`🌍 Open http://localhost:${port} in your browser.`);
}); 