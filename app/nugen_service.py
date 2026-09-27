import os, requests, json

BASE="https://api.nugen.in/api/v3"

def _headers():
    key=os.getenv("NUGEN_API_KEY")
    return {"Authorization":f"Bearer {key}"} if key else {}

def enabled(): return bool(os.getenv("NUGEN_API_KEY"))

def infer(messages, model=None):
    """Run Nugen inference.

    Alignment is optional for the working prototype. If an aligned model ID is
    unavailable, use Nugen's supported base model directly so the AI still works.
    """
    key=os.getenv("NUGEN_API_KEY")
    model = model or os.getenv("NUGEN_MODEL_ID") or os.getenv("NUGEN_BASE_MODEL", "nugen-flash-instruct")
    if not key or not model:
        return None
    payload={
        "model":model,
        "messages":messages,
        "max_tokens":700,
        "temperature":0.2,
        "stream":False
    }
    r=requests.post(
        BASE+"/inference/chat/completions",
        headers={**_headers(),"Content-Type":"application/json"},
        json=payload,
        timeout=45
    )
    r.raise_for_status()
    d=r.json()
    return {
        "content":d.get("choices",[{}])[0].get("message",{}).get("content",""),
        "confidence":d.get("confidence_score"),
        "model":d.get("model") or model
    }

def create_alignment(document_ids, base_model=None, name="ResortOS Hospitality Digital Twin Alignment"):
    payload={"alignment_name":name,"base_model_id":base_model or os.getenv("NUGEN_BASE_MODEL","nugen-flash-instruct"),"document_ids":document_ids,"description":"Domain alignment for ResortOS hospitality operations, weather-driven digital twin simulation, guest demand, room capacity, maintenance, housekeeping and travel signals."}
    r=requests.post(BASE+"/alignment-projects/create",headers={**_headers(),"Content-Type":"application/json"},json=payload,timeout=30); r.raise_for_status(); return r.json()

def alignment_status(alignment_id):
    r=requests.get(BASE+f"/alignment-projects/{alignment_id}/status",headers=_headers(),timeout=20); r.raise_for_status(); return r.json()

def upload_domain_file(path):
    with open(path,"rb") as f:
        files={"files.items":(os.path.basename(path),f,"text/plain")}
        data={"categories":"hospitality,digital-twin,weather","names":os.path.basename(path)}
        r=requests.post(BASE+"/documents/create",headers=_headers(),data=data,files=files,timeout=30); r.raise_for_status(); return r.json()
