# Portal Backend Documentation

**Last Updated:** January 25, 2026

## Table of Contents

1. [API Documentation](./api/api-documentation.md)
2. [Database Documentation](./database/schema.md)
3. [Architecture Documentation](./architecture/folder-structure.md)
4. [Configuration Documentation](./configuration/environment-variables.md)
5. [Security Documentation](./security/authentication.md)
6. [Business Logic Documentation](./business-logic/workflows.md)
7. [Error Handling Documentation](./error-handling/error-strategy.md)
8. [Deployment Documentation](./deployment/setup-guide.md)

## Quick Links

- [API Endpoints](./api/api-documentation.md)
- [Database Schema](./database/schema.md)
- [Setup Guide](./deployment/setup-guide.md)
- [Environment Variables](./configuration/environment-variables.md)

## Overview

This backend provides a production-ready API for the Portal application, supporting both member and business user authentication, email verification, and account management.

### Key Features

- Member and Business signup flows
- Email verification with OTP
- JWT-based authentication
- Rate limiting and security measures
- Comprehensive error handling
- Audit logging
- Database transactions
- Connection pooling

## Getting Started

See [Setup Guide](./deployment/setup-guide.md) for installation and configuration instructions.

## API Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.portal.com/api`

## Support

For issues or questions, please refer to the relevant documentation section or contact the development team.
