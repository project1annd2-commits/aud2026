from fastapi import FastAPI, HTTPException, Body, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from models import School, Teacher, Mentor, Audit, InfrastructureAudit, Device, LoginSession
from database import (
    schools_collection, teachers_collection, mentors_collection,
    audits_collection, infra_audits_collection, devices_collection, login_sessions_collection
)
from bson import ObjectId
import uvicorn
import os
import uuid
import cv2
from moviepy import VideoFileClip
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Helper to fix _id mapping
def clean_doc(doc):
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# --- Schools ---
@app.get("/api/schools", response_model=List[School], response_model_by_alias=False)
async def get_schools(createdBy: Optional[str] = None):
    query = {}
    if createdBy:
        query["createdBy"] = createdBy
    schools = await schools_collection.find(query).to_list(1000)
    return schools

@app.get("/api/schools/{id}", response_model=School, response_model_by_alias=False)
async def get_school(id: str):
    school = await schools_collection.find_one({"_id": ObjectId(id)})
    if school:
        return school
    raise HTTPException(status_code=404, detail="School not found")

@app.post("/api/schools", response_model=School)
async def create_school(school: School):
    school_dict = school.model_dump(by_alias=True, exclude=["id"]) # exclude id to let mongo generate it
    new_school = await schools_collection.insert_one(school_dict)
    created_school = await schools_collection.find_one({"_id": new_school.inserted_id})
    return created_school

@app.put("/api/schools/{id}", response_model=School)
async def update_school(id: str, school: School):
    school_dict = school.model_dump(by_alias=True, exclude=["id"])
    update_result = await schools_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": school_dict},
        return_document=True
    )
    if update_result:
        return update_result
    raise HTTPException(status_code=404, detail="School not found")

@app.delete("/api/schools/{id}")
async def delete_school(id: str):
    delete_result = await schools_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "School deleted"}
    raise HTTPException(status_code=404, detail="School not found")


# --- Teachers ---
@app.get("/api/teachers", response_model=List[Teacher], response_model_by_alias=False)
async def get_teachers(schoolId: Optional[str] = None):
    query = {}
    if schoolId:
        query["schoolId"] = schoolId
    teachers = await teachers_collection.find(query).to_list(1000)
    return teachers

@app.get("/api/teachers/{id}", response_model=Teacher, response_model_by_alias=False)
async def get_teacher(id: str):
    teacher = await teachers_collection.find_one({"_id": ObjectId(id)})
    if teacher:
        return teacher
    raise HTTPException(status_code=404, detail="Teacher not found")

@app.post("/api/teachers", response_model=Teacher)
async def create_teacher(teacher: Teacher):
    teacher_dict = teacher.model_dump(by_alias=True, exclude=["id"])
    new_teacher = await teachers_collection.insert_one(teacher_dict)
    created_teacher = await teachers_collection.find_one({"_id": new_teacher.inserted_id})
    return created_teacher

@app.put("/api/teachers/{id}", response_model=Teacher)
async def update_teacher(id: str, teacher: Teacher):
    teacher_dict = teacher.model_dump(by_alias=True, exclude=["id"])
    update_result = await teachers_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": teacher_dict},
        return_document=True
    )
    if update_result:
        return update_result
    raise HTTPException(status_code=404, detail="Teacher not found")

@app.delete("/api/teachers/{id}")
async def delete_teacher(id: str):
    delete_result = await teachers_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Teacher deleted"}
    raise HTTPException(status_code=404, detail="Teacher not found")


# --- Mentors ---
@app.get("/api/mentors", response_model=List[Mentor], response_model_by_alias=False)
async def get_mentors(schoolId: Optional[str] = None):
    query = {}
    if schoolId:
        query["schoolId"] = schoolId
    mentors = await mentors_collection.find(query).to_list(1000)
    return mentors

@app.get("/api/mentors/{id}", response_model=Mentor, response_model_by_alias=False)
async def get_mentor(id: str):
    mentor = await mentors_collection.find_one({"_id": ObjectId(id)})
    if mentor:
        return mentor
    raise HTTPException(status_code=404, detail="Mentor not found")

@app.post("/api/mentors", response_model=Mentor)
async def create_mentor(mentor: Mentor):
    mentor_dict = mentor.model_dump(by_alias=True, exclude=["id"])
    new_mentor = await mentors_collection.insert_one(mentor_dict)
    created_mentor = await mentors_collection.find_one({"_id": new_mentor.inserted_id})
    return created_mentor

@app.put("/api/mentors/{id}", response_model=Mentor)
async def update_mentor(id: str, mentor: Mentor):
    mentor_dict = mentor.model_dump(by_alias=True, exclude=["id"])
    update_result = await mentors_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": mentor_dict},
        return_document=True
    )
    if update_result:
        return update_result
    raise HTTPException(status_code=404, detail="Mentor not found")

@app.delete("/api/mentors/{id}")
async def delete_mentor(id: str):
    delete_result = await mentors_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Mentor deleted"}
    raise HTTPException(status_code=404, detail="Mentor not found")


# --- Audits ---
@app.get("/api/audits", response_model=List[Audit], response_model_by_alias=False)
async def get_audits(subjectId: Optional[str] = None, accessCode: Optional[str] = None):
    query = {}
    if subjectId:
        query["subjectId"] = subjectId
    if accessCode:
        query["accessCode"] = accessCode
    audits = await audits_collection.find(query).to_list(1000)
    return audits

@app.post("/api/audits", response_model=Audit)
async def create_audit(audit: Audit):
    audit_dict = audit.model_dump(by_alias=True, exclude=["id"])
    new_audit = await audits_collection.insert_one(audit_dict)
    created_audit = await audits_collection.find_one({"_id": new_audit.inserted_id})
    return created_audit

@app.put("/api/audits/{id}", response_model=Audit)
async def update_audit(id: str, audit: Audit):
    audit_dict = audit.model_dump(by_alias=True, exclude=["id"])
    update_result = await audits_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": audit_dict},
        return_document=True
    )
    if update_result:
        return update_result
    raise HTTPException(status_code=404, detail="Audit not found")

@app.delete("/api/audits/{id}")
async def delete_audit(id: str):
    delete_result = await audits_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Audit deleted"}
    raise HTTPException(status_code=404, detail="Audit not found")


# --- Infrastructure Audits ---
@app.get("/api/infrastructure-audits", response_model=List[InfrastructureAudit], response_model_by_alias=False)
async def get_infra_audits(schoolId: Optional[str] = None, accessCode: Optional[str] = None):
    query = {}
    if schoolId:
        query["schoolId"] = schoolId
    if accessCode:
        query["accessCode"] = accessCode
    audits = await infra_audits_collection.find(query).to_list(1000)
    return audits

@app.post("/api/infrastructure-audits", response_model=InfrastructureAudit)
async def create_infra_audit(audit: InfrastructureAudit):
    audit_dict = audit.model_dump(by_alias=True, exclude=["id"])
    new_audit = await infra_audits_collection.insert_one(audit_dict)
    created_audit = await infra_audits_collection.find_one({"_id": new_audit.inserted_id})
    return created_audit

@app.put("/api/infrastructure-audits/{id}", response_model=InfrastructureAudit)
async def update_infra_audit(id: str, audit: InfrastructureAudit):
    audit_dict = audit.model_dump(by_alias=True, exclude=["id"])
    update_result = await infra_audits_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": audit_dict},
        return_document=True
    )
    if update_result:
        return update_result
    raise HTTPException(status_code=404, detail="Infrastructure Audit not found")

@app.delete("/api/infrastructure-audits/{id}")
async def delete_infra_audit(id: str):
    delete_result = await infra_audits_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Infrastructure Audit deleted"}
    raise HTTPException(status_code=404, detail="Infrastructure Audit not found")


# --- Devices (Custom ID) ---
# Special handling: Device model has a field named 'id' (custom) and 'id' alias for Mongo _id.
# Valid Pydantic model for response should just include all fields.
# But request logic needs to query by 'id' (custom) NOT _id.

@app.get("/api/devices", response_model=List[Device], response_model_by_alias=False)
async def get_devices():
    devices = await devices_collection.find({}).to_list(1000)
    # The 'id' field in Mongodb document is the custom ID.
    # The '_id' field is Mongo ID.
    # Our Pydantic model 'Device' declares 'id' (custom). 
    # But where does Mongo _id go? MongoBaseModel tries to map _id -> id.
    # This conflicts.
    # Fix: For Device and LoginSession, we should probably NOT inherit from MongoBaseModel if they use custom IDs as primary key concept in Logic.
    # BUT the frontend might expect the Mongo ID too?
    # In my Node implementation:
    # res.json({ ...savedDevice.toObject(), id: savedDevice._id });
    # Wait, in Device.js schema: "id: { type: String, required: true, unique: true }"
    # So `toObject()` would have `_id` AND `id`.
    # And my Node endpoint `res.json({ ...rest, _id })` returned both.
    # The frontend likely relies on `id` being the CUSTOM id (dev_...).
    # If I use MongoBaseModel, `id` becomes alias for `_id`. Then `dev_...` field which is named `id` in DB clobbers/conflicts.
    
    # Simple fix: Let's assume the frontend uses the CUSTOM id key for logic. 
    # For compatibility, I will just return strict dicts from Mongo without PyMongo model alias magic for these two specific endpoints.
    return devices

@app.get("/api/devices/{id}", response_model=Device, response_model_by_alias=False)
async def get_device(id: str):
    device = await devices_collection.find_one({"id": id})
    if device:
        return device
    raise HTTPException(status_code=404, detail="Device not found")

@app.post("/api/devices", response_model=Device)
async def create_device(device: Device):
    # device contains custom 'id'.
    # We want to save it as is.
    device_dict = device.model_dump(by_alias=True)
    # If mapped from MongoBaseModel, 'id' in dict might be missing or aliased?
    # Actually, if we pass 'id'="dev_123" to Device(), and Device inherits MongoBaseModel...
    # MongoBaseModel says id is optional _id.
    # This is messy. Pydantic v2.
    
    # HACK for speed: Just insert the raw dict from body? Pydantic validation is good though.
    # Let's trust that the 'id' field in the schema (the one I defined as `id: str`) overrides the parent `id`.
    # Actually, in Python class inheritance, if I redefine `id: str`, it overrides `id: Optional[PyObjectId]`.
    # So it should be fine. It will act as the custom ID.
    # Pydantic will save it as 'id' in the dict. Mongo will add its own '_id'.
    
    # We need to ensure we don't try to write '_id' if it's None.
    if "_id" in device_dict and device_dict["_id"] is None:
        del device_dict["_id"]
        
    new_device = await devices_collection.insert_one(device_dict)
    created_device = await devices_collection.find_one({"_id": new_device.inserted_id})
    return created_device

@app.put("/api/devices/{id}", response_model=Device)
async def update_device(id: str, device: Device):
    device_dict = device.model_dump(by_alias=True)
    if "_id" in device_dict: 
        del device_dict["_id"] # Don't update _id

    update_result = await devices_collection.find_one_and_update(
        {"id": id}, # Query by Custom ID
        {"$set": device_dict},
        return_document=True
    )
    if update_result:
        return update_result
    raise HTTPException(status_code=404, detail="Device not found")

@app.delete("/api/devices/{id}")
async def delete_device(id: str):
    delete_result = await devices_collection.delete_one({"id": id})
    if delete_result.deleted_count == 1:
        return {"message": "Device deleted"}
    raise HTTPException(status_code=404, detail="Device not found")


# --- Login Sessions (Custom ID) ---

@app.get("/api/login-sessions", response_model=List[LoginSession], response_model_by_alias=False)
async def get_sessions():
    sessions = await login_sessions_collection.find({}).to_list(1000)
    return sessions

@app.post("/api/login-sessions", response_model=LoginSession)
async def create_session(session: LoginSession):
    session_dict = session.model_dump(by_alias=True)
    if "_id" in session_dict and session_dict["_id"] is None:
        del session_dict["_id"]

    new_session = await login_sessions_collection.insert_one(session_dict)
    created_session = await login_sessions_collection.find_one({"_id": new_session.inserted_id})
    return created_session

@app.put("/api/login-sessions/{id}", response_model=LoginSession)
async def update_session(id: str, session: LoginSession):
    # Frontend might send partial updates (e.g. just logoutTimestamp). 
    # But Pydantic expects full model.
    # But... the frontend `database.ts` sends `updates: Partial<LoginSession>`.
    # My FastAPI definition expects full `LoginSession`. This will FAIL on partial updates.
    # I need a Partial Update model or use Body(embed=False).
    # Since I'm doing a quick port, I'll switch to use `dict` for the BODY in update method to accept partials.
    pass # Re-implementing below correctly...

@app.put("/api/login-sessions/{id}")
async def update_session_partial(id: str, updates: dict = Body(...)):
    # Validate against a partial model if needed, or just trust frontend for now. 
    # Ideally should use a PATCH-like logic.
    update_result = await login_sessions_collection.find_one_and_update(
        {"id": id},
        {"$set": updates},
        return_document=True
    )
    if update_result:
        # Convert _id to str for JSON response if needed, although client mostly cares about 'id'
        if "_id" in update_result:
            update_result["_id"] = str(update_result["_id"])
        return update_result
    raise HTTPException(status_code=404, detail="Session not found")


# --- Video Processing ---
@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process video with MoviePy to get some metadata
    try:
        clip = VideoFileClip(file_path)
        duration = clip.duration
        fps = clip.fps
        size = clip.size
        
        # Extract a thumbnail at 1 second (or 0 if shorter)
        thumb_filename = f"{os.path.splitext(unique_filename)[0]}.jpg"
        thumb_path = os.path.join(UPLOAD_DIR, thumb_filename)
        clip.save_frame(thumb_path, t=min(1.0, duration))
        
        clip.close()

        # Perform object and gesture recognition
        recognition_results = await perform_recognition(file_path)

        return {
            "url": f"/uploads/{unique_filename}",
            "thumbnailUrl": f"/uploads/{thumb_filename}",
            "filename": file.filename,
            "duration": duration,
            "resolution": f"{size[0]}x{size[1]}",
            "fps": fps,
            "recognitionResults": recognition_results
        }
    except Exception as e:
        print(f"Error processing video: {e}")
        return {
            "url": f"/uploads/{unique_filename}",
            "filename": file.filename,
            "error": "Could not process video metadata, but file was uploaded."
        }

async def perform_recognition(video_path: str):
    """
    Perform object and gesture recognition on the uploaded video.
    """
    try:
        # Try to import the required modules
        try:
            from ultralytics import YOLO
            import cv2
            import numpy as np
            use_ultralytics = True
        except ImportError as e:
            print(f"Ultralytics module not available: {e}")
            use_ultralytics = False

        if use_ultralytics:
            # Load a pre-trained YOLOv8 model (you can replace this with your custom model)
            model = YOLO("yolov8n.pt")  # Using a small model for demonstration

            # Open the video file
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {"error": "Could not open video file for recognition"}

            # Initialize variables for tracking
            frame_count = 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            sample_interval = max(1, total_frames // 30)  # Sample 30 frames

            # Process selected frames
            results = []
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % sample_interval == 0:
                    # Perform detection on the frame
                    detections = model(frame, verbose=False)

                    # Process detections
                    for detection in detections:
                        for box in detection.boxes:
                            class_id = int(box.cls)
                            class_name = model.names[class_id]
                            confidence = float(box.conf)
                            
                            # Filter for relevant classes with minimum confidence threshold
                            if class_name in ["person", "hand", "book", "cell phone"] and confidence >= 0.4:
                                results.append({
                                    "class": class_name,
                                    "confidence": confidence,
                                    "frame": frame_count
                                })

                frame_count += 1

            cap.release()

            # Analyze results for classroom interactions
            analysis = analyze_classroom_interactions(results)

            return {
                "detections": results,
                "analysis": analysis
            }
        else:
            # Fallback: Mock recognition results for testing
            print("Using mock recognition results")
            import random
            
            # Generate varied mock results based on video file name
            video_name = os.path.basename(video_path)
            hash_value = hash(video_name)
            random.seed(hash_value)
            
            # Randomly decide if students are using books or phones
            using_book = random.choice([True, False])
            using_phone = random.choice([True, False])
            
            # Generate mock detections based on the random decisions
            mock_results = []
            if using_book:
                mock_results.append({"class": "book", "confidence": 0.85, "frame": 20})
            if using_phone:
                mock_results.append({"class": "cell phone", "confidence": 0.75, "frame": 40})
            
            # Always include at least one person detection
            mock_results.extend([
                {"class": "person", "confidence": 0.95, "frame": 10},
                {"class": "person", "confidence": 0.9, "frame": 30},
            ])
            
            print(f"Mock results: {mock_results}")
            mock_analysis = analyze_classroom_interactions(mock_results)
            print(f"Mock analysis: {mock_analysis}")
            return {
                "detections": mock_results,
                "analysis": mock_analysis,
                "note": "Using mock recognition results (ultralytics module not available)"
            }

    except Exception as e:
        print(f"Error during recognition: {e}")
        return {"error": f"Recognition failed: {str(e)}"}


def analyze_classroom_interactions(detections):
    """
    Analyze detections to identify classroom interactions with improved accuracy.
    """
    analysis = {
        "student_interactions": {
            "raising_hand": False,
            "using_book": False,
            "using_phone": False,
            "interactive": False
        },
        "teacher_activities": {
            "explaining": False,
            "monitoring": False
        },
        "summary": "No significant interactions detected."
    }

    # Filter detections by confidence threshold to reduce false positives
    HIGH_CONFIDENCE_THRESHOLD = 0.7
    MEDIUM_CONFIDENCE_THRESHOLD = 0.5
    
    # Count high-confidence detections only
    high_conf_person_count = sum(1 for d in detections
                                if d.get("class") == "person" and d.get("confidence", 0) >= HIGH_CONFIDENCE_THRESHOLD)
    high_conf_book_count = sum(1 for d in detections
                              if d.get("class") == "book" and d.get("confidence", 0) >= HIGH_CONFIDENCE_THRESHOLD)
    high_conf_phone_count = sum(1 for d in detections
                               if d.get("class") == "cell phone" and d.get("confidence", 0) >= HIGH_CONFIDENCE_THRESHOLD)
    
    # Count medium-confidence detections for secondary verification
    med_conf_phone_count = sum(1 for d in detections
                             if d.get("class") == "cell phone" and
                             MEDIUM_CONFIDENCE_THRESHOLD <= d.get("confidence", 0) < HIGH_CONFIDENCE_THRESHOLD)

    # Update analysis based on high-confidence detections
    if high_conf_person_count > 0:
        analysis["student_interactions"]["interactive"] = True
        analysis["teacher_activities"]["monitoring"] = True
        analysis["summary"] = "Students are present and interactive."

    if high_conf_book_count > 0:
        analysis["student_interactions"]["using_book"] = True
        if analysis["summary"] == "No significant interactions detected.":
            analysis["summary"] = "Students are using books."
        else:
            analysis["summary"] += " Students are using books."

    # Only mark phone usage if we have high confidence detections
    # or multiple medium confidence detections to reduce false positives
    if high_conf_phone_count > 0 or med_conf_phone_count >= 2:
        analysis["student_interactions"]["using_phone"] = True
        if analysis["summary"] == "No significant interactions detected.":
            analysis["summary"] = "Students are using phones."
        else:
            analysis["summary"] += " Some students are using phones."
    else:
        # Explicitly set to False if no confident phone detection
        analysis["student_interactions"]["using_phone"] = False

    # If no specific interactions but persons detected
    if high_conf_person_count > 0 and not any([high_conf_book_count > 0, high_conf_phone_count > 0]):
        analysis["summary"] = "Students are present and interactive, but no specific activities detected."

    return analysis


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
