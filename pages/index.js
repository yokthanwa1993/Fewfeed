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
    // Split messages into lines for better detection
    const lines = allMessages.split('\n')
    const lastFewLines = lines.slice(-10).join(' ').trim()
    
    // Debug: Show what we're checking
    console.log('🔍 Checking lines:', lastFewLines)
    
    // Check each step pattern - ตรงกับข้อความจาก backend
    const stepPatterns = [
      { pattern: 'Server received publish request', step: 'เริ่มต้นการประมวลผล', progress: 5 },
      { pattern: 'Form data extracted successfully', step: 'ตรวจสอบข้อมูล', progress: 10 },
      { pattern: 'Image prepared successfully', step: 'เตรียมรูปภาพเรียบร้อย', progress: 15 },
      { pattern: 'Facebook Publisher initialized successfully', step: 'เตรียมระบบ Facebook', progress: 20 },
      { pattern: 'Starting Facebook publishing process', step: 'เริ่มกระบวนการ Facebook', progress: 25 },
      { pattern: 'STEP 1: Creating Ad Creative', step: '📝 STEP 1: สร้าง Ad Creative', progress: 30 },
      { pattern: 'Creative created successfully', step: '✅ STEP 1: สร้าง Creative สำเร็จ', progress: 40 },
      { pattern: 'STEP 2: Triggering post processing', step: '⚙️ STEP 2: เริ่มกระบวนการประมวลผล', progress: 50 },
      { pattern: 'Processing triggered successfully', step: '✅ STEP 2: ประมวลผลสำเร็จ', progress: 55 },
      { pattern: 'STEP 3: Fetching Page Access Token', step: '🔑 STEP 3: ดึง Page Access Token', progress: 60 },
      { pattern: 'Page access token retrieved successfully', step: '✅ STEP 3: ได้ Access Token แล้ว', progress: 65 },
      { pattern: 'STEP 4: Waiting for Facebook to generate Post ID', step: '⏳ STEP 4: รอ Facebook สร้าง Post ID', progress: 70 },
      { pattern: 'Post ID generated successfully', step: '✅ STEP 4: ได้รับ Post ID แล้ว', progress: 80 },
      { pattern: 'STEP 5: Publishing the post', step: '🚀 STEP 5: เผยแพร่โพสต์', progress: 90 },
      { pattern: 'Post published successfully', step: '✅ STEP 5: เผยแพร่สำเร็จ!', progress: 95 },
      { pattern: 'SUCCESS! Post published successfully', step: '🎉 เสร็จสิ้น!', progress: 100 },
      { pattern: 'PUBLISHING FAILED', step: '❌ เกิดข้อผิดพลาด', progress: 0 }
    ]
    
    // Find the latest matching pattern
    for (let i = stepPatterns.length - 1; i >= 0; i--) {
      const { pattern, step, progress } = stepPatterns[i]
      if (lastFewLines.includes(pattern)) {
        console.log(`✅ Found pattern: "${pattern}" -> ${step} (${progress}%)`)
        setCurrentStep(step)
        setProgress(progress)
        break
      }
    }
    
    // Special handling for attempt counting
    const attemptMatch = lastFewLines.match(/Attempt (\d+)\/10/)
    if (attemptMatch && lastFewLines.includes('Checking for Post ID')) {
      const attempt = parseInt(attemptMatch[1])
      const progressValue = 70 + (attempt * 1)
      setCurrentStep(`⏳ STEP 4: ตรวจสอบ Post ID (ครั้งที่ ${attempt}/10)`)
      setProgress(Math.min(progressValue, 79))
      console.log(`🔄 Attempt ${attempt}/10 detected, progress: ${progressValue}%`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsPublishing(true)
    setOutput('⏳ เริ่มต้นการเผยแพร่...\n')
    setCurrentStep('เริ่มต้นการส่งข้อมูล...')
    setProgress(1)
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

        {/* Progress Display */}
        {(progress > 0 || isPublishing) && (
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
            
            {/* Step-by-step display */}
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333', fontSize: '16px' }}>ขั้นตอนการทำงาน:</div>
              <div className={styles.stepList}>
                <div className={`${styles.stepItem} ${
                  progress >= 40 ? styles.completed : 
                  (progress >= 25 && progress < 40) ? styles.active : styles.pending
                }`}>
                  {progress >= 40 ? '✅' : progress >= 25 ? '🔄' : '⏳'} STEP 1: สร้าง Ad Creative
                </div>
                <div className={`${styles.stepItem} ${
                  progress >= 55 ? styles.completed : 
                  (progress >= 50 && progress < 55) ? styles.active : styles.pending
                }`}>
                  {progress >= 55 ? '✅' : progress >= 50 ? '🔄' : '⏳'} STEP 2: เริ่มกระบวนการประมวลผล
                </div>
                <div className={`${styles.stepItem} ${
                  progress >= 65 ? styles.completed : 
                  (progress >= 60 && progress < 65) ? styles.active : styles.pending
                }`}>
                  {progress >= 65 ? '✅' : progress >= 60 ? '🔄' : '⏳'} STEP 3: ดึง Page Access Token
                </div>
                <div className={`${styles.stepItem} ${
                  progress >= 80 ? styles.completed : 
                  (progress >= 70 && progress < 80) ? styles.active : styles.pending
                }`}>
                  {progress >= 80 ? '✅' : progress >= 70 ? '🔄' : '⏳'} STEP 4: รอ Facebook สร้าง Post ID
                </div>
                <div className={`${styles.stepItem} ${
                  progress >= 95 ? styles.completed : 
                  (progress >= 90 && progress < 95) ? styles.active : styles.pending
                }`}>
                  {progress >= 95 ? '✅' : progress >= 90 ? '🔄' : '⏳'} STEP 5: เผยแพร่โพสต์
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>
                สถานะปัจจุบัน:
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d' }}>
                {currentStep || 'รอการเริ่มต้น...'}
              </div>
              <div style={{ fontSize: '12px', color: '#868e96', marginTop: '5px' }}>
                ความคืบหน้า: {progress}% | {progress > 0 ? '🔄 กำลังดำเนินการ' : '⏳ รอการเริ่มต้น'}
              </div>
            </div>
            
            {/* Debug Display - แสดงข้อความล่าสุดจาก Backend */}
            {allMessages && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#856404', marginBottom: '5px' }}>
                  🔍 Debug - ข้อความล่าสุดจาก Backend:
                </div>
                <div style={{ fontSize: '11px', color: '#856404', fontFamily: 'monospace', maxHeight: '100px', overflow: 'auto' }}>
                  {allMessages.split('\n').slice(-5).join('\n')}
                </div>
              </div>
            )}
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