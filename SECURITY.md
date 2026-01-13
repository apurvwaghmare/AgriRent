# Security Guidelines

## Important Security Notice

This project contains sensitive information that **MUST NOT** be pushed to GitHub or any public repository.

## Protected Files

The following files are automatically excluded via `.gitignore` and should **NEVER** be committed:

### Environment Variables
- `backend/.env` - Contains database passwords, JWT secrets, API keys
- `frontend/.env` - Contains API keys for external services
- Any `.env.*` files with actual credentials

### User-Generated Content
- `backend/uploads/` - Contains customer ID proofs and equipment images
- All subdirectories under `uploads/`

### Database Information
- `*.sql.backup` - Database dumps may contain user data
- `*.dump`, `*.bak` - Backup files

## What's Included Instead

✅ **Safe to commit:**
- `backend/.env.example` - Template with placeholder values
- `frontend/.env.example` - Template with placeholder values
- All source code files
- Documentation files
- Configuration templates

## Current Sensitive Data in Your Project

### Backend Environment (`.env`)
- **Database Password**: `DB_PASSWORD=apurv`
- **JWT Secret**: `JWT_SECRET=agriculture_rental_system_secret_key_2024`
- **Email Credentials**: If configured

### Test Files
Several test files contain hardcoded credentials for testing purposes:
- `backend/enhance-admin-data.js`
- `backend/add-sample-feedback.js`
- `backend/add-booking-columns.js`
- `backend/test-*.js` files

**Note**: These test credentials are acceptable for development but should use environment variables in production.

## Setup Instructions for New Developers

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agriculture-equipment-rental-system
   ```

2. **Setup Backend Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your actual credentials
   npm install
   ```

3. **Setup Frontend Environment**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env and add your actual API keys (if needed)
   npm install
   ```

4. **Configure Database**
   - Update `DB_PASSWORD` in `backend/.env` with your MySQL password
   - Run database setup: `node backend/setup-database.js`

## Before Pushing to GitHub

### Checklist
- [ ] Verified `.env` files are in `.gitignore`
- [ ] No `.env` files are staged for commit
- [ ] No hardcoded passwords in committed code (test files are OK)
- [ ] `uploads/` directory is excluded
- [ ] Created `.env.example` files for documentation

### Verify What Will Be Pushed
```bash
# Check which files are staged
git status

# Check if .env files are tracked
git ls-files | grep .env

# If .env is listed, remove it:
git rm --cached backend/.env
git rm --cached frontend/.env
```

## Security Best Practices

1. **Never commit**:
   - Actual passwords
   - API keys
   - JWT secrets
   - Database credentials
   - User-uploaded files

2. **Always use**:
   - Environment variables
   - `.env` files (excluded from git)
   - Strong, unique secrets for production
   - Different credentials for dev/staging/production

3. **Rotate secrets**:
   - Change JWT secret before production deployment
   - Use strong, randomly generated secrets
   - Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Database security**:
   - Use strong database passwords
   - Restrict database access to localhost in production
   - Never expose database port publicly

## What If Secrets Were Accidentally Pushed?

If you accidentally pushed sensitive data to GitHub:

1. **Immediately rotate all compromised credentials**:
   - Change database password
   - Generate new JWT secret
   - Revoke and regenerate all API keys

2. **Remove from Git history** (if caught early):
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch backend/.env" \
   --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

3. **Use BFG Repo-Cleaner** for better results:
   - Download from: https://rtyley.github.io/bfg-repo-cleaner/
   - Follow instructions to remove sensitive files

4. **Consider the repository compromised**:
   - If it's a public repo, assume all secrets are exposed
   - Create a new repository if necessary

## Production Deployment

When deploying to production:

1. Use environment variables provided by your hosting platform
2. Never store production credentials in files
3. Use services like:
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Cloud Secret Manager
   - Environment variables in hosting platforms (Heroku, Vercel, etc.)

## Contact

If you discover any security issues or accidentally committed sensitive data, contact the project maintainer immediately.
