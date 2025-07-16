export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Default values from environment variables or fallback values
    const defaults = {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN || 'EAAE0ZAUxkwC0BPFoWjMx1zhteOZAtnPuwJjkZCjieZA8PUNHNZAstqecTKKk1YsNYREx0fVD88H4HiJDjTp4J9Ck6iA6PCZAnb71Ku2Qc43274WHkQ2Qlny39fHl2GTsH0VvYdRGa7xuzanRjaTKIzphjsPmVSzjf6aXNEKD8SNWucNb8iNnEcUZCR45USx2qZAhBZAfZBl3otFbVu2pYHlyvU6ZARS',
      accessToken2: process.env.FACEBOOK_ACCESS_TOKEN_2 || 'EAAChZCKmUTDcBPPXbtYYXGtY0ZBh8khmzbZCAEVOqRZCQZAdQgYFNJOaMqt0NLpm1myrxytZChZBSrPBeHrpbJhD8oSMUzwDb5ZB7NJ2X3R3tLZAI0jOwZBlFYU8b8U7cttG6oyWS5cZBlvGN8XChQcgnZBZAqhXhbFvZAgvTedPRrZARfinO2Ic2s9TL2tZABG2tPlNUxPxEhvkcLTx5ZCjILogIiPMQZBIUZD',
      cookieData: process.env.FACEBOOK_COOKIE_DATA || 'dbln=%7B%22100056864839947%22%3A%22fQL0ngDj%22%7D; datr=FY5vaJkvRxhuJNlz9lRPAsOW; sb=FY5vaD1eu37Fg5HEh6yKmyQV; wd=2560x1210; locale=th_TH; c_user=100056864839947; xs=15%3APWCSP7Z44IGmvg%3A2%3A1752141442%3A-1%3A-1; fr=06GRkBXJsb8iRi1ye.AWe86VQQFfT_m4RO_Helcqvd-gsXl4OIqZby3wTRnoOA2BgfxcM.Bob44V..AAA.0.0.Bob5MS.AWfB267gsIDD_HBckJjKDHSNPdk;',
      adAccountId: process.env.FACEBOOK_AD_ACCOUNT_ID || 'act_1148837732288721',
      pageId: process.env.FACEBOOK_PAGE_ID || '146000051932080',
      caption: process.env.DEFAULT_CAPTION || 'LAZADA.CO.TH',
      description: process.env.DEFAULT_DESCRIPTION || 'กดเพื่อดูเพิ่มเติม',
      linkUrl: process.env.DEFAULT_LINK_URL || 'https://s.lazada.co.th/s.yQ0ji?cc',
      linkName: process.env.DEFAULT_LINK_NAME || 'พิกัด : เสื้อยืดแขนสั้นผู้หญิงสีขาว'
    }
    
    res.status(200).json(defaults)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}