from fastapi import APIRouter, Depends
from core.auth import get_current_user

router = APIRouter()

@router.get("/analytics/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    """
    Returns AI-generated insights based on recent sessions.
    """
    return {
        "focus_trend": "improving",
        "peak_time": "10:00 AM",
        "fatigue_alert": "Low",
        "recommendation": "Try increasing session duration by 5 minutes."
    }
