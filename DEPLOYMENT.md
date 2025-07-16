# CapRover Deployment Guide

คู่มือการ deploy โปรเจค Fewfeed บน CapRover

## ข้อกำหนดเบื้องต้น

- CapRover server ที่ติดตั้งและตั้งค่าแล้ว
- Domain name ที่ชี้ไปยัง CapRover server
- Git repository ที่มีโค้ดโปรเจค

## ขั้นตอนการ Deploy

### 1. สร้าง App ใน CapRover

1. เข้าสู่ CapRover dashboard
2. ไปที่ "Apps" และคลิก "Create New App"
3. ตั้งชื่อ app เป็น `fewfeed` (หรือชื่อที่ต้องการ)
4. คลิก "Create New App"

### 2. ตั้งค่า Environment Variables

ไปที่ App Settings > Environment Variables และเพิ่มตัวแปรต่อไปนี้:

```
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token_here
FACEBOOK_ACCESS_TOKEN_2=your_secondary_facebook_access_token_here
FACEBOOK_COOKIE_DATA=your_facebook_cookie_data_here
FACEBOOK_AD_ACCOUNT_ID=act_your_ad_account_id_here
FACEBOOK_PAGE_ID=your_page_id_here
NODE_ENV=production
PORT=3000
DEFAULT_CAPTION=LAZADA.CO.TH
DEFAULT_DESCRIPTION=กดเพื่อดูเพิ่มเติม
DEFAULT_LINK_URL=https://s.lazada.co.th/s.yQ0ji?cc
DEFAULT_LINK_NAME=พิกัด : เสื้อยืดแขนสั้นผู้หญิงสีขาว
```

### 3. Deploy จาก Git Repository

#### วิธีที่ 1: Deploy จาก GitHub/GitLab

1. ไปที่ App Settings > Deployment
2. เลือก "Deploy from Github/Bitbucket/Gitlab"
3. เชื่อมต่อ repository ของคุณ
4. เลือก branch ที่ต้องการ deploy (เช่น `main` หรือ `master`)
5. คลิก "Save & Update"

#### วิธีที่ 2: Deploy ด้วย CLI

1. ติดตั้ง CapRover CLI:
   ```bash
   npm install -g caprover
   ```

2. Login เข้า CapRover:
   ```bash
   caprover login
   ```

3. Deploy โปรเจค:
   ```bash
   caprover deploy
   ```

### 4. ตั้งค่า Domain (ถ้าต้องการ)

1. ไปที่ App Settings > HTTP Settings
2. เพิ่ม custom domain ถ้าต้องการ
3. เปิดใช้งาน HTTPS

### 5. ตรวจสอบการทำงาน

1. ไปที่ App Logs เพื่อดู logs การ deploy
2. เข้าไปที่ URL ของ app เพื่อทดสอบ
3. ทดสอบการอัปโหลดรูปภาพและการเผยแพร่

## โครงสร้างไฟล์สำคัญ

- `captain-definition` - กำหนดการใช้ Dockerfile
- `Dockerfile` - สำหรับ build Docker image
- `.dockerignore` - ไฟล์ที่ไม่ต้องการใน Docker image
- `.env.example` - ตัวอย่าง environment variables

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Build ล้มเหลว**: ตรวจสอบ logs ใน CapRover dashboard
2. **App ไม่ start**: ตรวจสอบ environment variables และ port settings
3. **File upload ไม่ทำงาน**: ตรวจสอบว่าโฟลเดอร์ `public/uploads` ถูกสร้างแล้ว

### การดู Logs

```bash
# ดู logs ผ่าน CLI
caprover logs --appName fewfeed

# หรือดูใน CapRover dashboard > App Logs
```

## การอัปเดต

เมื่อมีการเปลี่ยนแปลงโค้ด:

1. Push โค้ดใหม่ไปยัง Git repository
2. CapRover จะ auto-deploy ถ้าตั้งค่า webhook ไว้
3. หรือ deploy manual ผ่าน CLI: `caprover deploy`

## Security Notes

- ไม่ควร commit ไฟล์ `.env` ที่มี sensitive data
- ใช้ environment variables ใน CapRover สำหรับข้อมูลสำคัญ
- เปิดใช้งาน HTTPS สำหรับ production
- ตรวจสอบ Facebook API tokens เป็นประจำ