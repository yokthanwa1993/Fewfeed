import multer from 'multer'
import fs from 'fs'
import path from 'path'
import FacebookPublisher from '../../lib/facebook-publisher.js'

// Setup for file uploads
const uploadDir = './public/uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const upload = multer({ dest: uploadDir })

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
    
    res.write('✅ Form data extracted\n')
    
    if (!req.file) {
      res.write('❌ No image file was uploaded\n')
      res.end()
      return
    }
    
    res.write('📤 Preparing image for upload...\n')
    
    // Create public URL for the uploaded file
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`
    res.write(`✅ Image ready: ${imageUrl}\n\n`)
    
    if (!accessToken || !cookieData || !linkUrl || !linkName) {
      res.write('❌ Missing required fields\n')
      if (req.file) fs.unlinkSync(req.file.path)
      res.end()
      return
    }

    res.write('🔄 Initializing Facebook Publisher...\n')
    
    const publisher = new FacebookPublisher({
      accessToken,
      accessToken2,
      cookieData,
      adAccountId: adAccountId || 'act_1148837732288721',
      pageId: pageId || '146000051932080'
    })

    res.write('✅ Facebook Publisher initialized\n')
    res.write('🚀 Starting publishing process...\n')

    // Redirect console.log to response stream
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      const message = args.join(' ') + '\n'
      res.write(message)
      originalLog(...args)
    }
    
    console.error = (...args) => {
      const message = '❌ ' + args.join(' ') + '\n'
      res.write(message)
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

      res.write(`\n🎉 Success! Post published: ${result.url}\n`)
    } catch (error) {
      res.write(`\n💥 Publishing failed: ${error.message}\n`)
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