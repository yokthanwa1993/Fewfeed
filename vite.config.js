import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import FacebookPublisher from './facebook-publisher.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Setup for file uploads
const uploadDir = './uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}
const upload = multer({ dest: uploadDir })

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server) {
        // Add API routes to Vite dev server
        server.middlewares.use('/uploads', express.static(path.join(__dirname, 'uploads')))
        
        // API endpoint to get default values
        server.middlewares.use('/api/defaults', (req, res, next) => {
          if (req.method !== 'GET') return next()
          
          try {
            // Default values (you can move these to environment variables)
            const defaults = {
              accessToken: 'EAAE0ZAUxkwC0BPFoWjMx1zhteOZAtnPuwJjkZCjieZA8PUNHNZAstqecTKKk1YsNYREx0fVD88H4HiJDjTp4J9Ck6iA6PCZAnb71Ku2Qc43274WHkQ2Qlny39fHl2GTsH0VvYdRGa7xuzanRjaTKIzphjsPmVSzjf6aXNEKD8SNWucNb8iNnEcUZCR45USx2qZAhBZAfZBl3otFbVu2pYHlyvU6ZARS',
              accessToken2: 'EAAChZCKmUTDcBPPXbtYYXGtY0ZBh8khmzbZCAEVOqRZCQZAdQgYFNJOaMqt0NLpm1myrxytZChZBSrPBeHrpbJhD8oSMUzwDb5ZB7NJ2X3R3tLZAI0jOwZBlFYU8b8U7cttG6oyWS5cZBlvGN8XChQcgnZBZAqhXhbFvZAgvTedPRrZARfinO2Ic2s9TL2tZABG2tPlNUxPxEhvkcLTx5ZCjILogIiPMQZBIUZD',
              cookieData: 'dbln=%7B%22100056864839947%22%3A%22fQL0ngDj%22%7D; datr=FY5vaJkvRxhuJNlz9lRPAsOW; sb=FY5vaD1eu37Fg5HEh6yKmyQV; wd=2560x1210; locale=th_TH; c_user=100056864839947; xs=15%3APWCSP7Z44IGmvg%3A2%3A1752141442%3A-1%3A-1; fr=06GRkBXJsb8iRi1ye.AWe86VQQFfT_m4RO_Helcqvd-gsXl4OIqZby3wTRnoOA2BgfxcM.Bob44V..AAA.0.0.Bob5MS.AWfB267gsIDD_HBckJjKDHSNPdk;',
              adAccountId: 'act_1148837732288721',
              pageId: '146000051932080',
              caption: 'LAZADA.CO.TH',
              description: 'กดเพื่อดูเพิ่มเติม',
              linkUrl: 'https://s.lazada.co.th/s.yQ0ji?cc',
              linkName: 'พิกัด : เสื้อยืดแขนสั้นผู้หญิงสีขาว'
            }
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(defaults))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
        })

        // Publish endpoint - handle multipart form data
        server.middlewares.use('/publish', (req, res, next) => {
          if (req.method !== 'POST') return next()
          
          // Use multer to handle the multipart form data
          upload.single('imageFile')(req, res, async (err) => {
            if (err) {
              res.statusCode = 500
              res.end(`Upload error: ${err.message}`)
              return
            }
          
          try {
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
            const host = req.headers.host || 'localhost:5173'
            const protocol = req.headers['x-forwarded-proto'] || 'http'
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
            res.statusCode = 500
            res.end(`Error: ${error.message}`)
          }
          })
        })
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})