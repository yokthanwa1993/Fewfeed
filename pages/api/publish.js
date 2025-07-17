import multer from 'multer'
import fs from 'fs'
import path from 'path'
import FacebookPublisher from '../../lib/facebook-publisher.js'

// Setup for file uploads
const uploadDir = './public/uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const upload = multer({ 
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Disable body parsing for this API route
export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to run multer middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('imageFile'))

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    
    // Send immediate response
    res.write('🔄 Server received publish request...\n')
    res.flushHeaders() // Force send headers immediately
    res.write('📋 Extracting form data...\n')
    
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
    } = req.body
    
    res.write('✅ Form data extracted successfully\n')
    res.write(`  🔗 Link URL: ${linkUrl}\n`)
    res.write(`  📝 Link Name: ${linkName}\n`)
    if (res.flush) res.flush()
    
    if (!req.file) {
      res.write('❌ No image file was uploaded\n')
      res.end()
      return
    }
    
    res.write('📤 Preparing image for upload...\n')
    res.write(`  📁 Original filename: ${req.file.originalname}\n`)
    res.write(`  📏 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB\n`)
    if (res.flush) res.flush()
    
    // Get file extension from original filename
    const fileExtension = path.extname(req.file.originalname) || '.jpg'
    const newFilename = req.file.filename + fileExtension
    const oldPath = req.file.path
    const newPath = path.join(uploadDir, newFilename)
    
    // Rename file to include extension
    fs.renameSync(oldPath, newPath)
    req.file.path = newPath
    req.file.filename = newFilename
    
    // Create public URL for the uploaded file
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const imageUrl = `${protocol}://${host}/uploads/${newFilename}`
    res.write(`✅ Image prepared successfully!\n`)
    res.write(`  🌐 Public URL: ${imageUrl}\n\n`)
    if (res.flush) res.flush()
    
    if (!accessToken || !cookieData || !linkUrl || !linkName) {
      res.write('❌ Missing required fields\n')
      if (req.file) fs.unlinkSync(req.file.path)
      res.end()
      return
    }

    res.write('🔄 Initializing Facebook Publisher...\n')
    res.write(`  🏢 Ad Account ID: ${adAccountId || 'act_1148837732288721'}\n`)
    res.write(`  📄 Page ID: ${pageId || '146000051932080'}\n`)
    if (res.flush) res.flush()
    
    const publisher = new FacebookPublisher({
      accessToken,
      accessToken2,
      cookieData,
      adAccountId: adAccountId || 'act_1148837732288721',
      pageId: pageId || '146000051932080'
    })

    res.write('✅ Facebook Publisher initialized successfully\n')
    res.write('🚀 Starting Facebook publishing process...\n\n')
    if (res.flush) res.flush()

    // Track start time
    const startTime = Date.now()

    // Redirect console.log to response stream
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      const message = args.join(' ') + '\n'
      res.write(message)
      if (res.flush) res.flush() // Force flush each message
      originalLog(...args)
    }
    
    console.error = (...args) => {
      const message = '❌ ' + args.join(' ') + '\n'
      res.write(message)
      if (res.flush) res.flush() // Force flush each message
      originalError(...args)
    }

    try {
      // Publish to Facebook
      const result = await publisher.publishToFacebook(
        imageUrl,
        linkUrl,
        linkName,
        caption || 'LAZADA.CO.TH',
        description || 'กดเพื่อดูเพิ่มเติม'
      )

      const duration = Math.round((Date.now() - startTime) / 1000)
      res.write(`\n🎉 SUCCESS! Post published successfully!\n`)
      res.write(`🔗 View your post: ${result.url}\n`)
      res.write(`⏱️ Total time: ${duration} seconds\n`)
    } catch (error) {
      res.write(`\n💥 PUBLISHING FAILED!\n`)
      res.write(`❌ Error: ${error.message}\n`)
      res.write(`💡 Please check your tokens and try again\n`)
    } finally {
      // Restore console functions
      console.log = originalLog
      console.error = originalError
      
      // Clean up local file
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path)
          console.log(`✅ Cleaned up local file: ${req.file.filename}`)
        } catch (err) {
          console.log(`⚠️ File already deleted: ${req.file.filename}`)
        }
      }
      res.end()
    }
  } catch (error) {
    res.status(500).end(`Error: ${error.message}`)
  }
}