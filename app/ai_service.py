import os
import json
from datetime import datetime
import requests

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


def _client():
    key = os.getenv("OPENAI_API_KEY")
    if not key or OpenAI is None:
        return None
    return OpenAI(api_key=key)


def _call_gemini(instructions, prompt):
    """Call Gemini with a small compatibility fallback chain.

    Google currently lists Gemini 3.8 Flash as a stable generateContent model.
    If a key/project does not have access to that model yet, try the other
    stable Flash endpoints before falling back to OpenAI/deterministic logic.
    """
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None

    configured = (os.getenv("GEMINI_MODEL") or "").strip()
    candidates = []
    for model in [configured, "gemini-3.8-flash", "gemini-3.7-flash",
                  "gemini-3.6-flash", "gemini-3.5-flash-lite"]:
        if model and model not in candidates:
            candidates.append(model)

    body = {
        "systemInstruction": {"parts": [{"text": instructions}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 1200,
            "responseMimeType": "application/json" if "ONLY valid JSON" in instructions else "text/plain"
        }
    }

    last_error = None
    for model in candidates:
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json=body,
                timeout=45,
            )
            if r.status_code >= 400:
                last_error = f"Gemini {model}: HTTP {r.status_code}"
                continue
            data = r.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = "".join(p.get("text", "") for p in parts if p.get("text"))
            if text.strip():
                return text.strip()
            last_error = f"Gemini {model}: empty response"
        except Exception as exc:
            last_error = f"Gemini {model}: {exc}"

    # Keep the API key out of logs/responses.
    return None


def _call_ai(instructions, prompt):
    # Gemini is the primary real AI provider for ResortOS.
    # OpenAI remains an optional fallback, then the app's deterministic fallback runs.
    text = _call_gemini(instructions, prompt)
    if text:
        return text

    client = _client()
    if client:
        model = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")
        try:
            response = client.responses.create(
                model=model,
                instructions=instructions,
                input=prompt,
                max_output_tokens=1200,
            )
            text = response.output_text.strip()
            if text:
                return text
        except Exception:
            pass
    return None


def concierge_agent(message, context):
    """Customer-only AI agent. It reasons privately, then returns a small
    machine-readable decision. We never expose hidden chain-of-thought."""
    schema = {
        "answer": "string",
        "action": "none | service_request | issue | room_search",
        "authority": "Housekeeping | Maintenance | Reception | Manager",
        "priority": "Low | Normal | High",
        "category": "short category",
        "title": "short title",
        "details": "operational details",
        "room_number": "room number or empty",
    }
    instructions = """You are ResortOS Customer AI, an autonomous resort concierge.
The customer is the only person allowed to use this AI interface.
Think through the request privately. Do not reveal chain-of-thought or hidden reasoning.
Return ONLY valid JSON matching the requested keys.

Your job:
1. Understand any natural-language customer message, including Hinglish.
2. Answer normal questions directly from the supplied live resort data.
3. If the customer asks for housekeeping, maintenance, reception/support, or reports a problem,
   choose the correct action and authority.
4. Use service_request for routine guest services; use issue for a problem/incident.
5. Use room_search when the customer asks what rooms are available.
6. Never invent room availability, prices, booking status, policies, or completed actions.
7. If exact information is missing, say what is missing in answer and use action=none.
8. priority is based on urgency in the customer's message.
9. Keep answer under about 100 words and make it useful.
"""
    prompt = json.dumps({
        "customer_message": message,
        "live_context": context,
        "required_output_shape": schema
    }, default=str)

    raw = _call_ai(instructions, prompt)
    if raw:
        try:
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean
                clean = clean.rsplit("```", 1)[0].strip()
            parsed = json.loads(clean)
            parsed["live_ai"] = True
            parsed["fallback"] = False
            return _normalize_agent(parsed)
        except Exception:
            pass

    return _fallback_agent(message, context)


def _normalize_agent(x):
    actions = {"none", "service_request", "issue", "room_search"}
    authorities = {"Housekeeping", "Maintenance", "Reception", "Manager"}
    priorities = {"Low", "Normal", "High"}
    x["action"] = x.get("action") if x.get("action") in actions else "none"
    x["authority"] = x.get("authority") if x.get("authority") in authorities else "Manager"
    x["priority"] = x.get("priority") if x.get("priority") in priorities else "Normal"
    for k, default in [("answer","I can help with your resort request."),
                       ("category","Guest Request"),("title","Customer Request"),
                       ("details",""),("room_number","")]:
        x[k] = str(x.get(k) or default)[:1000]
    return x


def _fallback_agent(message, context):
    text = message.lower()
    room = ""
    bookings = context.get("bookings", [])
    if bookings and bookings[0].get("room"):
        room = str(bookings[0]["room"])

    if any(k in text for k in ["available room", "room available", "room options", "rooms available", "room book"]):
        rooms = context.get("rooms", [])
        av = [r for r in rooms if r.get("status") in ["Available", "Cleaning"]]
        answer = "I found these currently available rooms: " + ", ".join(
            f"Room {r['number']} ({r['type']}, ₹{r['price']}/night)" for r in av[:6]
        ) if av else "There are no currently available rooms in the live resort data."
        return _normalize_agent({"answer":answer,"action":"room_search","authority":"Reception",
                                 "priority":"Normal","category":"Room Search","title":"Room availability",
                                 "details":"","room_number":"","live_ai":False,"fallback":True})

    if any(k in text for k in ["towel","clean room","cleaning","linen","amenities","housekeeping"]):
        return _normalize_agent({"answer":"I’ve sent your request to Housekeeping and notified resort management.",
                                 "action":"service_request","authority":"Housekeeping","priority":"Normal",
                                 "category":"Housekeeping","title":"Guest housekeeping request",
                                 "details":message,"room_number":room,"live_ai":False,"fallback":True})

    if any(k in text for k in ["ac ","air conditioning","air conditioner","leak","broken","repair","electric","power","water heater","not working"]):
        return _normalize_agent({"answer":"I’ve logged this for Maintenance and notified resort management.",
                                 "action":"issue","authority":"Maintenance","priority":"High" if any(k in text for k in ["urgent","danger","no power"]) else "Normal",
                                 "category":"Maintenance","title":"Guest maintenance issue",
                                 "details":message,"room_number":room,"live_ai":False,"fallback":True})

    if any(k in text for k in ["booking","check in","check-in","checkout","check-out","reception","payment"]):
        return _normalize_agent({"answer":"I’ve routed this to Reception and notified resort management.",
                                 "action":"service_request","authority":"Reception","priority":"Normal",
                                 "category":"Reception","title":"Guest reception request",
                                 "details":message,"room_number":room,"live_ai":False,"fallback":True})

    return _normalize_agent({"answer":"I’m your ResortOS AI Concierge. Tell me what you need and I’ll understand the request and route operational help when needed.",
                             "action":"none","authority":"Manager","priority":"Normal",
                             "category":"General","title":"Customer enquiry","details":message,
                             "room_number":"","live_ai":False,"fallback":True})



def issue_intelligence(message, context):
    """Autonomous issue-intelligence classifier. The user supplies only free text;
    the model returns an operational decision, not chain-of-thought."""
    schema = {
        "summary": "short factual summary",
        "category": "HVAC | Plumbing | Electrical | Housekeeping | Security | Medical | Reception | Billing | Room | General",
        "priority": "Low | Medium | High | Critical",
        "authority": "Maintenance | Housekeeping | Reception | Manager | Security | Medical",
        "action": "create_issue | create_work_order | create_service_request | notify_reception | notify_manager | none",
        "title": "short issue title",
        "room_number": "room number if stated or confidently known from customer context, otherwise empty",
        "recommended_action": "one concise operational action",
        "customer_response": "short response to the customer",
        "reason": "short decision rationale, not hidden chain-of-thought"
    }
    instructions = """You are ResortOS Issue Intelligence, an autonomous resort operations classifier.
The user enters ONLY one natural-language description of what is wrong or what they need. You must infer the operational category, urgency, responsible authority and the concrete action the software should execute.

Rules:
- Understand English, Hindi and Hinglish and messy natural language.
- Do not ask the user to choose a department, category, priority, title or action.
- Infer room number only if explicitly present or available in the supplied customer context; never invent it.
- Critical means immediate safety/security/medical danger or a serious incident. High means urgent service disruption or significant property/guest impact. Medium is a normal operational problem. Low is minor/non-urgent.
- Maintenance: AC, electricity, plumbing, water heater, appliance, broken fixtures, leaks.
- Housekeeping: cleaning, towels, linen, toiletries, room amenities.
- Reception: booking, check-in/out, room allocation, payment/account questions.
- Security: suspicious activity, lost/stolen property, access/security concerns.
- Medical: guest illness/injury or medical assistance request. Do not diagnose.
- If an operational issue needs a technician, use create_work_order. Routine guest service uses create_service_request. A safety/security/medical incident should create_issue and notify the responsible authority.
- The software will execute the returned action and notify management. Never claim an action happened yourself.
- Return ONLY valid JSON with exactly the requested keys. Do not include chain-of-thought."""
    prompt=json.dumps({"message":message,"customer":context.get("customer"),"active_booking":context.get("booking"),"required_output_shape":schema},default=str)
    raw=_call_ai(instructions,prompt)
    if raw:
        try:
            x=json.loads(raw)
            x["live_ai"]=True; x["fallback"]=False
            return _normalize_issue(x)
        except Exception:
            pass
    return _fallback_issue(message, context)


def _normalize_issue(x):
    categories={"HVAC","Plumbing","Electrical","Housekeeping","Security","Medical","Reception","Billing","Room","General"}
    priorities={"Low","Medium","High","Critical"}
    authorities={"Maintenance","Housekeeping","Reception","Manager","Security","Medical"}
    actions={"create_issue","create_work_order","create_service_request","notify_reception","notify_manager","none"}
    x["category"]=x.get("category") if x.get("category") in categories else "General"
    x["priority"]=x.get("priority") if x.get("priority") in priorities else "Medium"
    x["authority"]=x.get("authority") if x.get("authority") in authorities else "Manager"
    x["action"]=x.get("action") if x.get("action") in actions else "create_issue"
    for k,d in [("summary","Issue received."),("title","Guest-reported issue"),("room_number",""),("recommended_action","Review and route the request."),("customer_response","Your request has been analyzed and routed to the appropriate resort team."),("reason","Operational routing based on the reported request.")]:
        x[k]=str(x.get(k) or d)[:1200]
    return x


def _fallback_issue(message, context):
    t=message.lower(); room=(context.get("booking") or {}).get("room_number","")
    if any(k in t for k in ["fire","smoke","danger","threat","unsafe","stolen","break in","break-in"]):
        authority="Security"; priority="Critical"; action="create_issue"; category="Security"
    elif any(k in t for k in ["injury","injured","bleeding","medical","ambulance","unwell","sick"]):
        authority="Medical"; priority="Critical"; action="create_issue"; category="Medical"
    elif any(k in t for k in ["ac","air conditioning","electric","power","leak","plumbing","heater","not working","broken","repair"]):
        authority="Maintenance"; priority="High" if any(k in t for k in ["urgent","no power","leak","danger"]) else "Medium"; action="create_work_order"; category="HVAC" if "ac" in t or "air conditioning" in t else "General"
    elif any(k in t for k in ["towel","clean","linen","toiletries","housekeeping"]):
        authority="Housekeeping"; priority="Medium"; action="create_service_request"; category="Housekeeping"
    elif any(k in t for k in ["booking","check in","check-in","checkout","check-out","payment","reception","room"]):
        authority="Reception"; priority="Medium"; action="notify_reception"; category="Reception"
    else:
        authority="Manager"; priority="Medium"; action="create_issue"; category="General"
    return _normalize_issue({"summary":message,"category":category,"priority":priority,"authority":authority,"action":action,"title":"AI-detected guest issue","room_number":room,"recommended_action":f"Route to {authority} for resolution.","customer_response":f"I analyzed your message and routed it to {authority} with {priority} priority.","reason":f"Detected {category} request requiring {authority}.","live_ai":False,"fallback":True})


def operations_insight(metrics):
    prompt = f"""Analyze this live resort snapshot. Return a concise management analytics summary
with sections: Situation, Key signals, Recommended actions, AI activity.
Use only supplied facts and numbers. Do not rank people or invent facts.
Metrics: {json.dumps(metrics, default=str)}"""
    ai = _call_ai("You are a resort analytics assistant. Produce concise evidence-based management analytics.", prompt)
    if ai:
        return ai
    return (
        f"Situation: {metrics.get('occupied',0)} occupied / {metrics.get('rooms_total',0)} total rooms.\n"
        f"Key signals: {metrics.get('open_issues',0)} open issues, {metrics.get('pending_tasks',0)} pending tasks, "
        f"{metrics.get('low_stock',0)} low-stock items.\n"
        f"Recommended actions: Review open operational work and low-stock items; monitor available rooms for arrivals.\n"
        f"AI activity: {metrics.get('ai_customer_actions',0)} customer AI actions recorded in the audit log."
    )
