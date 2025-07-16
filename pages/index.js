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
  const [allMessages, setAllMessages] = useState('')

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

  const updateProgress = (allMessages) => {
    // Clean message for better matching
    const cleanMessage = allMessages.replace(/\n/g, ' ').trim()
    
    // Debug log
    console.log('Progress check:', cleanMessage.substring(cleanMessage.length - 100))
    
    if (cleanMessage.includes('🔄 Server received publish request')) {
      setCurrentStep('เริ่มต้นการประมวลผล')
      setProgress(8)
    } else if (cleanMessage.includes('✅ Form data extracted successfully')) {
      setCurrentStep('ตรวจสอบข้อมูล')
      setProgress(12)
    } else if (cleanMessage.includes('✅ Image prepared successfully')) {
      setCurrentStep('เตรียมรูปภาพเรียบร้อย')
      setProgress(18)
    } else if (cleanMessage.includes('✅ Facebook Publisher initialized successfully')) {
      setCurrentStep('เตรียมระบบ Facebook')
      setProgress(22)
    } else if (cleanMessage.includes('🔄 STEP 1: Creating Ad Creative')) {
      setCurrentStep('สร้าง Ad Creative')
      setProgress(28)
    } else if (cleanMessage.includes('✅ Creative created successfully')) {
      setCurrentStep('สร้าง Creative สำเร็จ')
      setProgress(38)
    } else if (cleanMessage.includes('🔄 STEP 2: Triggering post processing')) {
      setCurrentStep('เริ่มกระบวนการประมวลผล')
      setProgress(48)
    } else if (cleanMessage.includes('✅ Processing triggered successfully')) {
      setCurrentStep('ประมวลผลสำเร็จ')
      setProgress(52)
    } else if (cleanMessage.includes('🔄 STEP 3: Fetching Page Access Token')) {
      setCurrentStep('ดึง Page Access Token')
      setProgress(58)
    } else if (cleanMessage.includes('🔄 STEP 4: Waiting for Facebook to generate Post ID')) {
      setCurrentStep('รอ Facebook สร้าง Post ID')
      setProgress(68)
    } else if (cleanMessage.includes('🔍 Attempt') && cleanMessage.includes('Checking for Post ID')) {
      const attemptMatch = cleanMessage.match(/🔍 Attempt (\d+)\/10/)
      if (attemptMatch) {
        const attempt = parseInt(attemptMatch[1])
        const progressValue = 68 + (attempt * 1.2) // Increment by 1.2% per attempt
        setCurrentStep(`กำลังตรวจสอบ Post ID (ครั้งที่ ${attempt}/10)`)
        setProgress(Math.min(progressValue, 78))
      }
    } else if (cleanMessage.includes('✅ Post ID generated successfully')) {
      setCurrentStep('ได้รับ Post ID แล้ว')
      setProgress(82)
    } else if (cleanMessage.includes('🔄 STEP 5: Publishing the post')) {
      setCurrentStep('เผยแพร่โพสต์')
      setProgress(92)
    } else if (cleanMessage.includes('✅ Post published successfully')) {
      setCurrentStep('เผยแพร่สำเร็จ!')
      setProgress(96)
    } else if (cleanMessage.includes('🎉 SUCCESS! Post published successfully')) {
      setCurrentStep('เสร็จสิ้น!')
      setProgress(100)
    } else if (cleanMessage.includes('💥 PUBLISHING FAILED')) {
      setCurrentStep('เกิดข้อผิดพลาด')
      setProgress(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsPublishing(true)
    setOutput('⏳ เริ่มต้นการเผยแพร่...\n')
    setCurrentStep('เตรียมข้อมูล')
    setProgress(5)
    setAllMessages('')

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
        setAllMessages(prev => {
          const newMessages = prev + chunk
          updateProgress(newMessages)
          return newMessages
        })
      }

    } catch (error) {
      setOutput(prev => prev + `\n❌ Error: ${error.message}`)
      setCurrentStep('เกิดข้อผิดพลาด')
    } finally {
      setIsPublishing(false)
      setTimeout(() => {
        if (progress === 100) {
          setCurrentStep('')
          setProgress(0)
          setAllMessages('')
        }
      }, 3000)
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
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              📊 Progress tracking: {progress > 5 ? '✅ Active' : '⏳ Waiting...'}
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