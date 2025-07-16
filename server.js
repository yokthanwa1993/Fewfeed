const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const FacebookPublisher = require('./facebook-publisher');

const app = express();
const port = 3000;

// Function to clean up uploaded files after successful Facebook post
function cleanupUploadedFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Cleaned up uploaded file: ${path.basename(filePath)}`);
            return true;
        }
    } catch (err) {
        console.log(`⚠️ Failed to cleanup file: ${err.message}`);
        return false;
    }
    return false;
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
    
    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send immediate response to browser
    res.write('🔄 Server received publish request...\n');
    res.write('📤 Preparing image for upload...\n');
    
    // Create public URL for the uploaded file
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.write(`✅ Image ready: ${imageUrl}\n\n`);
    
    // Force flush the response to browser immediately
    res.flushHeaders();
    
    console.log('=== DEBUG: Image Upload ===');
    console.log('Uploaded file:', req.file.filename);
    console.log('Local file path:', req.file.path);
    console.log('Public Image URL:', imageUrl);
    console.log('==========================');

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

    // Use JavaScript Facebook Publisher instead of shell script
    res.write('🔄 Initializing Facebook Publisher...\n');
    if (res.flush) res.flush();
    
    try {
        const publisher = new FacebookPublisher({
            accessToken,
            accessToken2,
            cookieData,
            adAccountId: adAccountId || 'act_1148837732288721',
            pageId: pageId || '146000051932080'
        });

        res.write('✅ Facebook Publisher initialized\n');
        res.write('🚀 Starting publishing process...\n');
        if (res.flush) res.flush();

        // Redirect console.log to response stream for real-time updates
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = (...args) => {
            const message = args.join(' ') + '\n';
            res.write(message);
            originalLog(...args);
        };
        
        console.error = (...args) => {
            const message = '❌ ' + args.join(' ') + '\n';
            res.write(message);
            originalError(...args);
        };

        // Publish to Facebook
        const result = await publisher.publishToFacebook(
            imageUrl,
            linkUrl,
            linkName,
            caption || 'LAZADA.CO.TH',
            description || 'กดเพื่อดูเพิ่มเติม'
        );

        // Restore original console functions
        console.log = originalLog;
        console.error = originalError;

        res.write(`\n🎉 Success! Post published: ${result.url}\n`);
        
    } catch (error) {
        // Restore original console functions
        console.log = originalLog;
        console.error = originalError;
        
        res.write(`\n💥 Publishing failed: ${error.message}\n`);
        console.error('Publishing error:', error);
    } finally {
        // Clean up local file
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`✅ Cleaned up local file: ${req.file.filename}`);
            } catch (err) {
                console.log(`⚠️  File already deleted: ${req.file.filename}`);
            }
        }
        res.end();
    }
});

app.listen(port, () => {
    console.log(`✅ Server is running!`);
    console.log(`🌍 Open http://localhost:${port} in your browser.`);
}); 