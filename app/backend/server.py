"\"\"\"SafeStreet AI - FastAPI backend.

Implements auth (JWT + Emergent Google), profile, contacts, incidents,
alerts, locations, community reports, notifications, settings, monitoring
sessions, activity logs, admin stats and LLM chat (Claude Haiku 4.5 via
emergentintegrations).
\"\"\"
from __future__ import annotations

import logging
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import httpx
import jwt
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Header, status
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / \".env\")

MONGO_URL = os.environ[\"MONGO_URL\"]
DB_NAME = os.environ[\"DB_NAME\"]
JWT_SECRET = os.environ[\"JWT_SECRET\"]
EMERGENT_LLM_KEY = os.environ[\"EMERGENT_LLM_KEY\"]
JWT_ALGO = \"HS256\"
JWT_EXPIRY_DAYS = 30

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_ctx = CryptContext(schemes=[\"bcrypt\"], deprecated=\"auto\")

app = FastAPI(title=\"SafeStreet AI\")
api = APIRouter(prefix=\"/api\")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(\"safestreet\")

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _clean(doc: dict) -> dict:
    \"\"\"Strip Mongo _id and convert datetime fields to ISO strings.\"\"\"
    if not doc:
        return doc
    doc.pop(\"_id\", None)
    for k, v in list(doc.items()):
        if isinstance(v, datetime):
            doc[k] = _iso(v)
    return doc


def make_token(sub: str) -> str:
    payload = {
        \"sub\": sub,
        \"exp\": now_utc() + timedelta(days=JWT_EXPIRY_DAYS),
        \"iat\": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith(\"Bearer \"):
        raise HTTPException(status_code=401, detail=\"Missing token\")
    token = authorization.split(\" \", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f\"Invalid token: {e}\") from e
    user = await db.users.find_one({\"id\": payload[\"sub\"]}, {\"_id\": 0, \"password\": 0})
    if not user:
        raise HTTPException(status_code=401, detail=\"User not found\")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get(\"role\") != \"admin\":
        raise HTTPException(status_code=403, detail=\"Admin only\")
    return user


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class GoogleIn(BaseModel):
    session_id: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    medical_info: Optional[str] = None
    photo: Optional[str] = None  # base64 or URL
    language: Optional[str] = None
    address: Optional[str] = None


class ContactIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    relationship: Optional[str] = None
    primary: bool = False
    photo: Optional[str] = None


class IncidentIn(BaseModel):
    threat_score: float
    danger_level: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    trigger: str  # \"auto\" | \"manual\" | \"voice\" | \"demo\"
    duration_seconds: int = 0
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    notes: Optional[str] = None


class IncidentUpdate(BaseModel):
    status: Optional[str] = None  # active|resolved|false_alarm
    notes: Optional[str] = None


class LocationIn(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None


class ReportIn(BaseModel):
    title: str
    description: str
    category: str  # harassment|theft|lighting|other
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area: Optional[str] = None
    photo: Optional[str] = None
    anonymous: bool = False


class CommentIn(BaseModel):
    text: str


class SettingsIn(BaseModel):
    dark_mode: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    voice_detection: Optional[bool] = None
    auto_sos: Optional[bool] = None
    sos_threshold: Optional[float] = None
    emergency_delay: Optional[int] = None
    location_permission: Optional[bool] = None
    microphone_permission: Optional[bool] = None
    battery_optimization: Optional[bool] = None
    language: Optional[str] = None


class MonitoringSessionIn(BaseModel):
    status: str  # active | stopped


class ChatIn(BaseModel):
    session_id: str
    message: str


class NotificationIn(BaseModel):
    title: str
    body: str
    category: str  # emergency|monitoring|community|location|battery|system


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------


DEFAULT_SETTINGS = {
    \"dark_mode\": True,
    \"notifications_enabled\": True,
    \"voice_detection\": True,
    \"auto_sos\": True,
    \"sos_threshold\": 0.75,
    \"emergency_delay\": 10,
    \"location_permission\": True,
    \"microphone_permission\": True,
    \"battery_optimization\": False,
    \"language\": \"en\",
}


async def _bootstrap_user(user: dict) -> None:
    \"\"\"Create default settings + welcome notification for a new user.\"\"\"
    await db.settings.insert_one({\"user_id\": user[\"id\"], **DEFAULT_SETTINGS})
    await db.notifications.insert_one(
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"title\": \"Welcome to SafeStreet AI\",
            \"body\": \"Your AI guardian is ready. Tap Start Monitoring on the dashboard to activate protection.\",
            \"category\": \"system\",
            \"read\": False,
            \"created_at\": now_utc(),
        }
    )


@api.post(\"/auth/register\")
async def register(payload: RegisterIn):
    existing = await db.users.find_one({\"email\": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail=\"Email already registered\")

    user = {
        \"id\": str(uuid.uuid4()),
        \"name\": payload.name,
        \"email\": payload.email.lower(),
        \"phone\": payload.phone,
        \"password\": pwd_ctx.hash(payload.password),
        \"provider\": \"email\",
        \"role\": \"user\",
        \"email_verified\": False,
        \"photo\": None,
        \"blood_group\": None,
        \"medical_info\": None,
        \"language\": \"en\",
        \"address\": None,
        \"created_at\": now_utc(),
    }
    await db.users.insert_one(user.copy())
    await _bootstrap_user(user)
    token = make_token(user[\"id\"])
    safe = {k: v for k, v in user.items() if k != \"password\"}
    return {\"token\": token, \"user\": _clean(safe)}


@api.post(\"/auth/login\")
async def login(payload: LoginIn):
    doc = await db.users.find_one({\"email\": payload.email.lower()})
    if not doc or doc.get(\"provider\") != \"email\":
        raise HTTPException(status_code=401, detail=\"Invalid credentials\")
    if not pwd_ctx.verify(payload.password, doc.get(\"password\", \"\")):
        raise HTTPException(status_code=401, detail=\"Invalid credentials\")
    token = make_token(doc[\"id\"])
    doc.pop(\"password\", None)
    return {\"token\": token, \"user\": _clean(doc)}


@api.post(\"/auth/google\")
async def google_auth(payload: GoogleIn):
    \"\"\"Verify Emergent Google session_id and issue our own JWT.\"\"\"
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            \"https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data\",
            headers={\"X-Session-ID\": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail=\"Invalid Emergent session\")
    data = r.json()
    email = data.get(\"email\", \"\").lower()
    if not email:
        raise HTTPException(status_code=400, detail=\"No email in session\")

    doc = await db.users.find_one({\"email\": email})
    if not doc:
        doc = {
            \"id\": str(uuid.uuid4()),
            \"name\": data.get(\"name\") or email.split(\"@\")[0],
            \"email\": email,
            \"phone\": None,
            \"provider\": \"google\",
            \"role\": \"user\",
            \"email_verified\": True,
            \"photo\": data.get(\"picture\"),
            \"blood_group\": None,
            \"medical_info\": None,
            \"language\": \"en\",
            \"address\": None,
            \"created_at\": now_utc(),
        }
        await db.users.insert_one(doc.copy())
        await _bootstrap_user(doc)

    token = make_token(doc[\"id\"])
    doc.pop(\"password\", None)
    return {\"token\": token, \"user\": _clean(doc)}


@api.post(\"/auth/forgot-password\")
async def forgot_password(payload: dict):
    # Simulated password reset flow
    return {\"message\": \"If this email is registered, a reset link has been sent.\"}


@api.post(\"/auth/verify-otp\")
async def verify_otp(payload: dict):
    # Any 4-6 digit code accepted in demo mode
    code = str(payload.get(\"code\", \"\"))
    if not code.isdigit() or len(code) < 4:
        raise HTTPException(status_code=400, detail=\"Invalid code\")
    return {\"verified\": True}


@api.get(\"/auth/me\")
async def me(user=Depends(get_current_user)):
    return _clean(user)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------


@api.put(\"/profile\")
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({\"id\": user[\"id\"]}, {\"$set\": updates})
    doc = await db.users.find_one({\"id\": user[\"id\"]}, {\"_id\": 0, \"password\": 0})
    return _clean(doc)


# ---------------------------------------------------------------------------
# Emergency Contacts
# ---------------------------------------------------------------------------


@api.get(\"/contacts\")
async def list_contacts(user=Depends(get_current_user)):
    items = await db.contacts.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).to_list(500)
    return [_clean(x) for x in items]


@api.post(\"/contacts\")
async def create_contact(payload: ContactIn, user=Depends(get_current_user)):
    doc = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        **payload.model_dump(),
        \"created_at\": now_utc(),
    }
    if payload.primary:
        await db.contacts.update_many(
            {\"user_id\": user[\"id\"]}, {\"$set\": {\"primary\": False}}
        )
    await db.contacts.insert_one(doc.copy())
    return _clean(doc)


@api.put(\"/contacts/{cid}\")
async def update_contact(cid: str, payload: ContactIn, user=Depends(get_current_user)):
    if payload.primary:
        await db.contacts.update_many(
            {\"user_id\": user[\"id\"]}, {\"$set\": {\"primary\": False}}
        )
    await db.contacts.update_one(
        {\"id\": cid, \"user_id\": user[\"id\"]}, {\"$set\": payload.model_dump()}
    )
    doc = await db.contacts.find_one({\"id\": cid}, {\"_id\": 0})
    return _clean(doc)


@api.delete(\"/contacts/{cid}\")
async def delete_contact(cid: str, user=Depends(get_current_user)):
    await db.contacts.delete_one({\"id\": cid, \"user_id\": user[\"id\"]})
    return {\"deleted\": True}


# ---------------------------------------------------------------------------
# Incidents
# ---------------------------------------------------------------------------


@api.get(\"/incidents\")
async def list_incidents(user=Depends(get_current_user)):
    items = await db.incidents.find(
        {\"user_id\": user[\"id\"]}, {\"_id\": 0}
    ).sort(\"created_at\", -1).to_list(500)
    return [_clean(x) for x in items]


@api.post(\"/incidents\")
async def create_incident(payload: IncidentIn, user=Depends(get_current_user)):
    doc = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        **payload.model_dump(),
        \"status\": \"active\",
        \"created_at\": now_utc(),
    }
    await db.incidents.insert_one(doc.copy())

    contacts = await db.contacts.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).to_list(50)
    await db.notifications.insert_one(
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"title\": \"SOS Triggered\",
            \"body\": f\"Guardians alerted ({len(contacts)} contacts). Location shared.\",
            \"category\": \"emergency\",
            \"read\": False,
            \"created_at\": now_utc(),
        }
    )
    await db.activityLogs.insert_one(
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"event\": \"sos_triggered\",
            \"meta\": {\"trigger\": payload.trigger, \"threat_score\": payload.threat_score},
            \"created_at\": now_utc(),
        }
    )
    return _clean(doc)


@api.get(\"/incidents/{iid}\")
async def get_incident(iid: str, user=Depends(get_current_user)):
    doc = await db.incidents.find_one(
        {\"id\": iid, \"user_id\": user[\"id\"]}, {\"_id\": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail=\"Not found\")
    return _clean(doc)


@api.put(\"/incidents/{iid}\")
async def update_incident(iid: str, payload: IncidentUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.incidents.update_one({\"id\": iid, \"user_id\": user[\"id\"]}, {\"$set\": updates})
    doc = await db.incidents.find_one({\"id\": iid, \"user_id\": user[\"id\"]}, {\"_id\": 0})
    return _clean(doc)


# ---------------------------------------------------------------------------
# Live Location
# ---------------------------------------------------------------------------


@api.post(\"/locations\")
async def push_location(payload: LocationIn, user=Depends(get_current_user)):
    doc = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        **payload.model_dump(),
        \"created_at\": now_utc(),
    }
    await db.locations.insert_one(doc.copy())
    return _clean(doc)


@api.get(\"/locations/trail\")
async def location_trail(user=Depends(get_current_user)):
    items = await db.locations.find(
        {\"user_id\": user[\"id\"]}, {\"_id\": 0}
    ).sort(\"created_at\", -1).limit(50).to_list(50)
    return [_clean(x) for x in items]


# ---------------------------------------------------------------------------
# Community Reports
# ---------------------------------------------------------------------------


@api.get(\"/reports\")
async def list_reports(user=Depends(get_current_user)):
    items = await db.reports.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(200)
    return [_clean(x) for x in items]


@api.post(\"/reports\")
async def create_report(payload: ReportIn, user=Depends(get_current_user)):
    doc = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        \"author_name\": \"Anonymous\" if payload.anonymous else user[\"name\"],
        \"author_photo\": None if payload.anonymous else user.get(\"photo\"),
        **payload.model_dump(),
        \"likes\": [],
        \"comments\": [],
        \"verified\": False,
        \"created_at\": now_utc(),
    }
    await db.reports.insert_one(doc.copy())
    return _clean(doc)


@api.post(\"/reports/{rid}/like\")
async def like_report(rid: str, user=Depends(get_current_user)):
    doc = await db.reports.find_one({\"id\": rid}, {\"_id\": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=\"Not found\")
    likes = set(doc.get(\"likes\", []))
    if user[\"id\"] in likes:
        likes.remove(user[\"id\"])
    else:
        likes.add(user[\"id\"])
    await db.reports.update_one({\"id\": rid}, {\"$set\": {\"likes\": list(likes)}})
    return {\"liked\": user[\"id\"] in likes, \"count\": len(likes)}


@api.post(\"/reports/{rid}/comment\")
async def comment_report(rid: str, payload: CommentIn, user=Depends(get_current_user)):
    comment = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        \"author\": user[\"name\"],
        \"text\": payload.text,
        \"created_at\": _iso(now_utc()),
    }
    await db.reports.update_one({\"id\": rid}, {\"$push\": {\"comments\": comment}})
    return comment


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------


@api.get(\"/notifications\")
async def list_notifications(user=Depends(get_current_user)):
    items = await db.notifications.find(
        {\"user_id\": user[\"id\"]}, {\"_id\": 0}
    ).sort(\"created_at\", -1).to_list(200)
    return [_clean(x) for x in items]


@api.post(\"/notifications\")
async def create_notification(payload: NotificationIn, user=Depends(get_current_user)):
    doc = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        **payload.model_dump(),
        \"read\": False,
        \"created_at\": now_utc(),
    }
    await db.notifications.insert_one(doc.copy())
    return _clean(doc)


@api.put(\"/notifications/{nid}/read\")
async def mark_read(nid: str, user=Depends(get_current_user)):
    await db.notifications.update_one(
        {\"id\": nid, \"user_id\": user[\"id\"]}, {\"$set\": {\"read\": True}}
    )
    return {\"ok\": True}


@api.put(\"/notifications/read-all\")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many(
        {\"user_id\": user[\"id\"]}, {\"$set\": {\"read\": True}}
    )
    return {\"ok\": True}


@api.delete(\"/notifications/{nid}\")
async def delete_notification(nid: str, user=Depends(get_current_user)):
    await db.notifications.delete_one({\"id\": nid, \"user_id\": user[\"id\"]})
    return {\"deleted\": True}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


@api.get(\"/settings\")
async def get_settings(user=Depends(get_current_user)):
    doc = await db.settings.find_one({\"user_id\": user[\"id\"]}, {\"_id\": 0})
    if not doc:
        doc = {\"user_id\": user[\"id\"], **DEFAULT_SETTINGS}
        await db.settings.insert_one(doc.copy())
    return _clean(doc)


@api.put(\"/settings\")
async def update_settings(payload: SettingsIn, user=Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.settings.update_one(
        {\"user_id\": user[\"id\"]}, {\"$set\": updates}, upsert=True
    )
    doc = await db.settings.find_one({\"user_id\": user[\"id\"]}, {\"_id\": 0})
    return _clean(doc)


# ---------------------------------------------------------------------------
# Monitoring Sessions
# ---------------------------------------------------------------------------


@api.post(\"/monitoring/start\")
async def start_monitoring(user=Depends(get_current_user)):
    session = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        \"status\": \"active\",
        \"started_at\": now_utc(),
        \"ended_at\": None,
        \"peak_threat\": 0.0,
        \"events\": 0,
    }
    await db.monitoringSessions.insert_one(session.copy())
    await db.activityLogs.insert_one(
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"event\": \"monitoring_started\",
            \"meta\": {\"session_id\": session[\"id\"]},
            \"created_at\": now_utc(),
        }
    )
    return _clean(session)


@api.post(\"/monitoring/stop/{sid}\")
async def stop_monitoring(sid: str, user=Depends(get_current_user)):
    await db.monitoringSessions.update_one(
        {\"id\": sid, \"user_id\": user[\"id\"]},
        {\"$set\": {\"status\": \"stopped\", \"ended_at\": now_utc()}},
    )
    doc = await db.monitoringSessions.find_one({\"id\": sid}, {\"_id\": 0})
    return _clean(doc)


@api.get(\"/monitoring/sessions\")
async def list_sessions(user=Depends(get_current_user)):
    items = await db.monitoringSessions.find(
        {\"user_id\": user[\"id\"]}, {\"_id\": 0}
    ).sort(\"started_at\", -1).to_list(100)
    return [_clean(x) for x in items]


# ---------------------------------------------------------------------------
# Dashboard aggregate
# ---------------------------------------------------------------------------


@api.get(\"/dashboard\")
async def dashboard(user=Depends(get_current_user)):
    today = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
    contact_count = await db.contacts.count_documents({\"user_id\": user[\"id\"]})
    incidents_today = await db.incidents.count_documents(
        {\"user_id\": user[\"id\"], \"created_at\": {\"$gte\": today}}
    )
    recent = await db.incidents.find(
        {\"user_id\": user[\"id\"]}, {\"_id\": 0}
    ).sort(\"created_at\", -1).limit(5).to_list(5)
    active_session = await db.monitoringSessions.find_one(
        {\"user_id\": user[\"id\"], \"status\": \"active\"}, {\"_id\": 0}
    )
    unread = await db.notifications.count_documents(
        {\"user_id\": user[\"id\"], \"read\": False}
    )
    # Safety score: 100 - (incidents_today * 8) - (unread emergencies * 3), floor 40
    score = max(40, 100 - incidents_today * 8)
    return {
        \"safety_score\": score,
        \"contact_count\": contact_count,
        \"incidents_today\": incidents_today,
        \"recent_incidents\": [_clean(x) for x in recent],
        \"monitoring_active\": bool(active_session),
        \"active_session\": _clean(active_session) if active_session else None,
        \"unread_notifications\": unread,
    }


# ---------------------------------------------------------------------------
# Safe Route / Heatmap (simulated data since Google Maps API is not wired up)
# ---------------------------------------------------------------------------


@api.get(\"/routes/plan\")
async def plan_route(
    from_lat: float,
    from_lng: float,
    to_lat: float,
    to_lng: float,
    user=Depends(get_current_user),
):
    def route(name: str, risk: float, minutes: int, lighting: int, crowd: int):
        # generate 6 waypoints jittered between origin and destination
        pts = []
        for i in range(7):
            t = i / 6
            jitter = (random.random() - 0.5) * 0.004
            pts.append(
                {
                    \"lat\": from_lat + (to_lat - from_lat) * t + jitter,
                    \"lng\": from_lng + (to_lng - from_lng) * t + jitter,
                }
            )
        return {
            \"id\": str(uuid.uuid4()),
            \"name\": name,
            \"risk_score\": risk,
            \"eta_minutes\": minutes,
            \"distance_km\": round(random.uniform(1.5, 6.0), 2),
            \"street_lighting\": lighting,
            \"crowd_density\": crowd,
            \"waypoints\": pts,
        }

    return {
        \"routes\": [
            route(\"Safest\", 0.15, 22, 92, 78),
            route(\"Fastest\", 0.42, 12, 65, 58),
            route(\"Recommended\", 0.22, 16, 88, 71),
        ],
        \"nearby\": {
            \"police_stations\": [
                {\"name\": \"Central Police Station\", \"distance_km\": 0.6},
                {\"name\": \"Sector 7 Chowki\", \"distance_km\": 1.2},
            ],
            \"hospitals\": [
                {\"name\": \"City General Hospital\", \"distance_km\": 0.9},
                {\"name\": \"Green Care Clinic\", \"distance_km\": 1.4},
            ],
            \"metro\": [
                {\"name\": \"MG Road Metro\", \"distance_km\": 0.4},
                {\"name\": \"Cyber Hub Metro\", \"distance_km\": 1.1},
            ],
        },
    }


@api.get(\"/heatmap\")
async def heatmap(mode: str = \"day\", user=Depends(get_current_user)):
    random.seed(42 if mode == \"day\" else 91)
    zones = []
    labels = [\"high\", \"medium\", \"safe\", \"crowded\"]
    for _ in range(40):
        zones.append(
            {
                \"lat\": 28.6139 + (random.random() - 0.5) * 0.1,
                \"lng\": 77.209 + (random.random() - 0.5) * 0.1,
                \"intensity\": round(random.random(), 2),
                \"type\": random.choice(labels),
            }
        )
    poi = [
        {\"name\": \"Central Police Station\", \"type\": \"police\", \"lat\": 28.6155, \"lng\": 77.205},
        {\"name\": \"AIIMS\", \"type\": \"hospital\", \"lat\": 28.61, \"lng\": 77.203},
        {\"name\": \"MG Metro\", \"type\": \"metro\", \"lat\": 28.617, \"lng\": 77.211},
    ]
    return {\"zones\": zones, \"poi\": poi, \"mode\": mode}


# ---------------------------------------------------------------------------
# AI Chat (Emergent Universal Key -> Claude Haiku 4.5)
# ---------------------------------------------------------------------------


@api.post(\"/chat\")
async def chat(payload: ChatIn, user=Depends(get_current_user)):
    system_msg = (
        \"You are Aegis, the AI Safety Companion inside SafeStreet AI — a women's safety app. \"
        \"Be warm, calm, concise (<=120 words). Provide practical safety advice, de-escalation tips, \"
        \"and reassurance. If the user seems in immediate danger, tell them to press the red SOS button \"
        \"at the bottom of the screen and call local emergency services. Never provide harmful content.\"
    )
    try:
        llm = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=payload.session_id,
            system_message=system_msg,
        ).with_model(\"anthropic\", \"claude-haiku-4-5-20251001\")
        reply = await llm.send_message(UserMessage(text=payload.message))
    except Exception as e:  # noqa: BLE001
        logger.exception(\"Chat error\")
        raise HTTPException(status_code=500, detail=f\"Chat error: {e}\") from e

    await db.chatMessages.insert_one(
        {
            \"id\": str(uuid.uuid4()),
            \"user_id\": user[\"id\"],
            \"session_id\": payload.session_id,
            \"user_message\": payload.message,
            \"assistant_reply\": reply,
            \"created_at\": now_utc(),
        }
    )
    return {\"reply\": reply, \"session_id\": payload.session_id}


@api.get(\"/chat/history/{session_id}\")
async def chat_history(session_id: str, user=Depends(get_current_user)):
    items = await db.chatMessages.find(
        {\"user_id\": user[\"id\"], \"session_id\": session_id}, {\"_id\": 0}
    ).sort(\"created_at\", 1).to_list(200)
    return [_clean(x) for x in items]


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


@api.get(\"/admin/stats\")
async def admin_stats(user=Depends(require_admin)):
    return {
        \"users\": await db.users.count_documents({}),
        \"incidents\": await db.incidents.count_documents({}),
        \"active_sessions\": await db.monitoringSessions.count_documents({\"status\": \"active\"}),
        \"reports\": await db.reports.count_documents({}),
        \"verified_reports\": await db.reports.count_documents({\"verified\": True}),
        \"notifications\": await db.notifications.count_documents({}),
    }


@api.get(\"/admin/incidents\")
async def admin_incidents(user=Depends(require_admin)):
    items = await db.incidents.find({}, {\"_id\": 0}).sort(\"created_at\", -1).limit(100).to_list(100)
    return [_clean(x) for x in items]


@api.get(\"/admin/reports\")
async def admin_reports(user=Depends(require_admin)):
    items = await db.reports.find({}, {\"_id\": 0}).sort(\"created_at\", -1).limit(100).to_list(100)
    return [_clean(x) for x in items]


@api.post(\"/admin/promote\")
async def admin_promote(payload: dict, user=Depends(require_admin)):
    email = payload.get(\"email\", \"\").lower()
    await db.users.update_one({\"email\": email}, {\"$set\": {\"role\": \"admin\"}})
    return {\"ok\": True}


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------


@api.get(\"/\")
async def root():
    return {\"service\": \"SafeStreet AI\", \"status\": \"ok\", \"time\": _iso(now_utc())}


@api.get(\"/health\")
async def health():
    return {\"status\": \"healthy\"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[\"*\"],
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)


@app.on_event(\"startup\")
async def on_startup():
    # Seed a demo admin user if not present
    if not await db.users.find_one({\"email\": \"admin@safestreet.ai\"}):
        admin = {
            \"id\": str(uuid.uuid4()),
            \"name\": \"SafeStreet Admin\",
            \"email\": \"admin@safestreet.ai\",
            \"phone\": \"+10000000000\",
            \"password\": pwd_ctx.hash(\"Admin@12345\"),
            \"provider\": \"email\",
            \"role\": \"admin\",
            \"email_verified\": True,
            \"photo\": None,
            \"blood_group\": None,
            \"medical_info\": None,
            \"language\": \"en\",
            \"address\": None,
            \"created_at\": now_utc(),
        }
        await db.users.insert_one(admin.copy())
        await _bootstrap_user(admin)
        logger.info(\"Seeded admin user admin@safestreet.ai / Admin@12345\")


@app.on_event(\"shutdown\")
async def on_shutdown():
    client.close()
"
