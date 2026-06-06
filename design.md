# System Design Document
**Project Name:** ComShopX - All-in-One Computer Store Management System  
**Version:** 1.0.0  
**Date:** 6 June 2026

## 1. System Architecture
ComShopX ใช้สถาปัตยกรรมแบบ full-stack web application ด้วย Next.js App Router โดยแยก domain สำคัญเป็น module ได้แก่ Document, Inventory, Serial Number, Customer และ POS

```text
Browser / Tablet
  -> Next.js App Router
    -> Server Actions / Route Handlers
      -> Prisma ORM
        -> MySQL
      -> Redis Session / Cache
      -> PDF Generator
```

## 2. Technology Stack
- **Frontend & Backend:** Next.js App Router + TypeScript
- **Database:** MySQL
- **ORM:** Prisma
- **Caching & Session:** Redis
- **Infrastructure:** Docker Compose สำหรับ Next.js, MySQL และ Redis
- **PDF Generation:** Server-side PDF generation ด้วย Puppeteer, pdfmake หรือ react-pdf
- **Styling:** CSS Modules / global CSS ใน phase แรก เพื่อให้ deploy ง่ายและไม่มี dependency UI หนัก

## 3. Domain Model

### 3.1 Product
- เก็บข้อมูลสินค้า เช่น CPU, GPU, RAM, Mainboard, PSU, Monitor
- มี field `requireSerial` เพื่อบังคับเลือก Serial Number ตอนขายหรือส่งมอบ
- `stockQuantity` เป็นยอดรวมเพื่อ query เร็ว แต่ source of truth สำหรับสินค้าที่ต้องมี Serial Number คือ table `SerialNumber`

### 3.2 SerialNumber
- Serial Number ต้อง unique ทั้งระบบ
- สถานะหลัก:
  - `IN_STOCK`: อยู่ในคลัง
  - `RESERVED`: ถูกจองไว้ในเอกสารที่ยังไม่ปิดการขาย
  - `SOLD`: ขายแล้ว
  - `CLAIMED`: อยู่ระหว่างเคลม
  - `RETURNED`: รับคืน
  - `LOST`: สูญหายหรือตัดจำหน่าย

### 3.3 Document
- ใช้ table กลางสำหรับเอกสารธุรกิจทุกประเภท โดยแยกด้วย `type`
- ประเภทเอกสาร:
  - `QUOTATION`
  - `DELIVERY_NOTE`
  - `RECEIPT`
  - `TAX_INVOICE`
- `referenceDocumentId` ใช้เชื่อม workflow การแปลงเอกสาร

### 3.4 DocumentItem
- รายการสินค้าในเอกสาร
- ถ้าเป็นสินค้าที่ต้องมี Serial Number จะต้องผูก `serialNumberId` ในขั้นตอนส่งของหรือขายจริง
- รองรับ quantity มากกว่า 1 สำหรับสินค้าทั่วไป และควรแยกบรรทัดตาม Serial Number สำหรับสินค้าที่ติดตามรายชิ้น

## 4. Database Schema
Prisma schema อยู่ที่ `prisma/schema.prisma`

ความสัมพันธ์หลัก:
- `Customer` 1:N `Document`
- `Document` 1:N `DocumentItem`
- `Product` 1:N `DocumentItem`
- `Product` 1:N `SerialNumber`
- `SerialNumber` 0:1 `DocumentItem` สำหรับรายการขายจริง

## 5. Critical Workflows

### 5.1 Quotation to Receipt
1. Sale สร้างใบเสนอราคาและเลือกสินค้า
2. ระบบบันทึกเอกสารสถานะ `ISSUED` แต่ยังไม่ตัด Serial Number
3. เมื่อลูกค้าตกลงซื้อ Sale กดสร้างใบส่งของหรือใบเสร็จจากใบเสนอราคา
4. ระบบคัดลอกรายการสินค้าเดิม
5. Sale สแกนหรือเลือก Serial Number สำหรับสินค้าที่ต้องติดตาม
6. ระบบตรวจสอบว่า Serial Number ยังเป็น `IN_STOCK`
7. เมื่อรับชำระเงิน ระบบสร้างใบเสร็จและเปลี่ยน Serial Number เป็น `SOLD`

### 5.2 Goods Receiving
1. Inventory Staff สร้างรายการรับสินค้าเข้า
2. เลือกสินค้าและใส่จำนวน
3. ถ้า product requireSerial = true ต้องใส่ Serial Number ครบตามจำนวน
4. ระบบเพิ่ม stock และสร้าง Serial Number สถานะ `IN_STOCK`

### 5.3 Void / Cancel Document
1. ผู้ใช้ที่มีสิทธิ์เลือกยกเลิกเอกสาร
2. ระบบตรวจสอบว่าเอกสารถูกใช้ต่อแล้วหรือยัง
3. ถ้ายังไม่ถูกใช้ต่อ สามารถเปลี่ยน status เป็น `CANCELLED`
4. ถ้าเป็นเอกสารที่ตัดสต๊อกแล้ว ต้องสร้าง reversal movement และคืนสถานะ Serial Number ตาม policy

## 6. Document Numbering
รูปแบบเลขที่เอกสาร:
- Quotation: `QUO-YYYYMM-0001`
- Delivery Note: `DN-YYYYMM-0001`
- Receipt: `REC-YYYYMM-0001`
- Tax Invoice: `TAX-YYYYMM-0001`

ควรใช้ transaction และ table counter แยกตาม document type + year-month เพื่อป้องกันเลขซ้ำในการใช้งานพร้อมกันหลายเครื่อง

## 7. Authorization Matrix
| Feature | Admin/Owner | Cashier/Sale | Inventory Staff | Accounting |
| --- | --- | --- | --- | --- |
| Dashboard | Full | Sales only | Stock only | Finance only |
| Product Master | Full | Read | Read | Read |
| Receive Stock | Full | No | Full | Read |
| Create Quotation | Full | Full | No | Read |
| Create Receipt | Full | Full | No | Full |
| Cancel Issued Document | Full | Limited | No | Limited |
| Reports | Full | Limited | Stock | Finance |

## 8. Deployment Strategy
- ใช้ `docker-compose.yml` สำหรับ service หลัก:
  - `app`: Next.js
  - `mysql`: MySQL 8
  - `redis`: Redis 7
- ตั้งค่า reverse proxy เช่น Nginx หรือ Traefik บน VPS
- ใช้ environment variables จาก `.env`
- production ต้องรัน migration ก่อน start app

## 9. Future Enhancements
- Online product catalog
- Warranty claim module
- Purchase order และ supplier management
- Multi-branch inventory
- LINE/Email ส่งใบเสนอราคาและใบเสร็จให้ลูกค้า
