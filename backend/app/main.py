from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.routers import distributors, sales, inventory, regions, recommendations, promos, auth, escalations, notifications

app = FastAPI(
    title="Executive Distribution Control Tower",
    description="MITL Smart Recommendation Engine for FMCG Distribution",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PUBLIC_PATHS = {"/health", "/api/login", "/docs", "/openapi.json", "/redoc"}

security = HTTPBearer(auto_error=False)


@app.middleware("http")
async def auth_middleware(request, call_next):
    if request.url.path in PUBLIC_PATHS or request.url.path.startswith("/api/login"):
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Not authenticated"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("sub") is None:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=401, content={"detail": "Invalid token payload"})
    except JWTError:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    return await call_next(request)


app.include_router(distributors.router)
app.include_router(sales.router)
app.include_router(inventory.router)
app.include_router(regions.router)
app.include_router(recommendations.router)
app.include_router(promos.router)
app.include_router(auth.router)
app.include_router(escalations.router)
app.include_router(notifications.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
