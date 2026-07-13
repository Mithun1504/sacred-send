"""Backend tests for Emergency Cremation & Funeral Planner API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://sacred-send.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

INVALID_NUMBERS = {"1912", "1099", "1077", "1800111222", "1800111333", "1800111444", "1800111555"}


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _post_checklist(s, place, religion, unexpected=False):
    r = s.post(f"{API}/checklist", json={
        "place_of_death": place, "religion": religion, "unexpected": unexpected, "location": "Delhi"
    })
    assert r.status_code == 200, r.text
    return r.json()["tasks"]


def _by_id(tasks, tid):
    return next((t for t in tasks if t["id"] == tid), None)


# ---------------- Checklist tests ----------------

class TestChecklistMuslimHomeUnexpected:
    def test_muslim_home_unexpected(self, s):
        tasks = _post_checklist(s, "home", "muslim", unexpected=True)
        ids = [t["id"] for t in tasks]
        assert "police-report" in ids
        assert "home-doctor" in ids
        assert "transport" in ids
        assert "ashes" not in ids
        assert len(tasks) == 14, f"expected 14 tasks, got {len(tasks)}: {ids}"

        rites = _by_id(tasks, "rites")
        assert rites["title"] == "Contact the local mosque or qabristan committee"
        booking = _by_id(tasks, "booking")
        assert booking["title"] == "Contact the qabristan for a burial plot"

        # urgency_note attached to first right_now task (police-report since unexpected)
        first_rn = next(t for t in tasks if t["phase"] == "right_now")
        assert first_rn["id"] == "police-report"
        assert first_rn.get("urgency_note")
        assert "24 hours" in first_rn["urgency_note"]


class TestChecklistHinduHospital:
    def test_hindu_hospital_expected(self, s):
        tasks = _post_checklist(s, "hospital", "hindu", unexpected=False)
        ids = [t["id"] for t in tasks]
        assert "mccd" in ids
        assert "hosp-discharge" in ids
        assert "register-death" in ids
        assert "ashes" in ids
        assert "police-report" not in ids
        assert "home-doctor" not in ids

        mccd = _by_id(tasks, "mccd")
        assert "MCCD" in mccd["title"]
        rites = _by_id(tasks, "rites")
        assert "pandit" in rites["title"].lower()
        booking = _by_id(tasks, "booking")
        assert "cremation" in booking["title"].lower()


class TestChecklistChristian:
    def test_christian_hospital(self, s):
        tasks = _post_checklist(s, "hospital", "christian")
        ids = [t["id"] for t in tasks]
        assert "ashes" not in ids
        rites = _by_id(tasks, "rites")
        assert "priest" in rites["title"].lower() or "pastor" in rites["title"].lower()
        booking = _by_id(tasks, "booking")
        assert "christian" in booking["maps_search"].lower()


class TestChecklistSikh:
    def test_sikh(self, s):
        tasks = _post_checklist(s, "hospital", "sikh")
        ids = [t["id"] for t in tasks]
        assert "ashes" in ids
        rites = _by_id(tasks, "rites")
        title_lower = rites["title"].lower()
        assert "gurudwara" in title_lower or "granthi" in title_lower


class TestChecklistSecular:
    def test_secular(self, s):
        tasks = _post_checklist(s, "hospital", "secular")
        ids = [t["id"] for t in tasks]
        assert "ashes" in ids
        rites = _by_id(tasks, "rites")
        assert "priest" not in rites["title"].lower()
        assert "pandit" not in rites["title"].lower()


class TestRegisterDeathAndCertificate:
    def test_register_death(self, s):
        tasks = _post_checklist(s, "hospital", "hindu")
        rd = _by_id(tasks, "register-death")
        assert rd is not None
        assert rd["phase"] == "next_few_days"
        assert "21 days" in rd["why"]
        assert "crsorgi.gov.in" in rd["why"]

    def test_certificate_collect(self, s):
        tasks = _post_checklist(s, "hospital", "hindu")
        cc = _by_id(tasks, "certificate-collect")
        assert cc is not None
        assert cc["phase"] == "next_few_weeks"
        assert "5 to 8 original" in cc["why"]
        assert "7 to 15 days" in cc["why"]

    def test_insurance(self, s):
        tasks = _post_checklist(s, "hospital", "hindu")
        ins = _by_id(tasks, "insurance")
        assert ins is not None
        assert "file with actual insurance company, not IRDAI".lower() in ins["why"].lower() or (
            "not IRDAI" in ins["why"]
        )
        phone_nums = [p["number"] for p in ins["phones"]]
        assert any("LIC" in p["label"] for p in ins["phones"])
        assert "155255" in phone_nums


class TestNoInvalidNumbersInChecklist:
    @pytest.mark.parametrize("place,religion,unexpected", [
        ("hospital", "hindu", False),
        ("home", "muslim", True),
        ("hospital", "christian", False),
        ("home", "sikh", False),
        ("other", "secular", True),
    ])
    def test_no_invalid_numbers(self, s, place, religion, unexpected):
        tasks = _post_checklist(s, place, religion, unexpected)
        for t in tasks:
            for phone in t.get("phones", []):
                num = phone.get("number", "").replace("-", "").replace(" ", "")
                assert num not in INVALID_NUMBERS, f"invalid number {num} in task {t['id']}"
                # 104 should not be shown as hospital admin
                if num == "104":
                    assert "hospital admin" not in phone.get("label", "").lower()


# ---------------- Contacts tests ----------------

class TestContacts:
    def test_muslim_contacts(self, s):
        r = s.get(f"{API}/contacts", params={"religion": "muslim"})
        assert r.status_code == 200
        data = r.json()
        nat = data["national"]
        assert len(nat) == 8
        nums = {c["phone"] for c in nat}
        expected = {"112", "108", "102", "100", "101", "14567", "1091", "155255"}
        assert nums == expected

        ls = data["local_searches"]
        labels = " ".join((s.get("label", "") + " " + s.get("query", "")).lower() for s in ls)
        assert "mosque" in labels
        assert "qabristan" in labels

    def test_hindu_contacts(self, s):
        r = s.get(f"{API}/contacts", params={"religion": "hindu"})
        data = r.json()
        ls = data["local_searches"]
        combined = " ".join((c["label"] + " " + c["query"]).lower() for c in ls)
        assert "hindu temple pandit" in combined or "pandit" in combined
        assert "cremation ground" in combined

    def test_no_invalid_numbers_in_contacts(self, s):
        r = s.get(f"{API}/contacts", params={"religion": "hindu"})
        nums = {c["phone"] for c in r.json()["national"]}
        assert nums.isdisjoint(INVALID_NUMBERS)
        # 104 must not appear labeled as hospital admin
        for c in r.json()["national"]:
            if c["phone"] == "104":
                assert "hospital admin" not in c["name"].lower()


# ---------------- OTP tests ----------------

class TestOTP:
    def test_send_otp(self, s):
        r = s.post(f"{API}/otp/send", json={"phone": "+919999999999"})
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        assert d["mock_code"] == "123456"

    def test_verify_success(self, s):
        r = s.post(f"{API}/otp/verify", json={"phone": "+919999999999", "code": "123456"})
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        assert "session_id" in d and d["session_id"]

    def test_verify_failure(self, s):
        r = s.post(f"{API}/otp/verify", json={"phone": "+919999999999", "code": "000000"})
        assert r.status_code == 400


# ---------------- Vault tests ----------------

class TestVault:
    def test_upload_and_list_hides_base64_and_id(self, s):
        # Get session first
        v = s.post(f"{API}/otp/verify", json={"phone": "+9199", "code": "123456"}).json()
        session_id = v["session_id"]

        up = s.post(f"{API}/vault/upload", json={
            "session_id": session_id,
            "doc_type": "aadhaar",
            "filename": "TEST_aadhaar.jpg",
            "data_base64": "AAAABBBBCCCC",
        })
        assert up.status_code == 200
        assert up.json()["success"] is True

        lst = s.get(f"{API}/vault/{session_id}")
        assert lst.status_code == 200
        docs = lst.json()["documents"]
        assert len(docs) >= 1
        doc = next(d for d in docs if d["filename"] == "TEST_aadhaar.jpg")
        assert "data_base64" not in doc
        assert "_id" not in doc
        assert doc["doc_type"] == "aadhaar"


# ---------------- Share tests ----------------

class TestShare:
    @pytest.mark.parametrize("lang,marker", [
        ("en", "service is arranged"),
        ("hi", "अंतिम संस्कार"),
        ("ta", "இறுதிச் சடங்கு"),
    ])
    def test_share_language(self, s, lang, marker):
        r = s.post(f"{API}/share/message", json={
            "name": "Sharma family", "time": "5 PM", "place": "Nigambodh Ghat", "language": lang
        })
        assert r.status_code == 200
        assert marker in r.json()["message"]
