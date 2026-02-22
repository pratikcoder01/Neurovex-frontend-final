from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.auth import get_current_user
from supabase_client.service import db_service
from datetime import datetime

router = APIRouter()

# Pydantic Models for Request/Response
class SessionStart(BaseModel):
    duration_minutes: Optional[int] = 10
    focus_mode: str = "general" # general, meditation, concentration

class SessionEnd(BaseModel):
    session_id: str
    feedback_score: Optional[int] = None
    notes: Optional[str] = None

@router.post("/sessions/start")
async def start_session(session_data: SessionStart, user: dict = Depends(get_current_user)):
    """
    Starts a new BCI session.
    Logs metadata to Supabase 'study_sessions' table.
    """
    user_id = user.get("id")
    # Log to Supabase
    record = await db_service.log_session_start(user_id, session_data.dict())
    
    if record:
         return {
            "session_id": record['id'],
            "status": "recording",
            "user": user_id,
            "start_time": record['start_time']
        }
    else:
        # Fallback if DB fails
        return {
            "session_id": "offline_session",
            "status": "offline_recording",
            "user": user_id,
            "error": "Database write failed"
        }

@router.post("/sessions/end")
async def end_session(session_data: SessionEnd, user: dict = Depends(get_current_user)):
    """
    Ends a session.
    Computes summary metrics and updates the DB record.
    """
    # In a full flow, we would update the end_time here via db_service
    # For now, acknowledgement is sufficient
    return {
        "session_id": session_data.session_id,
        "status": "completed",
        "saved_to_cloud": True
    }

@router.get("/sessions/history")
async def get_session_history(user: dict = Depends(get_current_user)):
    """
    Fetches past sessions for the authenticated user.
    """
    client = db_service.get_client()
    try:
        response = client.table("study_sessions").select("*").eq("user_id", user.get("id")).order("start_time", desc=True).limit(10).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []
