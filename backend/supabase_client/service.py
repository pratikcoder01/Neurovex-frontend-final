from supabase import Client
from core.config import get_settings
from core.auth import get_supabase

class SupabaseService:
    def __init__(self):
        self.settings = get_settings()
        # In a real app, we might use a service key for admin tasks, 
        # but here we use the client which might be passed in or instantiated.
        # For server-side logging (bypassing RLS or using admin rights), we'd need the SERVICE_ROLE_KEY.
        # For now, we'll assume we are logging on behalf of the user or system.
        pass

    def get_client(self) -> Client:
        return get_supabase()

    async def log_session_start(self, user_id: str, config: dict):
        client = self.get_client()
        data = {
            "user_id": user_id,
            "start_time": "now()",
            "config": config,
            "focus_trend": "stable"
        }
        # In a real async context, we might use the async client or run in executor
        # supabase-py is synchronous by default for now
        try:
            response = client.table("study_sessions").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error logging session start: {e}")
            return None

    async def log_eeg_packet(self, session_id: str, bands: dict, signal_quality: float):
        client = self.get_client()
        data = {
            "session_id": session_id,
            "delta": bands.get("delta"),
            "theta": bands.get("theta"),
            "alpha": bands.get("alpha"),
            "beta": bands.get("beta"),
            "gamma": bands.get("gamma"),
            "signal_quality": signal_quality
        }
        try:
            # Fire and forget / batching would be better for performance
            client.table("eeg_band_logs").insert(data).execute()
        except Exception as e:
            # Don't crash on log error
            print(f"Error logging packet: {e}")

db_service = SupabaseService()
