# ResortOS — Full Resort Management Prototype

A Flask + SQLite resort management system designed for a multi-role hackathon prototype.

## Included roles
- Customer / Guest
- Reception
- Housekeeping
- Maintenance
- Manager
- Owner
- Admin

## Persistent database
SQLite is configured in Flask. The database is created automatically at `instance/resortos.db` and survives restarts.

Stored data includes:
- Users and roles
- Rooms
- Bookings
- Tasks
- Issues
- Notifications
- Maintenance work orders
- Guest service requests
- Inventory / supplies
- Payments
- Audit logs

## Role features
### Customer
- Register/login
- Browse rooms
- Create bookings
- View bookings
- Submit service requests
- Track service requests
- Customer dashboard matching the supplied UI reference

### Reception
- Front desk arrival list
- Check-in / check-out
- Room allocation
- Guest service requests
- Room and booking visibility

### Housekeeping
- Assigned tasks
- Service request routing
- Operational task status updates
- Inventory visibility

### Maintenance
- Assigned work orders
- Issue-to-work-order routing
- Repair priority/status
- Estimated and actual cost fields
- Maintenance inventory

### Manager
- Operations Center
- Staff/access management
- Work orders
- Service requests
- Inventory
- Analytics
- Audit trail
- Room allocation
- Reports

### Owner
- Executive dashboard
- Revenue / occupancy / issue / stock analytics
- Operations
- Staff/access
- Inventory
- Audit trail
- Reports

### Admin
- User access control
- Role and account status changes
- Inventory
- Work orders
- Service requests
- Audit trail
- Full system visibility

## Smart routing
Reporting an issue can automatically create the correct operational work:
- HVAC / plumbing / electrical / repair / maintenance → Maintenance work order
- Cleaning / linen / housekeeping → Housekeeping task

## Demo credentials
Password for seeded accounts: `password123`

- owner@resortos.local
- manager@resortos.local
- reception@resortos.local
- housekeeping@resortos.local
- maintenance@resortos.local
- admin@resortos.local
- customer@resortos.local

## Run
```bash
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
python run.py
```

For another laptop on the same hotspot, use the Network URL printed by `run.py` or run `start_hotspot.bat`.

## Images
Put replacement resort images inside:
`app/static/images/`

The existing pool/room images from the provided references are already included.

## Important
The project intentionally uses SQLite for the hackathon prototype because it is simple to run locally and requires no separate database server. For production deployment, move to PostgreSQL and use environment variables for secrets.

## Generative AI features

ResortOS now includes `/ai` with:
- AI Concierge for guest/staff questions
- Operations Copilot using live SQLite metrics
- AI issue triage: department + priority + recommended action
- Local fallbacks so the prototype still works without an API key

To enable the live GenAI layer, set `OPENAI_API_KEY` in your environment. Optionally set `OPENAI_MODEL` (default: `gpt-5.6-luna`). Never put a real API key in frontend JavaScript or commit it to source control.

## Updated Login Flow
- `/login` is now a role-choice screen.
- `/login/customer` is customer-only login.
- `/login/staff` is employee login with role selection: Admin, Owner, Manager, Reception, Worker (Housekeeping), Maintenance.
- `/register` remains customer registration.
- Demo password for seeded users: `password123`.


## ResortOS Real AI setup

The customer AI uses the OpenAI Responses API. Set these environment variables before running:

`OPENAI_API_KEY=...`
`OPENAI_MODEL=gpt-5.6-luna
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash`

The AI Intelligence page is customer-only. A customer types natural language into one input. The model privately decides whether to answer, search rooms, create a service request, or create an issue. Operational actions are written to the database; management (manager, owner, admin) receives notifications and the customer AI action is written to `AuditLog`.

Reception/manager/admin can use Room Allocation to see guest ID, guest details, booking total, paid amount, current room and available room assignment.

Reports & Analytics includes a final AI-generated live-data analytics section for owner/manager/admin.

If `OPENAI_API_KEY` is missing or the API is unavailable, the app uses a deterministic local fallback so the prototype still runs; it is not a substitute for the real model.

## HackCelestial 3.0 Midnight Task integration

### Task 1 — Weather-Driven Digital Twin
ResortOS now includes `/digital-twin` as an integrated simulation layer. It uses live Open-Meteo weather observations/forecast data, an OpenStreetMap/Leaflet geospatial view, public Reddit search as a real-world traveler/social signal, and an interactive counterfactual simulator. Weather changes are propagated into simulated demand, movement disruption, room availability, housekeeping workload, maintenance risk, predicted issues and uncertainty. Simulations are isolated from real room/booking records.

### Task 2 — Nugen Intelligence
The project includes a real Nugen API integration. `nugen_domain_corpus.txt` is the ResortOS-specific domain corpus. Alignment remains available through `setup_nugen.py`, but the live Nugen page and Digital Twin can run without an aligned model by using Nugen's supported `nugen-flash-instruct` base model. The Digital Twin uses the aligned Nugen model for AI summaries when configured, and the Nugen Intelligence page provides a live inference test.

### Setup
1. Copy `.env.example` to `.env`.
2. Add `NUGEN_API_KEY` for live Nugen AI. **Nugen alignment is optional**: the app can directly use the supported `nugen-flash-instruct` base model.
3. Optionally add `GEMINI_API_KEY` for a second real-AI fallback. The app uses Gemini 3.8 Flash (ResortOS Copilot) when OpenAI is unavailable and Gemini is configured.
4. Install dependencies: `pip install -r requirements.txt`.
5. Run `python run.py`. You do not need to create a Nugen aligned model just to test AI.
6. If you want the HackCelestial alignment pipeline later, run `python setup_nugen.py` and set the returned `NUGEN_MODEL_ID`.

Nugen's official API flow is: upload text documents → create an alignment project → wait for `COMPLETED` → use the returned aligned `model_id` for chat inference. The integration follows that flow.


## Vercel deployment
Vercel runs the Flask app as a Python serverless function. Do not use the local SQLite database for production persistence on Vercel; configure `DATABASE_URL` to a hosted PostgreSQL database such as Neon or Supabase.

Required Vercel environment variables:
- SECRET_KEY
- DATABASE_URL
- OPENAI_API_KEY (if using OpenAI)
- OPENAI_MODEL
- GEMINI_API_KEY (if using Gemini)
- GEMINI_MODEL
- NUGEN_API_KEY (if using Nugen)
- NUGEN_BASE_MODEL
- NUGEN_ALIGNMENT_ID
- NUGEN_MODEL_ID
- RESORT_LAT
- RESORT_LON
- SOCIAL_QUERY

The real `.env` file is intentionally excluded from this deployment package. Add secrets only in Vercel Project Settings > Environment Variables.
