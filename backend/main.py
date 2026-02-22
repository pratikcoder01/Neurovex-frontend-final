from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from core.config import get_settings
from routers import stream, session, analytics

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Medical-Grade BCI Backend for Neurovex. Handles EEG processing, safety checks, and data storage."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(stream.router, tags=["Real-time Stream"])
app.include_router(session.router, prefix="/api/v1", tags=["Sessions"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])

@app.get("/")
async def root():
    return {
        "message": "Neurovex Medical-Grade Backend is Online", 
        "system_status": "nominal",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "neurovex-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
