# School Audit System - Python FastAPI Backend

## Overview
This is the Python FastAPI backend for the School Audit System, migrated from Node.js Express and Firebase to MongoDB.

## Current Status ✅

### Data Import Complete
- **Schools**: 43 documents
- **Teachers**: 110 documents
- **Mentors**: 33 documents
- **Audits**: 146 documents

All data has been successfully imported from `localStorageData.json` into MongoDB.

## Technology Stack

### Core Framework
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Motor**: Async MongoDB driver
- **Pydantic**: Data validation

### Installed Libraries

#### Data Analysis & Reporting
- `pandas` - Data manipulation and analysis
- `openpyxl` - Excel file generation
- `reportlab` - PDF generation

#### Security
- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT tokens (ready to install)

#### Visualization
- `matplotlib` - Data visualization (ready to install)
- `seaborn` - Statistical visualization (ready to install)

### Note on Python 3.14
Some advanced libraries (OpenCV, PyTorch, MoviePy) are not yet compatible with Python 3.14. If you need these, consider using Python 3.11 or 3.12.

## API Endpoints

### Schools
- `GET /api/schools` - Get all schools (optional: ?createdBy=username)
- `GET /api/schools/{id}` - Get school by ID
- `POST /api/schools` - Create new school
- `PUT /api/schools/{id}` - Update school
- `DELETE /api/schools/{id}` - Delete school

### Teachers
- `GET /api/teachers` - Get all teachers (optional: ?schoolId=id)
- `GET /api/teachers/{id}` - Get teacher by ID
- `POST /api/teachers` - Create new teacher
- `PUT /api/teachers/{id}` - Update teacher
- `DELETE /api/teachers/{id}` - Delete teacher

### Mentors
- `GET /api/mentors` - Get all mentors (optional: ?schoolId=id)
- `GET /api/mentors/{id}` - Get mentor by ID
- `POST /api/mentors` - Create new mentor
- `PUT /api/mentors/{id}` - Update mentor
- `DELETE /api/mentors/{id}` - Delete mentor

### Audits
- `GET /api/audits` - Get all audits (optional: ?subjectId=id&accessCode=code)
- `POST /api/audits` - Create new audit
- `PUT /api/audits/{id}` - Update audit
- `DELETE /api/audits/{id}` - Delete audit

### Infrastructure Audits
- `GET /api/infrastructure-audits` - Get all infrastructure audits
- `POST /api/infrastructure-audits` - Create new infrastructure audit
- `PUT /api/infrastructure-audits/{id}` - Update infrastructure audit
- `DELETE /api/infrastructure-audits/{id}` - Delete infrastructure audit

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/{id}` - Get device by custom ID
- `POST /api/devices` - Create new device
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Delete device

### Login Sessions
- `GET /api/login-sessions` - Get all login sessions
- `POST /api/login-sessions` - Create new login session
- `PUT /api/login-sessions/{id}` - Update login session (partial updates supported)

## Running the Server

```bash
# Start the server
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

The server runs on `http://localhost:5000`

## Database Configuration

MongoDB connection is configured via environment variable:
```
MONGODB_URI=mongodb+srv://project1annd2_db_user:mKhiz4Uy6ObbAeGV@cluster0.dvnoiyy.mongodb.net/school_audit_db?appName=Cluster0
```

## Data Import

To re-import data from the frontend's localStorage backup:

```bash
python import_data.py
```

This script:
- Reads from `../src/data/localStorageData.json`
- Converts snake_case to camelCase
- Parses nested JSON strings
- Imports into MongoDB collections

## Testing

Test the API endpoints:
```bash
python test_api_data.py
```

## Next Steps

### 1. Security Implementation
- [ ] Implement JWT authentication using `python-jose`
- [ ] Add password hashing for user accounts
- [ ] Implement role-based access control (RBAC)
- [ ] Add API rate limiting

### 2. Reporting Features
- [ ] Generate PDF audit reports using `reportlab`
- [ ] Export data to Excel using `openpyxl`
- [ ] Create data visualization dashboards using `matplotlib`/`seaborn`

### 3. Advanced Features
- [ ] Implement audit analytics and trends
- [ ] Add email notifications
- [ ] Create scheduled report generation
- [ ] Implement data backup automation

### 4. Frontend Integration
- [ ] Update frontend to use Python backend exclusively
- [ ] Remove Node.js backend dependency
- [ ] Test all CRUD operations from frontend

### 5. Production Readiness
- [ ] Add comprehensive error handling
- [ ] Implement logging
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up monitoring and health checks
- [ ] Configure CORS for production domains

## File Structure

```
server_python/
├── main.py              # FastAPI application and routes
├── models.py            # Pydantic data models
├── database.py          # MongoDB connection and collections
├── requirements.txt     # Python dependencies
├── import_data.py       # Data import script
├── test_api_data.py     # API testing script
└── README.md           # This file
```

## Notes

- CORS is currently set to allow all origins (`*`) for development
- Custom ID fields are used for Devices and LoginSessions
- Partial updates are supported for LoginSessions
- All timestamps are stored as ISO 8601 strings
