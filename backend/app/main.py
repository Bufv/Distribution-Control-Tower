from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import distributors, sales, inventory, regions, recommendations, promos

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

app.include_router(distributors.router)
app.include_router(sales.router)
app.include_router(inventory.router)
app.include_router(regions.router)
app.include_router(recommendations.router)
app.include_router(promos.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
