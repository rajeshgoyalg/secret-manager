
# Secret Manager

## Overview
Secret Manager is a secure secrets management system designed to help developers safely store and manage sensitive information like API keys, database credentials, and other configuration secrets. The system integrates with AWS SSM (Systems Manager Parameter Store) for enhanced security and scalability.

## Purpose
The primary purpose of Secret Manager is to:
- Securely store sensitive information
- Manage access control to secrets
- Track secret usage and modifications
- Provide audit logs for security compliance
- Enable seamless integration with applications

## Use Cases
1. **API Keys Management**
   - Store third-party API credentials
   - Manage authentication tokens
   - Secure webhook secrets

2. **Database Credentials**
   - Store database connection strings
   - Manage database user credentials
   - Handle multiple environment configurations

3. **Application Configuration**
   - Environment-specific settings
   - Feature flags
   - Service account credentials

4. **Compliance & Auditing**
   - Track secret access history
   - Monitor modifications
   - Maintain security compliance logs

## Installation

### Prerequisites
- Node.js version 20.x or higher
- PostgreSQL 14.x or higher
- AWS account with SSM access
- npm version 9.x or higher

### Dependencies
```json
{
  "@aws-sdk/client-ssm": "^3.775.0",
  "express": "^4.21.2",
  "express-session": "^1.18.1",
  "pg": "^8.14.1",
  "drizzle-orm": "^0.39.1"
}
```

### Installation Steps

1. **Setup Database**
   ```bash
   npm install
   npm run db:push
   ```

2. **Configure Environment Variables**
   Create a `.env` file with required configurations:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   SESSION_SECRET="your-secure-session-secret"
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   NODE_ENV="development"
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

## Security Features
- AES-256 encryption for secrets at rest
- TLS encryption for data in transit
- Regular encryption key rotation
- Role-based access control
- Audit logging for all operations

## API Endpoints
- `POST /api/secrets` - Create new secret
- `GET /api/secrets` - List all accessible secrets
- `PUT /api/secrets/:id` - Update existing secret
- `DELETE /api/secrets/:id` - Delete secret

## Best Practices
1. Always use environment variables for sensitive data
2. Regularly rotate secrets and access keys
3. Implement proper access controls
4. Monitor and audit secret usage
5. Use encrypted connections for database access
