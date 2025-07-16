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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsPublishing(true)
    setOutput('⏳ Publishing, please wait...\n')

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
      }

    } catch (error) {
      setOutput(prev => prev + `\n❌ Error: ${error.message}`)
    } finally {
      setIsPublishing(false)
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
          {isPublishing ? 'Publishing...' : 'Publish to Facebook'}
        </button>
      </form>

      {output && (
        <div className={styles.output}>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}