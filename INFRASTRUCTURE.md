# Infrastructure Dependencies & Requirements

## Project: Yuletide Backend API

This document tracks all infrastructure, runtime, and build dependencies required for successful deployment.

---

## Runtime Dependencies

### Node.js Application
- **Runtime**: Node.js >= 16.0.0 (Using: 22.11.0)
- **Package Manager**: npm >= 8.0.0
- **Port**: Configurable via `PORT` env var (default: 3000)
- **Network Binding**: Must bind to `0.0.0.0` for cloud deployments

### Database
- **Type**: SQLite3
- **Library**: better-sqlite3 v9.2.2
- **Storage**: File-based (`yuletide.db`)
- **Persistence**: Requires writable filesystem
- **Note**: Auto-creates database on first run

---

## Build Dependencies

### Native Module Compilation (better-sqlite3)

**Critical**: better-sqlite3 requires native compilation. All of these must be present at build time:

#### System Dependencies
1. **Python**: v3.x (for node-gyp)
   - Used by: node-gyp build process
   - Version: 3.12.8+ recommended

2. **C/C++ Compiler**: GCC or Clang
   - Used by: Compiling SQLite3 native bindings
   - Package: `gcc` or `clang`

3. **Build Tools**: make, g++
   - Used by: Native module compilation
   - Packages: `gnumake`, `g++`

4. **Node Headers**: Automatically downloaded by node-gyp
   - Used by: Native addon compilation
   - Auto-fetched during npm install

#### Build Process Flow
```
npm install
  └─> better-sqlite3 install
       └─> prebuild-install (checks for prebuilt binaries)
            └─> [FAILS] No prebuilt for Node 22.11.0
                 └─> node-gyp rebuild
                      ├─> Requires: Python3
                      ├─> Requires: GCC/Clang
                      ├─> Requires: Make
                      └─> Compiles SQLite3 C code
```

---

## Platform-Specific Requirements

### Railway.app (Nixpacks)
**Configuration File**: `nixpacks.toml`

```toml
[phases.setup]
nixPkgs = ['nodejs_22', 'python3', 'gcc', 'gnumake']

[phases.install]
cmds = ['npm ci']

[start]
cmd = 'npm start'
```

**Required Nix Packages**:
- `nodejs_22` - Node.js runtime
- `python3` - For node-gyp
- `gcc` - C compiler
- `gnumake` - Build automation

### Docker/Containerized Deployments
**Base Image Requirements**:
```dockerfile
# Required packages
RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*
```

### AWS (EC2, Elastic Beanstalk)
**Prerequisites**:
```bash
# Amazon Linux 2
sudo yum groupinstall "Development Tools"
sudo yum install python3

# Ubuntu/Debian
sudo apt-get install build-essential python3
```

### Heroku
**Buildpacks Required**:
- `heroku/nodejs`
- Python buildpack (auto-detected via node-gyp)

### Render.com
**Build Command**:
```bash
npm install
```
**Auto-detects**: Native dependencies, installs build tools automatically

### Vercel/Netlify (Serverless)
**⚠️ NOT COMPATIBLE**:
- SQLite requires filesystem writes
- Serverless functions don't support persistent file storage
- Alternative: Use Vercel Postgres or external DB

---

## Deployment Checklist

### Pre-Deployment Validation

Run this before deploying to ANY platform:

```bash
# 1. Check Node version
node --version  # Should be >= 16.0.0

# 2. Check npm version
npm --version   # Should be >= 8.0.0

# 3. Verify Python available
python3 --version || python --version

# 4. Verify C++ compiler
gcc --version || clang --version

# 5. Verify make
make --version

# 6. Test local install
npm ci
npm start

# 7. Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/gifts
```

### Platform-Specific Validation

#### Railway
```bash
# Verify nixpacks.toml exists
cat nixpacks.toml

# Check for required packages
grep -E "(python3|gcc|gnumake)" nixpacks.toml
```

#### Docker
```bash
# Test build locally
docker build -t yuletide-backend .
docker run -p 3000:3000 yuletide-backend

# Verify inside container
docker exec -it <container> python3 --version
docker exec -it <container> gcc --version
```

---

## Common Issues & Solutions

### Issue 1: `gyp ERR! find Python`
**Symptom**:
```
gyp ERR! find Python Python is not set from command line or npm configuration
```

**Solution**:
- **Railway**: Add `python3` to `nixpacks.toml` nixPkgs array
- **Docker**: Install `python3` in Dockerfile
- **Local**: Install Python 3.x

### Issue 2: `make: cc: No such file or directory`
**Symptom**:
```
make: cc: No such file or directory
```

**Solution**:
- **Railway**: Add `gcc` and `gnumake` to nixpacks.toml
- **Docker**: Install `build-essential` (Debian) or `gcc make` (Alpine)
- **Local**: Install gcc/build tools

### Issue 3: `Application not found` on deployed URL
**Symptom**: Deployment succeeds but URL returns 404

**Solution**:
1. Verify server binds to `0.0.0.0` not `localhost`
2. Check PORT environment variable is used
3. Ensure service is properly linked to domain
4. Check deployment logs for runtime errors

---

## Dependency Matrix

| Platform | Node.js | Python3 | GCC | Make | Config File | Notes |
|----------|---------|---------|-----|------|-------------|-------|
| Railway | ✅ Auto | ✅ nixpacks.toml | ✅ nixpacks.toml | ✅ nixpacks.toml | nixpacks.toml | Requires explicit declaration |
| Render | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto | None | Auto-detects via package.json |
| Heroku | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto | None | Auto-detects via package.json |
| Docker | ✅ Manual | ✅ Manual | ✅ Manual | ✅ Manual | Dockerfile | Full control required |
| AWS EB | ✅ Auto | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual | .ebextensions | May need config |
| Vercel | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | N/A | Not compatible (no filesystem) |

---

## Future Considerations

### Alternative: Remove Native Dependencies
If deployment issues persist, consider:

1. **Replace better-sqlite3 with sql.js**
   - Pure JavaScript SQLite (no native compilation)
   - Slower but more portable
   - No build dependencies required

2. **Use External Database**
   - PostgreSQL (Render, Railway, Heroku have free tiers)
   - MySQL/MariaDB
   - MongoDB
   - No native compilation needed
   - Better for production scaling

3. **Prebuilt Binaries**
   - Create prebuilt binaries for common platforms
   - Upload to npm or GitHub releases
   - Skip compilation during deployment

---

## Validation Script

See `scripts/validate-dependencies.sh` for automated checking.

## Last Updated
2025-12-01

## Maintained By
Development Team
