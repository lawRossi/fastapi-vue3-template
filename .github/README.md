# GitHub Actions CI/CD Setup

This repository includes a comprehensive GitHub Actions setup for continuous integration and deployment of both frontend and backend applications.

## 🏗️ Workflow Overview

### 1. Backend CI (`backend-ci.yml`)
**Triggered on:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to `backend/**` directory

**Jobs:**
- **Test**: Multi-Python version testing (3.12, 3.13)
  - Database migrations using Alembic
  - Unit tests with pytest and coverage
  - Code quality checks (Ruff linting)
  - Type checking (MyPy)
- **Build**: Docker image building
- **Security**: Vulnerability scanning with Safety and Bandit

### 2. Frontend CI (`frontend-ci.yml`)
**Triggered on:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to `frontend/**` directory

**Jobs:**
- **Test**: Multi-Node version testing (18, 20, 22)
  - ESLint code quality checks
  - Prettier formatting validation
  - TypeScript type checking
  - Unit tests with coverage
  - Production build verification
- **Security**: npm audit and dependency scanning
- **Lighthouse**: Performance audits (main branch only)

### 3. Deployment (`deploy.yml`)
**Triggered on:**
- Push to `main` branch (after CI passes)
- Completion of Backend CI and Frontend CI workflows

**Jobs:**
- **Deploy Staging**: Deploy to staging environment
- **Deploy Production**: Deploy to production environment (after staging)
- **Create Release**: Generate GitHub release with changelog

### 4. Dependency Updates (`dependency-updates.yml`)
**Triggered on:**
- Weekly schedule (Mondays 9 AM UTC)
- Manual workflow dispatch

**Jobs:**
- **Backend Dependency Updates**: Update Python dependencies and create PR
- **Frontend Dependency Updates**: Update Node.js dependencies and create PR
- **Security Scan**: CodeQL analysis and dependency vulnerability review

## 🔧 Configuration Files

### Backend Configuration
- `backend/ruff.toml`: Ruff linter configuration
- `backend/mypy.ini`: MyPy type checker configuration
- `backend/Dockerfile`: Production Docker image

### Frontend Configuration
- `frontend/lighthouserc.json`: Lighthouse CI configuration
- `frontend/Dockerfile`: Production Docker image with Nginx
- `frontend/nginx.conf`: Nginx configuration for serving SPA

### Infrastructure
- `docker-compose.yml`: Local development environment
- `.github/`: GitHub Actions workflow definitions

## 🚀 Getting Started

### Prerequisites
1. Enable GitHub Actions in your repository
2. Set up repository secrets for deployment (if needed):
   - `DOCKERHUB_TOKEN`: For container registry access
   - `KUBECONFIG`: For Kubernetes deployments
   - Other deployment-specific secrets

### Local Development

1. **Backend Development:**
   ```bash
   cd backend
   poetry install
   poetry run uvicorn app.main:app --reload
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Full Stack with Docker:**
   ```bash
   docker-compose up -d
   ```

### CI/CD Pipeline

1. **Code Push**: Changes pushed to `main` or `develop` trigger CI workflows
2. **Pull Request**: Automated testing and quality checks
3. **Merge to Main**: Triggers deployment pipeline
4. **Dependency Updates**: Weekly automatic dependency updates with PRs

## 📊 Workflow Status

You can monitor workflow status in:
- **GitHub Actions tab** in your repository
- **Pull Request checks** section
- **Commit status indicators**

## 🔍 Code Quality Standards

### Backend (Python)
- **Linting**: Ruff with PEP 8 compliance
- **Formatting**: Black-compatible formatting
- **Type Checking**: MyPy strict mode (with exceptions for tests)
- **Testing**: pytest with coverage reporting
- **Security**: Safety and Bandit scanning

### Frontend (TypeScript/Vue)
- **Linting**: ESLint with Vue and TypeScript rules
- **Formatting**: Prettier with consistent style
- **Type Checking**: Vue TypeScript compiler
- **Testing**: Jest/Vitest with coverage
- **Performance**: Lighthouse CI audits
- **Security**: npm audit and dependency scanning

## 🐳 Docker Support

Both applications include production-ready Docker configurations:

- **Backend**: Multi-stage build with health checks
- **Frontend**: Multi-stage build with Nginx serving
- **Local Development**: Docker Compose for full stack

## 📈 Performance Monitoring

- **Lighthouse CI**: Automated performance audits
- **Coverage Reports**: Code coverage tracking with Codecov
- **Security Scanning**: Regular vulnerability assessments

## 🔒 Security Best Practices

1. **Dependency Scanning**: Automated vulnerability detection
2. **Code Analysis**: CodeQL security analysis
3. **Secret Management**: GitHub-secrets for sensitive data
4. **Image Security**: Container image vulnerability scanning
5. **Access Control**: Environment-specific deployment approvals

## 🤝 Contributing

When contributing to this repository:

1. All PRs must pass CI checks
2. Code must pass linting and formatting standards
3. Tests must have adequate coverage
4. Security scans must not reveal vulnerabilities

## 📝 Troubleshooting

### Common Issues

1. **Poetry Dependencies**: Ensure `pyproject.toml` and `poetry.lock` are committed
2. **Node Dependencies**: Ensure `package-lock.json` is committed
3. **Docker Builds**: Check Dockerfile syntax and dependencies
4. **GitHub Secrets**: Verify all required secrets are set

### Workflow Logs

Check detailed logs in GitHub Actions tab for:
- Build failures
- Test failures
- Security scan results
- Deployment status

## 🎯 Next Steps

Consider enhancing this setup with:

1. **Kubernetes Deployment**: Add Helm charts for K8s deployment
2. **Monitoring**: Add application performance monitoring
3. **Feature Flags**: Implement feature flag management
4. **Advanced Testing**: Add integration and E2E testing
5. **Release Management**: Enhanced release process with changelog generation