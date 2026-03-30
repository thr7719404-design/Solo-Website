# Test Media Upload

## Quick Test with cURL

### 1. Get Admin Token
```bash
$token = (Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@solo.com","password":"Admin@123"}').tokens.accessToken
```

### 2. Create Test Image (PowerShell)
```powershell
# Create a simple 100x100 test image
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(100, 100)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.Clear([System.Drawing.Color]::Blue)
$bmp.Save("test-image.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$graphics.Dispose()
$bmp.Dispose()
Write-Host "Test image created: test-image.jpg"
```

### 3. Upload File
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$fileContent = Get-Content -Path "test-image.jpg" -Raw -Encoding Byte
$boundary = [System.Guid]::NewGuid().ToString()

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test-image.jpg`"",
    "Content-Type: image/jpeg",
    "",
    [System.Text.Encoding]::Latin1.GetString($fileContent),
    "--$boundary",
    "Content-Disposition: form-data; name=`"folder`"",
    "",
    "products",
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

$response = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/media/upload" `
  -Headers $headers `
  -ContentType "multipart/form-data; boundary=$boundary" `
  -Body $body

Write-Host "Upload successful!"
Write-Host "URL: $($response.url)"
```

### 4. Verify Upload
```powershell
# Check if file exists
$url = $response.url
Invoke-WebRequest -Uri $url -OutFile "downloaded-image.jpg"
Write-Host "Downloaded file to verify: downloaded-image.jpg"
```

---

## Alternative: Use Postman

1. **Login** to get token:
   - POST http://localhost:3000/api/auth/login
   - Body: `{"email":"admin@solo.com","password":"Admin@123"}`
   - Copy `tokens.accessToken`

2. **Upload**:
   - POST http://localhost:3000/api/media/upload
   - Headers: `Authorization: Bearer {token}`
   - Body → form-data:
     - Key: `file` (Type: File) → Select image
     - Key: `folder` (Type: Text) → `products`
   - Send

3. **Verify**:
   - Copy `url` from response
   - Paste in browser or GET request
   - Should display uploaded image

---

## Expected Results

✅ **Upload Response:**
```json
{
  "url": "http://localhost:3000/uploads/products/abc123-uuid.jpg",
  "originalName": "test-image.jpg",
  "filename": "abc123-uuid.jpg",
  "size": 2048,
  "mimetype": "image/jpeg",
  "uploadedAt": "2025-12-28T10:00:00Z"
}
```

✅ **File Location:**
```
backend/uploads/products/abc123-uuid.jpg
```

✅ **Public Access:**
```
http://localhost:3000/uploads/products/abc123-uuid.jpg
```

---

## Troubleshooting

### 403 Forbidden
- Check user has ADMIN or SUPER_ADMIN role
- Verify token is valid

### 400 Invalid file type
- Only JPEG, PNG, WebP supported
- Check file extension and MIME type

### 500 Cannot write file
- Check `uploads/` directory exists
- Check permissions: `chmod 755 uploads`
