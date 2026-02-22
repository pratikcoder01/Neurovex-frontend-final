from fastapi import Security, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from core.config import get_settings

security = HTTPBearer()
settings = get_settings()

def get_supabase() -> Client:
    try:
        # Client creation should ideally be singleton or pooled, 
        # but superset-py handles connection pooling internally.
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Supabase: {str(e)}"
        )

async def get_current_user(token: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the JWT token with Supabase Auth.
    Returns the user object if valid.
    """
    credentials = token.credentials
    
    # [NEW] Mock Token Check
    if credentials == "mock-token-123":
        return {
            "id": "mock-user-id",
            "email": "mock@neurovex.com",
            "aud": "authenticated",
            "role": "authenticated"
        }

    supabase = get_supabase()
    
    try:
        # Supabase-py's auth.get_user(token) verifies the JWT signature
        user_response = supabase.auth.get_user(credentials)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_response.user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
