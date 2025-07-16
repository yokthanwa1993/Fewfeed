import { useState, useEffect } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [formData, setFormData] = useState({
    accessToken: '',
    accessToken2: '',
    cookieData: '',
    linkUrl: 'https://s.lazada.co.th/s.yQ0ji?cc',
    linkName: 'พิกัด : เสื้อยืดแขนสั้นผู้หญิงสีขาว',
    imageFile: null
  })
  const [output, setOutput] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)

  // Load default values from API
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const response = await fetch('/api/defaults')
        const defaults = await response.json()
        
        setFormData(prev => ({
          ...prev,
          accessToken: defaults.accessToken || '',
          accessToken2: defaults.accessToken2 || '',
          cookieData: defaults.cookieData || '',
          linkUrl: defaults.linkUrl || prev.linkUrl,
          linkName: defaults.linkName || prev.linkName
        }))
        
        console.log('✅ Default values loaded')
      } catch (error) {
        console.error('❌ Failed to load default values:', error)
      }
    }

    loadDefaults()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const updateProgress = (message) => {
    if (message.includes('Server received publish request')) {
      setCurrentStep('เริ่มต้นการประมวลผล')
      setProgress(5)
    } else if (message.includes('Form data extracted')) {
      setCurrentStep('ตรวจสอบข้อมูล')
      setProgress(10)
    } else if (message.includes('Image prepared successfully')) {
      setCurrentStep('เตรียมรูปภาพเรียบร้อย')
      setProgress(15)
    } else if (message.includes('STEP 1')) {
      setCurrentStep('สร้าง Ad Creative')
      setProgress(25)
    } else if (message.includes('Creative created successfully')) {
      setCurrentStep('สร้าง Creative สำเร็จ')
      setProgress(35)
    } else if (message.includes('STEP 2')) {
      setCurrentStep('เริ่มกระบวนการประมวลผล')
      setProgress(45)
    } else if (message.includes('STEP 3')) {
      setCurrentStep('ดึง Page Access Token')
      setProgress(55)
    } else if (message.includes('STEP 4')) {
      setCurrentStep('รอ Facebook สร้าง Post ID')
      setProgress(65)
    } else if (message.includes('Post ID generated successfully')) {
      setCurrentStep('ได้รับ Post ID แล้ว')
      setProgress(80)
    } else if (message.includes('STEP 5')) {
      setCurrentStep('เผยแพร่โพสต์')
      setProgress(90)
    } else if (message.includes('SUCCESS!') || message.includes('🎉')) {
      setCurrentStep('เผยแพร่สำเร็จ!')
      setProgress(100)
    } else if (message.includes('FAILED!') || message.includes('💥')) {
      setCurrentStep('เกิดข้อผิดพลาด')
      setProgress(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsPublishing(true)
    setOutput('⏳ เริ่มต้นการเผยแพร่...\n')
    setCurrentStep('เตรียมข้อมูล')
    setProgress(10)

    const formDataToSend = new FormData()
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key])
      }
    })

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        body: formDataToSend
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      setOutput('')

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        setOutput(prev => prev + chunk)
        updateProgress(chunk)
      }

    } catch (error) {
      setOutput(prev => prev + `\n❌ Error: ${error.message}`)
      setCurrentStep('เกิดข้อผิดพลาด')
    } finally {
      setIsPublishing(false)
      if (progress === 100) {
        setTimeout(() => {
          setCurrentStep('')
          setProgress(0)
        }, 3000)
      }
    }
  }

  return (
    <div className={styles.container}>
      <h1>Facebook Auto-Publisher</h1>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="accessToken">Access Token</label>
          <textarea
            id="accessToken"
            name="accessToken"
            value={formData.accessToken}
            onChange={handleInputChange}
            required
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="accessToken2">Access Token 2</label>
          <textarea
            id="accessToken2"
            name="accessToken2"
            value={formData.accessToken2}
            onChange={handleInputChange}
            required
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cookieData">Cookie Data</label>
          <textarea
            id="cookieData"
            name="cookieData"
            value={formData.cookieData}
            onChange={handleInputChange}
            required
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="imageFile">Upload Image</label>
          <input
            type="file"
            id="imageFile"
            name="imageFile"
            onChange={handleInputChange}
            accept="image/png, image/jpeg, image/gif"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="linkUrl">Link URL</label>
          <input
            type="url"
            id="linkUrl"
            name="linkUrl"
            value={formData.linkUrl}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="linkName">Link Name (Headline)</label>
          <input
            type="text"
            id="linkName"
            name="linkName"
            value={formData.linkName}
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" disabled={isPublishing}>
          {isPublishing ? 'กำลังเผยแพร่...' : 'เผยแพร่ไปยัง Facebook'}
        </button>

        {isPublishing && (
          <div className={styles.progressContainer}>
            <div className={styles.progressInfo}>
              <span className={styles.currentStep}>{currentStep}</span>
              <span className={styles.progressPercent}>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </form>

      {output && (
        <div className={styles.output}>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}