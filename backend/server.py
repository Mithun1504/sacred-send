from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
class ChecklistRequest(BaseModel):
    location: Optional[str] = None
    place_of_death: str  # "hospital" | "home" | "other"
    religion: Optional[str] = None  # "hindu" | "muslim" | "christian" | "sikh" | "secular" | None


class TaskDoc(BaseModel):
    id: str
    phase: str  # "right_now" | "today" | "next_few_days" | "next_few_weeks"
    title: str
    short_label: str
    icon: str
    why: str
    documents: List[str] = []
    contacts: List[str] = []  # contact category ids
    religion_note: Optional[str] = None


class Contact(BaseModel):
    id: str
    name: str
    role: str
    category: str
    phone: str
    day_one_only: bool = False


class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    code: str


class VaultUpload(BaseModel):
    session_id: str
    doc_type: str  # aadhaar | id_proof | insurance | hospital
    filename: str
    data_base64: str


# ---------------- Task Templates ----------------
def build_tasks(place: str, religion: Optional[str]) -> List[Dict[str, Any]]:
    r = (religion or "secular").lower()

    religion_rite = {
        "hindu": {
            "title": "Arrange priest for last rites",
            "why": "A pandit will guide the family through the antim sanskar (final rites) and mantras at the cremation ground. Booking early ensures the family can perform rites at the right muhurta.",
        },
        "muslim": {
            "title": "Contact imam for Ghusl and Janazah",
            "why": "In Islamic tradition, burial is done as soon as possible, usually within 24 hours. The imam will help arrange Ghusl (ritual washing), Kafan (shrouding), and Janazah prayer.",
        },
        "christian": {
            "title": "Contact priest for last rites and funeral",
            "why": "The parish priest will arrange the funeral service, prayers, and burial or cremation according to your denomination's tradition.",
        },
        "sikh": {
            "title": "Arrange Granthi and Antim Ardas",
            "why": "A Granthi from the local Gurdwara will help with the Antim Ardas (final prayer) and reading of the Kirtan Sohila. Cremation is preferred within a day.",
        },
        "secular": {
            "title": "Choose a farewell for your family",
            "why": "You can hold a simple, non-religious farewell — a moment of silence, favorite music, or shared memories. There is no right or wrong way.",
        },
    }[r]

    hospital_only = place == "hospital"

    tasks: List[Dict[str, Any]] = []

    # RIGHT NOW ------------------------------
    if hospital_only:
        tasks.append({
            "id": "hosp-declaration",
            "phase": "right_now",
            "title": "Get the medical certificate of death",
            "short_label": "Medical death certificate",
            "icon": "file-text",
            "why": "The hospital will issue a medical certificate of cause of death (Form 4). You will need this original document for all further steps — the death certificate, insurance, and bank claims.",
            "documents": ["hospital"],
            "contacts": ["hospital_admin"],
        })
        tasks.append({
            "id": "hosp-discharge",
            "phase": "right_now",
            "title": "Complete hospital discharge",
            "short_label": "Hospital discharge",
            "icon": "clipboard",
            "why": "Ask the ward nurse or admin desk for the discharge summary and bill settlement. Once done, the body can be moved to the mortuary or transported home.",
            "documents": ["id_proof"],
            "contacts": ["hospital_admin"],
        })
    else:
        tasks.append({
            "id": "home-doctor",
            "phase": "right_now",
            "title": "Call a doctor to confirm the passing",
            "short_label": "Call doctor to confirm",
            "icon": "user-check",
            "why": "A registered doctor needs to examine and confirm the death. They will note the time and cause, which is needed for the death certificate. Most family doctors or local clinics offer home visits.",
            "documents": [],
            "contacts": ["ambulance"],
        })

    tasks.append({
        "id": "transport",
        "phase": "right_now",
        "title": "Arrange transport (hearse or ambulance)",
        "short_label": "Arrange transport",
        "icon": "truck",
        "why": "You will need a hearse van or funeral ambulance to move the body — from hospital to home, or home to the cremation/burial ground. Many services are available 24 hours.",
        "documents": [],
        "contacts": ["ambulance", "mortuary"],
    })

    tasks.append({
        "id": "inform-family",
        "phase": "right_now",
        "title": "Let close family know",
        "short_label": "Inform close family",
        "icon": "users",
        "why": "You don't have to call everyone yourself. Use the family share sheet to send one calm, factual message to the family group — others can help spread the word.",
        "documents": [],
        "contacts": [],
    })

    # TODAY ------------------------------
    tasks.append({
        "id": "rites",
        "phase": "today",
        "title": religion_rite["title"],
        "short_label": religion_rite["title"],
        "icon": "heart",
        "why": religion_rite["why"],
        "documents": [],
        "contacts": ["priest"],
    })

    tasks.append({
        "id": "cremation-booking",
        "phase": "today",
        "title": "Book cremation or burial slot",
        "short_label": "Book cremation slot",
        "icon": "calendar",
        "why": "Contact the cremation ground or burial site to book a time slot. In many cities you can choose between traditional wood or electric cremation — electric is faster and lower cost.",
        "documents": ["hospital", "id_proof"],
        "contacts": ["cremation"],
    })

    # NEXT FEW DAYS ------------------------------
    tasks.append({
        "id": "death-certificate",
        "phase": "next_few_days",
        "title": "Apply for the death certificate",
        "short_label": "Death certificate",
        "icon": "file-text",
        "why": "This is the legal document needed for insurance claims, bank accounts, property, and pensions. Apply at your local municipal corporation office (or gram panchayat in rural areas). Registration is free within 21 days.",
        "documents": ["hospital", "aadhaar", "id_proof"],
        "contacts": ["certificate_office"],
    })

    tasks.append({
        "id": "ashes",
        "phase": "next_few_days",
        "title": "Collect ashes or urn",
        "short_label": "Collect ashes",
        "icon": "package",
        "why": "Ashes are usually available 24 to 48 hours after cremation. You can carry them home in a simple urn — the cremation ground will provide one, or you can bring your own.",
        "documents": [],
        "contacts": ["cremation"],
    })

    # NEXT FEW WEEKS ------------------------------
    tasks.append({
        "id": "certificate-collect",
        "phase": "next_few_weeks",
        "title": "Collect the death certificate",
        "short_label": "Collect certificate",
        "icon": "file-text",
        "why": "The certificate is usually ready in 7 to 21 days. Collect a few original copies — you will need one for each bank, insurance company, and government office.",
        "documents": [],
        "contacts": ["certificate_office"],
    })

    tasks.append({
        "id": "insurance",
        "phase": "next_few_weeks",
        "title": "Start the insurance claim",
        "short_label": "Insurance claim",
        "icon": "shield",
        "why": "Contact each insurance company (life, health, motor). You will need the death certificate, policy documents, and a claim form. Most companies allow online claim submission.",
        "documents": ["insurance", "hospital"],
        "contacts": ["insurance"],
    })

    tasks.append({
        "id": "bank",
        "phase": "next_few_weeks",
        "title": "Notify banks and update accounts",
        "short_label": "Notify banks",
        "icon": "credit-card",
        "why": "Inform banks to freeze accounts, transfer joint holdings, and claim nominee funds. Carry the death certificate, the deceased's ID, and your ID.",
        "documents": ["id_proof", "aadhaar"],
        "contacts": ["insurance"],
    })

    tasks.append({
        "id": "utilities",
        "phase": "next_few_weeks",
        "title": "Update utilities and subscriptions",
        "short_label": "Utilities & subscriptions",
        "icon": "zap",
        "why": "Transfer or close electricity, gas, phone, and internet accounts. Cancel any monthly subscriptions. You can do most of this online now.",
        "documents": ["id_proof"],
        "contacts": [],
    })

    return tasks


CONTACT_TEMPLATES: List[Dict[str, Any]] = [
    {"id": "ambulance", "name": "Ambulance / Doctor on call", "role": "Emergency medical", "category": "ambulance", "phone": "102", "day_one_only": False},
    {"id": "mortuary", "name": "Mortuary transport", "role": "Hearse / body transport", "category": "transport", "phone": "1099", "day_one_only": False},
    {"id": "cremation", "name": "Cremation ground office", "role": "Booking & timings", "category": "cremation", "phone": "1912", "day_one_only": False},
    {"id": "priest_hindu", "name": "Pandit (Hindu rites)", "role": "Last rites & mantras", "category": "priest", "phone": "1800111222", "day_one_only": False},
    {"id": "priest_muslim", "name": "Imam (Muslim rites)", "role": "Ghusl & Janazah", "category": "priest", "phone": "1800111333", "day_one_only": False},
    {"id": "priest_christian", "name": "Parish priest", "role": "Funeral service", "category": "priest", "phone": "1800111444", "day_one_only": False},
    {"id": "priest_sikh", "name": "Granthi (Sikh rites)", "role": "Antim Ardas", "category": "priest", "phone": "1800111555", "day_one_only": False},
    {"id": "certificate_office", "name": "Municipal / Panchayat office", "role": "Death certificate", "category": "certificate", "phone": "1077", "day_one_only": False},
    {"id": "hospital_admin", "name": "Hospital admin desk", "role": "Medical certificate", "category": "hospital", "phone": "104", "day_one_only": False},
    {"id": "insurance", "name": "Insurance helpline (IRDAI)", "role": "Claims guidance", "category": "insurance", "phone": "18004254732", "day_one_only": True},
]


def contacts_for(religion: Optional[str], day: int = 0) -> List[Dict[str, Any]]:
    r = (religion or "secular").lower()
    priest_map = {
        "hindu": "priest_hindu",
        "muslim": "priest_muslim",
        "christian": "priest_christian",
        "sikh": "priest_sikh",
    }
    result = []
    for c in CONTACT_TEMPLATES:
        if c["category"] == "priest":
            # only include the priest for chosen religion (or none for secular)
            if r in priest_map and c["id"] == priest_map[r]:
                result.append(c)
            continue
        if c.get("day_one_only") and day < 1:
            continue
        result.append(c)
    return result


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Emergency Planner API"}


@api_router.post("/checklist")
async def get_checklist(req: ChecklistRequest):
    tasks = build_tasks(req.place_of_death, req.religion)
    return {"tasks": tasks}


@api_router.get("/contacts")
async def get_contacts(religion: Optional[str] = None, day: int = 0):
    return {"contacts": contacts_for(religion, day)}


# ------ Mock OTP ------
@api_router.post("/otp/send")
async def send_otp(req: OTPRequest):
    # Mock — always "sent". Fixed code 123456.
    await db.otp_log.insert_one({
        "id": str(uuid.uuid4()),
        "phone": req.phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "mock_code": "123456", "message": "OTP sent (mock). Use 123456."}


@api_router.post("/otp/verify")
async def verify_otp(req: OTPVerify):
    if req.code.strip() == "123456":
        session_id = str(uuid.uuid4())
        return {"success": True, "session_id": session_id}
    raise HTTPException(status_code=400, detail="Invalid code")


# ------ Vault ------
@api_router.post("/vault/upload")
async def vault_upload(req: VaultUpload):
    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "session_id": req.session_id,
        "doc_type": req.doc_type,
        "filename": req.filename,
        "data_base64": req.data_base64,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.vault_docs.insert_one(doc)
    return {"success": True, "id": doc_id}


@api_router.get("/vault/{session_id}")
async def vault_list(session_id: str):
    cursor = db.vault_docs.find({"session_id": session_id}, {"_id": 0, "data_base64": 0})
    items = await cursor.to_list(100)
    return {"documents": items}


@api_router.delete("/vault/{doc_id}")
async def vault_delete(doc_id: str):
    await db.vault_docs.delete_one({"id": doc_id})
    return {"success": True}


# ------ Share message ------
class ShareRequest(BaseModel):
    name: Optional[str] = None
    time: Optional[str] = None
    place: Optional[str] = None
    language: str = "en"


@api_router.post("/share/message")
async def share_message(req: ShareRequest):
    name = req.name or "our family"
    time = req.time or "soon"
    place = req.place or "the local cremation ground"
    templates = {
        "en": f"Update from {name}: The cremation is arranged for {time} at {place}. The death certificate is in process. We will share more details soon. Thank you for your love and support.",
        "hi": f"{name} की ओर से सूचना: अंतिम संस्कार {time} पर {place} में होगा। मृत्यु प्रमाण पत्र की प्रक्रिया जारी है। जल्द ही और जानकारी साझा करेंगे। आपके प्रेम और समर्थन के लिए धन्यवाद।",
        "ta": f"{name} இருந்து செய்தி: இறுதிச் சடங்கு {time} மணிக்கு {place} இல் நடக்கும். மரணச் சான்றிதழ் செயல்பாட்டில் உள்ளது. விரைவில் மேலும் விவரங்களைப் பகிர்வோம். உங்கள் அன்பிற்கும் ஆதரவிற்கும் நன்றி.",
    }
    msg = templates.get(req.language, templates["en"])
    return {"message": msg}


app.include_router(api_router)

_cors_origins = os.environ.get("CORS_ORIGINS", "*")
_allow_origins = [o.strip() for o in _cors_origins.split(",")] if _cors_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
