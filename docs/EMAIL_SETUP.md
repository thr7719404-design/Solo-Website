# Email Setup Guide

This guide explains how to set up email functionality for Solo Ecommerce in development and production.

## Quick Start (Development)

### Option 1: Mailpit (Recommended)

Mailpit is a lightweight email testing tool that runs locally without Docker.

#### Windows Setup

1. **Download Mailpit**
   - Go to: https://github.com/axllent/mailpit/releases
   - Download `mailpit-windows-amd64.zip` (or the arm64 version if you have an ARM processor)
   - Extract `mailpit.exe` to a convenient location (e.g., `C:\Tools\mailpit\`)

2. **Run Mailpit**
   ```powershell
   # Navigate to where you extracted mailpit
   cd C:\Tools\mailpit
   
   # Run it
   .\mailpit.exe
   ```
   
   Or add it to your PATH and run from anywhere:
   ```powershell
   mailpit
   ```

3. **Access the Web UI**
   - Open: http://localhost:8025
   - All emails sent by the application will appear here

4. **Configure Backend**
   
   In `backend/.env`:
   ```env
   EMAIL_MODE=mailpit
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_FROM="Solo <no-reply@solo.local>"
   ```

5. **Test It**
   - Register a new account in the app
   - Check http://localhost:8025 for the welcome/verification email

#### Mac/Linux Setup

```bash
# macOS with Homebrew
brew install mailpit

# Linux (download from releases)
wget https://github.com/axllent/mailpit/releases/latest/download/mailpit-linux-amd64.tar.gz
tar -xzf mailpit-linux-amd64.tar.gz
./mailpit
```

### Option 2: Console Mode

If you don't want to run Mailpit, you can log emails to the console instead.

In `backend/.env`:
```env
EMAIL_MODE=console
```

Emails will be printed to the backend terminal output:
```
═══════════════════════════════════════════════════════════════
📧 EMAIL (Console Mode)
═══════════════════════════════════════════════════════════════
From: Solo <no-reply@solo.local>
To: user@example.com
Subject: Welcome to Solo! Please verify your email ✉️
───────────────────────────────────────────────────────────────
[Email content here]
═══════════════════════════════════════════════════════════════
```

### Option 3: Docker (MailHog or Mailpit)

If you have Docker installed:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mailpit:
    image: axllent/mailpit
    container_name: solo-mailpit
    ports:
      - "1025:1025"   # SMTP server
      - "8025:8025"   # Web UI
    restart: unless-stopped
```

```powershell
docker compose up -d mailpit
```

---

## EMAIL_MODE Options

| Mode | Description | Use Case |
|------|-------------|----------|
| `mailpit` | Connects to localhost:1025, falls back to console if unavailable | Development with Mailpit |
| `console` | Logs emails to terminal only | Quick testing, CI/CD |
| `smtp` | Uses configured SMTP credentials | Production |

---

## Production Setup

For production, use a real SMTP service like SendGrid, AWS SES, or Postmark.

### Example: SendGrid

```env
APP_ENV=production
EMAIL_MODE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_SECURE=false
SMTP_FROM="Solo <noreply@yourdomain.com>"
```

### Example: AWS SES

```env
APP_ENV=production
EMAIL_MODE=smtp
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_SECURE=false
SMTP_FROM="Solo <noreply@yourdomain.com>"
```

### Example: Gmail (Not recommended for production)

```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Not your regular password!
SMTP_SECURE=false
SMTP_FROM="Solo <your-email@gmail.com>"
```

> ⚠️ For Gmail, you need to:
> 1. Enable 2-Factor Authentication
> 2. Create an "App Password" at https://myaccount.google.com/apppasswords
> 3. Use the App Password, not your regular password

---

## Email Features

### Currently Implemented

1. **Welcome + Verification Email** (on registration)
   - Sent automatically when a user registers
   - Contains a "Verify My Email" button
   - Token expires in 1 hour

2. **Password Reset Email**
   - Sent when user requests password reset
   - Contains a "Reset Password" button
   - Token expires in 1 hour

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Sends welcome/verification email |
| `/auth/verify-email` | POST | Verifies email with token |
| `/auth/resend-verification` | POST | Resends verification email |
| `/auth/forgot-password` | POST | Sends password reset email |
| `/auth/reset-password` | POST | Resets password with token |

---

## Troubleshooting

### "Mailpit not available" warning

This appears when Mailpit isn't running. Either:
1. Start Mailpit: `mailpit.exe`
2. Switch to console mode: `EMAIL_MODE=console`

### Emails not appearing in Mailpit

1. Check Mailpit is running on port 1025
2. Check backend logs for email send errors
3. Verify SMTP_HOST and SMTP_PORT in .env

### Console mode not showing emails

Check the backend terminal output - emails are logged with the `[EmailService]` prefix.

---

## Development Tips

### View verification tokens in response

In development (`APP_ENV=development`), API responses include tokens for testing:

```json
{
  "message": "Registration successful!",
  "verificationToken": "abc123...",  // Only in development
  "user": { ... }
}
```

### Quick verification without email

1. Register a user
2. Copy the `verificationToken` from the API response
3. Navigate to: `http://localhost:5000/verify-email?token=YOUR_TOKEN`

---

## Security Notes

- Tokens are never stored in plain text (SHA256 hashed)
- Tokens expire after 1 hour
- Tokens can only be used once
- Token values are only returned in API responses when `APP_ENV=development`
- Always use HTTPS in production
