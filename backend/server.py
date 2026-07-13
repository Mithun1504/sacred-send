from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
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
    unexpected: bool = False


class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    code: str


class VaultUpload(BaseModel):
    session_id: str
    doc_type: str
    filename: str
    data_base64: str


# ---------------- Religion Content Table ----------------
# Verified national numbers only. Everything hyper-local uses maps_search.
POLICE = {"label": "Call police", "number": "100"}
UNIFIED = {"label": "Unified emergency", "number": "112"}
AMBULANCE_108 = {"label": "Ambulance", "number": "108"}
AMBULANCE_102 = {"label": "Ambulance", "number": "102"}
IRDAI_GRIEVANCE = {"label": "IRDAI grievance (only if insurer unresponsive)", "number": "155255"}
LIC_HELPLINE = {"label": "LIC helpline", "number": "1800-227-717"}
SENIOR_HELPLINE = {"label": "Senior citizens helpline", "number": "14567"}


RELIGION_CONTENT: Dict[str, Dict[str, Any]] = {
    "hindu": {
        "rites_title": "Contact a pandit for antim sanskar",
        "rites_why": "A pandit will guide the family through the antim sanskar (final rites) and mantras. Some families prefer the eldest son or closest relative to perform the rites with the pandit's guidance. Practices vary by community and region — confirm with your family or local temple.",
        "rites_search": "hindu temple pandit",
        "booking_title": "Book a cremation slot",
        "booking_why": "Cremation is customary, ideally within 24 hours. In most cities you can choose between a wood pyre or an electric/CNG crematorium — electric is faster and lower cost, and often more widely available in urban areas.",
        "booking_search": "cremation ground",
        "ashes": True,
        "ashes_title": "Collect the ashes (asthi)",
        "ashes_why": "Ashes are usually available 24 to 48 hours after cremation, from the crematorium. Many families later immerse them in a river — this can happen when you are ready, not immediately.",
        "urgency_note": None,
    },
    "muslim": {
        "rites_title": "Contact the local mosque or qabristan committee",
        "rites_why": "Ghusl (ritual washing) and kafan (shrouding) are done by trained community members, usually arranged through the local mosque or qabristan committee. Janazah (funeral prayer) is held at the mosque or graveyard before burial. Please note: burial is ideally done within 24 hours in most communities.",
        "rites_search": "mosque",
        "booking_title": "Contact the qabristan for a burial plot",
        "booking_why": "Burial (dafn) at a Muslim qabristan is customary and is ideally done as soon as possible — same day if it can be arranged. Contact the qabristan committee for the plot and timing.",
        "booking_search": "muslim qabristan graveyard",
        "ashes": False,
        "urgency_note": "In most Muslim communities, burial is expected within 24 hours. If you can, start on this within the first few hours.",
    },
    "christian": {
        "rites_title": "Contact the parish priest or pastor",
        "rites_why": "The parish priest or pastor will help arrange the funeral mass or service. Christian funerals are usually held 2 to 5 days after death, giving family time to travel. Practices vary by denomination.",
        "rites_search": "church parish",
        "booking_title": "Book burial or cremation",
        "booking_why": "Christian families choose burial or cremation based on family preference or denomination. If burial, contact a church-affiliated or municipal Christian cemetery for a plot. If cremation, book a municipal crematorium slot.",
        "booking_search": "christian cemetery",
        "ashes": False,
        "urgency_note": None,
    },
    "sikh": {
        "rites_title": "Contact the local Gurudwara",
        "rites_why": "The Granthi from the local Gurudwara will conduct the Antam Sanskar. Many families also arrange an Akhand Path or Sukhmani Sahib path in the days after. Timing is flexible but cremation is usually within a few days.",
        "rites_search": "gurudwara",
        "booking_title": "Book a cremation slot",
        "booking_why": "Cremation is customary in Sikh tradition. Book a slot at your nearest crematorium. Ashes are often later immersed in a river — that can happen when you are ready.",
        "booking_search": "cremation ground",
        "ashes": True,
        "ashes_title": "Collect the ashes",
        "ashes_why": "Ashes are usually available 24 to 48 hours after cremation. Many Sikh families later immerse them at a river or specific tirtha — this can happen when you are ready.",
        "urgency_note": None,
    },
    "secular": {
        "rites_title": "Choose a farewell for your family",
        "rites_why": "You can hold a simple, non-religious farewell — a moment of silence, favourite music, or shared memories. There is no right or wrong way to do this.",
        "rites_search": None,
        "booking_title": "Book cremation or burial",
        "booking_why": "Contact a municipal or private crematorium (usually cheaper via electric cremation) or a non-denominational cemetery for a burial plot.",
        "booking_search": "crematorium",
        "ashes": True,
        "ashes_title": "Collect the ashes",
        "ashes_why": "Ashes are usually available 24 to 48 hours after cremation. You can carry them home in a simple urn — the crematorium will provide one, or you can bring your own.",
        "urgency_note": None,
    },
}


def _rc(religion: Optional[str]) -> Dict[str, Any]:
    key = (religion or "secular").lower()
    return RELIGION_CONTENT.get(key, RELIGION_CONTENT["secular"])


def build_tasks(place: str, religion: Optional[str], unexpected: bool = False) -> List[Dict[str, Any]]:
    rc = _rc(religion)
    hospital = place == "hospital"
    home = place == "home"

    tasks: List[Dict[str, Any]] = []

    # ---------------- RIGHT NOW ----------------
    if unexpected:
        tasks.append({
            "id": "police-report",
            "phase": "right_now",
            "title": "Contact the police first",
            "short_label": "Contact police",
            "icon": "shield",
            "why": "If the death was sudden, accidental, unwitnessed, or in any way unclear, Indian law requires police to be informed before the body is moved. A post-mortem may be required. This protects the family legally and ensures a valid death certificate later.",
            "documents": [],
            "phones": [POLICE, UNIFIED],
            "maps_search": None,
        })

    if home:
        tasks.append({
            "id": "home-doctor",
            "phase": "right_now",
            "title": "Get a doctor to confirm the passing",
            "short_label": "Doctor confirmation",
            "icon": "user-check",
            "why": "A registered doctor needs to examine and confirm the death, and note the time and cause. This letter is what the local registrar will need in place of a hospital MCCD. Most family doctors, nearby clinics, or 108 will visit.",
            "documents": [],
            "phones": [AMBULANCE_108, UNIFIED],
            "maps_search": "clinic doctor",
        })

    if hospital:
        tasks.append({
            "id": "mccd",
            "phase": "right_now",
            "title": "Collect the Medical Certificate of Cause of Death (MCCD)",
            "short_label": "MCCD from hospital",
            "icon": "file-text",
            "why": "The hospital issues an MCCD (Form 4 / 4A). Ask for 3 to 4 original copies if possible. Without this, you cannot register the death or claim insurance. It comes from the hospital's medical officer, not the ward staff.",
            "documents": ["hospital"],
            "phones": [],
            "maps_search": None,
        })
        tasks.append({
            "id": "hosp-discharge",
            "phase": "right_now",
            "title": "Complete the hospital discharge",
            "short_label": "Hospital discharge",
            "icon": "clipboard",
            "why": "Settle the bill and ask the admin desk for the discharge summary. Once done, the body can be moved to the mortuary or transported home.",
            "documents": ["id_proof"],
            "phones": [],
            "maps_search": None,
        })

    tasks.append({
        "id": "transport",
        "phase": "right_now",
        "title": "Arrange transport (hearse van)",
        "short_label": "Arrange transport",
        "icon": "truck",
        "why": "You will need a hearse or funeral van to move the body — from hospital to home, or home to the cremation / burial site. Many private services operate 24 hours; search near you.",
        "documents": [],
        "phones": [UNIFIED, AMBULANCE_108],
        "maps_search": "hearse funeral van service",
    })

    tasks.append({
        "id": "inform-family",
        "phase": "right_now",
        "title": "Let close family know",
        "short_label": "Inform close family",
        "icon": "users",
        "why": "You do not have to call everyone yourself. Use the family share sheet to send one calm, factual message to a family group — others can help spread the word.",
        "documents": [],
        "phones": [],
        "maps_search": None,
    })

    # ---------------- TODAY ----------------
    tasks.append({
        "id": "rites",
        "phase": "today",
        "title": rc["rites_title"],
        "short_label": rc["rites_title"],
        "icon": "heart",
        "why": rc["rites_why"],
        "documents": [],
        "phones": [],
        "maps_search": rc.get("rites_search"),
    })

    tasks.append({
        "id": "booking",
        "phase": "today",
        "title": rc["booking_title"],
        "short_label": rc["booking_title"],
        "icon": "calendar",
        "why": rc["booking_why"],
        "documents": ["hospital", "id_proof"],
        "phones": [],
        "maps_search": rc.get("booking_search"),
    })

    # ---------------- NEXT FEW DAYS ----------------
    tasks.append({
        "id": "register-death",
        "phase": "next_few_days",
        "title": "Register the death (within 21 days)",
        "short_label": "Register the death",
        "icon": "edit-3",
        "why": "Under the Registration of Births and Deaths Act, 1969, a death must be registered at the local Municipal Corporation, Municipality, or Gram Panchayat office covering the area where the death occurred. Free within 21 days. After 21 days there is a small delay fee and an affidavit; after 1 year, a magistrate's order is needed. You can also apply online at crsorgi.gov.in, or your state portal.",
        "documents": ["hospital", "aadhaar", "id_proof"],
        "phones": [],
        "maps_search": "municipal corporation death registration office",
    })

    if rc["ashes"]:
        tasks.append({
            "id": "ashes",
            "phase": "next_few_days",
            "title": rc.get("ashes_title", "Collect the ashes"),
            "short_label": rc.get("ashes_title", "Collect the ashes"),
            "icon": "package",
            "why": rc.get("ashes_why", "Ashes are usually available 24 to 48 hours after cremation."),
            "documents": [],
            "phones": [],
            "maps_search": rc.get("booking_search"),
        })

    # ---------------- NEXT FEW WEEKS ----------------
    tasks.append({
        "id": "certificate-collect",
        "phase": "next_few_weeks",
        "title": "Collect the death certificate (5 to 8 originals)",
        "short_label": "Collect certificate",
        "icon": "file-text",
        "why": "The certificate is usually ready 7 to 15 days after registration (some cities offer a 24-hour tatkaal service for a fee). Ask for 5 to 8 original copies — banks, insurers, pension office, property registrar, utilities, and employer will each want an original or a notarised copy. Reprints later cost time and money.",
        "documents": [],
        "phones": [],
        "maps_search": "municipal corporation death registration office",
    })

    tasks.append({
        "id": "insurance",
        "phase": "next_few_weeks",
        "title": "Start the insurance claim with the insurer directly",
        "short_label": "Insurance claim",
        "icon": "shield",
        "why": "You file the claim with the actual insurance company, not IRDAI. Check the policy document, the deceased's bank passbook (for premium auto-debits), or ask their employer if it was a group policy. Most insurers accept online submission. Only contact IRDAI (155255) if the insurer is unresponsive or unfair — that is a grievance line, not a claims line.",
        "documents": ["insurance", "hospital"],
        "phones": [LIC_HELPLINE, IRDAI_GRIEVANCE],
        "maps_search": None,
    })

    tasks.append({
        "id": "bank",
        "phase": "next_few_weeks",
        "title": "Notify the banks",
        "short_label": "Notify banks",
        "icon": "credit-card",
        "why": "What you need depends on the account: for a joint account, ask for removal of the deceased's name; for a sole account with a nominee, the nominee can claim; without a nominee, the bank may ask for a legal heir or succession certificate, especially for larger balances. Carry the death certificate, passbook, deceased's ID, and your ID.",
        "documents": ["id_proof", "aadhaar"],
        "phones": [],
        "maps_search": None,
    })

    tasks.append({
        "id": "utilities",
        "phase": "next_few_weeks",
        "title": "Update utilities and subscriptions",
        "short_label": "Utilities & subscriptions",
        "icon": "zap",
        "why": "Transfer or close electricity, gas / LPG, phone, mobile number, DTH / broadband, and any monthly subscriptions. Most of this can be done online with a copy of the death certificate.",
        "documents": ["id_proof"],
        "phones": [],
        "maps_search": None,
    })

    tasks.append({
        "id": "legal-heir",
        "phase": "next_few_weeks",
        "title": "Legal heir / succession certificate (only if needed)",
        "short_label": "Legal heir certificate",
        "icon": "file-plus",
        "why": "If there was no will or nominee, and there are significant assets — a house, large bank balances, a vehicle — you may need a legal heir certificate (from the Tahsildar / SDM) or a succession certificate (from the civil court). This can take a few weeks and needs the death certificate, family details, and address proofs.",
        "documents": ["aadhaar", "id_proof"],
        "phones": [],
        "maps_search": "tahsildar office",
    })

    # ---------------- IN THE COMING MONTHS ----------------
    tasks.append({
        "id": "other-admin",
        "phase": "coming_months",
        "title": "Other admin — PAN, EPFO, ration card, vehicle",
        "short_label": "PAN, EPFO, vehicle etc.",
        "icon": "list",
        "why": "Things families sometimes forget: PAN card surrender (to the income tax office), EPFO / pension nomination transfer (via the employer or EPFO portal), ration card update (via the state ration office), and vehicle RC transfer (via the RTO). Not urgent, but easier to sort within a few months.",
        "documents": ["aadhaar", "id_proof"],
        "phones": [],
        "maps_search": None,
    })

    tasks.append({
        "id": "final-tax-return",
        "phase": "coming_months",
        "title": "File the final income tax return, if applicable",
        "short_label": "Final tax return",
        "icon": "file",
        "why": "The legal representative (usually the nominee or a legal heir) can file a final income tax return for the deceased on the income tax portal. This is done for the financial year of death. A CA can do this for a modest fee.",
        "documents": [],
        "phones": [],
        "maps_search": None,
    })

    # Attach religion urgency note to the first Right Now task, if any.
    urgency = rc.get("urgency_note")
    if urgency:
        for t in tasks:
            if t["phase"] == "right_now":
                t["urgency_note"] = urgency
                break

    return tasks


# ---------------- Contacts Hub content ----------------
# National verified numbers only + local searches (maps).
def contacts_payload(religion: Optional[str]):
    rc = _rc(religion)
    national = [
        {"id": "unified", "name": "Unified emergency (police / fire / ambulance)", "phone": "112", "note": "Works even without SIM or network"},
        {"id": "ambulance-108", "name": "Ambulance", "phone": "108", "note": "State ambulance service"},
        {"id": "ambulance-102", "name": "Ambulance (maternal / general)", "phone": "102", "note": "Available in many states"},
        {"id": "police", "name": "Police", "phone": "100", "note": None},
        {"id": "fire", "name": "Fire", "phone": "101", "note": None},
        {"id": "senior", "name": "Senior citizens helpline", "phone": "14567", "note": "If the surviving spouse is elderly and alone"},
        {"id": "women", "name": "Women's helpline", "phone": "1091", "note": None},
        {"id": "irdai", "name": "IRDAI grievance (Bima Bharosa)", "phone": "155255", "note": "Only if the insurer is unresponsive"},
    ]
    local_searches = [
        {"id": "hearse", "label": "Hearse / funeral van near you", "query": "hearse funeral van service"},
        {"id": "municipal", "label": "Municipal death registration office", "query": "municipal corporation death registration office"},
        {"id": "hospital", "label": "Hospital near you", "query": "hospital"},
    ]
    if rc.get("rites_search"):
        local_searches.append({"id": "rites", "label": rc["rites_title"], "query": rc["rites_search"]})
    if rc.get("booking_search"):
        local_searches.append({"id": "booking", "label": rc["booking_title"], "query": rc["booking_search"]})
    return {"national": national, "local_searches": local_searches}


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Emergency Planner API"}


@api_router.post("/checklist")
async def get_checklist(req: ChecklistRequest):
    tasks = build_tasks(req.place_of_death, req.religion, req.unexpected)
    return {"tasks": tasks}


@api_router.get("/contacts")
async def get_contacts(religion: Optional[str] = None):
    return contacts_payload(religion)


@api_router.post("/otp/send")
async def send_otp(req: OTPRequest):
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


class ShareRequest(BaseModel):
    name: Optional[str] = None
    time: Optional[str] = None
    place: Optional[str] = None
    language: str = "en"


@api_router.post("/share/message")
async def share_message(req: ShareRequest):
    name = req.name or "our family"
    time = req.time or "soon"
    place = req.place or "the local site"
    templates = {
        "en": f"Update from {name}: The service is arranged for {time} at {place}. The death certificate is in process. We will share more details soon. Thank you for your love and support.",
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
