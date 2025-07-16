import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const { file } = req.query
  
  if (!file || !Array.isArray(file)) {
    return res.status(400).json({ error: 'Invalid file path' })
  }
  
  const filename = file.join('/')
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
  
  // Security check - ensure file is within uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const resolvedPath = path.resolve(filePath)
  const resolvedUploadsDir = path.resolve(uploadsDir)
  
  if (!resolvedPath.startsWith(resolvedUploadsDir)) {
    return res.status(403).json({ error: 'Access denied' })
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  
  try {
    const stat = fs.statSync(filePath)
    const fileExtension = path.extname(filename).toLowerCase()
    
    // Set appropriate content type
    let contentType = 'application/octet-stream'
    switch (fileExtension) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
    }
    
    // Set headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
    
  } catch (error) {
    console.error('Error serving file:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}