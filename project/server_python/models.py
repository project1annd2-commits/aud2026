from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Any, Union
from typing_extensions import Annotated

# Helper to map MongoDB _id to id
PyObjectId = Annotated[str, BeforeValidator(str)]

class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "64b1f... (ObjectId)"
            }
        }
    }

# --- School ---
class School(MongoBaseModel):
    name: str
    location: str
    code: Optional[str] = None
    createdBy: str
    createdAt: str

# --- Teacher ---
class Teacher(MongoBaseModel):
    schoolId: str
    name: str
    qualification: str
    phone: str
    email: Optional[str] = None
    subject: str
    createdAt: str

# --- Mentor ---
class Mentor(MongoBaseModel):
    schoolId: str
    name: str
    qualification: str
    phone: str
    email: Optional[str] = None
    expertise: str
    createdAt: str

# --- Audit ---
class AuditResponse(BaseModel):
    criteriaId: str
    selectedOption: str
    score: Union[int, float]
    comment: Optional[str] = None
    videoUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None

class AuditVersion(BaseModel):
    id: str
    timestamp: str
    responses: List[AuditResponse]
    totalScore: Union[int, float]
    maxScore: Union[int, float]
    editedBy: Optional[str] = None
    isDraft: Optional[bool] = None

class Audit(MongoBaseModel):
    type: str  # 'teacher', 'mentor', 'infrastructure'
    subjectId: str
    schoolId: str
    accessCode: str
    versions: List[AuditVersion]
    currentVersion: int
    createdAt: str

# --- Infrastructure Audit ---
class InfrastructureAudit(MongoBaseModel):
    schoolId: str
    accessCode: str
    versions: List[AuditVersion]  # Reusing AuditVersion as structure is same
    currentVersion: int
    createdAt: str

# --- Device ---
class Device(MongoBaseModel):
    # This 'id' is the CUSTOM string id (dev_...), not the Mongo _id. 
    # But MongoBaseModel aliases 'id' to '_id'. 
    # We need to be careful. The frontend sends 'id' as 'dev_...'. 
    # In the Node backend, we distinguished between _id (Mongo) and id (Custom).
    # Here, let's explicit define custom_id field mapping.
    
    # Actually, the frontend expects 'id' to be the custom ID for devices? 
    # No, the frontend generates 'id': 'dev_...'.
    # Our MongoBaseModel maps 'id' in python to '_id' in Mongo.
    # We should override this for Device and LoginSession which use explicit custom IDs.
    
    id: str # The custom ID (e.g. dev_123)
    username: str
    name: str
    type: str
    os: str
    browser: str
    ipAddress: str
    lastLoginAt: str
    status: str
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    createdAt: str

    class Config:
        populate_by_name = True

# --- Login Session ---
class DeviceInfo(BaseModel):
    browser: str
    os: str
    device: str
    userAgent: str

class LocationInfo(BaseModel):
    city: Optional[str] = None
    country: Optional[str] = None

class LoginSession(MongoBaseModel):
    id: str # Custom session ID
    username: str
    displayName: str
    role: str
    timestamp: str
    deviceInfo: DeviceInfo
    ipAddress: str
    location: Optional[LocationInfo] = None
    status: str
    logoutTimestamp: Optional[str] = None

    class Config:
        populate_by_name = True

class ChatMessage(BaseModel):
    id: str
    senderId: str
    senderName: str
    text: str
    timestamp: str
    read: bool
    isAdmin: bool

class ChatSession(BaseModel):
    id: str
    schoolId: str
    schoolName: str
    schoolCode: str
    teacherName: str
    assignedTo: str
    status: str # 'active', 'closed'
    lastMessage: Optional[ChatMessage] = None
    unreadCount: int
    createdAt: str
    updatedAt: str
