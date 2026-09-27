from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from functools import wraps
from datetime import datetime
from .models import db, User, Room, Booking, Task, Issue, Notification, WorkOrder, ServiceRequest, InventoryItem, Payment, AuditLog

ops_bp = Blueprint("ops", __name__)

def get_user():
    from flask import session
    uid = session.get("user_id")
    return User.query.get(uid) if uid else None

def role_required(*roles):
    def deco(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            u = get_user()
            if not u:
                return redirect(url_for("main.login"))
            if roles and u.role not in roles:
                return jsonify({"ok": False, "message": "You do not have access to this area."}), 403
            return fn(*args, **kwargs)
        return wrapped
    return deco

def audit(action, entity=None, entity_id=None, details=None):
    u = get_user()
    db.session.add(AuditLog(user_id=u.id if u else None, action=action, entity=entity, entity_id=entity_id, details=details))

def staff_json(u):
    return {"id":u.id,"name":u.name,"email":u.email,"role":u.role,"department":u.department or "Operations","status":u.status,"phone":u.phone or ""}

def work_json(w):
    return {"id":w.id,"title":w.title,"category":w.category,"room":w.room_number or "—","assignee":w.assignee.name if w.assignee else "Unassigned","assigned_to":w.assigned_to,"priority":w.priority,"status":w.status,"estimated_cost":w.estimated_cost or 0,"actual_cost":w.actual_cost or 0,"due_at":w.due_at or "","notes":w.notes or ""}

def request_json(r):
    return {"id":r.id,"service_type":r.service_type,"room":r.room_number or "—","details":r.details or "","priority":r.priority,"status":r.status,"requester":r.requester.name if r.requester else "Guest","assigned_to":r.assigned_to,"assignee":r.assignee.name if r.assignee else "Unassigned"}

def inventory_json(i):
    return {"id":i.id,"name":i.name,"category":i.category,"quantity":i.quantity,"min_quantity":i.min_quantity,"unit":i.unit,"location":i.location,"low":i.quantity<=i.min_quantity}

@ops_bp.route("/operations")
@role_required("owner","manager","reception","housekeeping","maintenance","admin","customer")
def operations():
    return render_template("operations.html")

@ops_bp.get("/api/work-orders")
@role_required("owner","manager","maintenance","admin")
def api_work_orders():
    u=get_user(); q=WorkOrder.query
    if u.role == "maintenance": q=q.filter_by(assigned_to=u.id)
    return jsonify([work_json(x) for x in q.order_by(WorkOrder.id.desc()).all()])

@ops_bp.post("/api/work-orders")
@role_required("owner","manager","maintenance","admin")
def create_work_order():
    d=request.get_json() or {}
    assignee=int(d["assigned_to"]) if d.get("assigned_to") else None
    w=WorkOrder(title=d.get("title","Maintenance Work"),category=d.get("category","General"),room_number=d.get("room",""),assigned_to=assignee,priority=d.get("priority","Medium"),status=d.get("status","Open"),estimated_cost=float(d.get("estimated_cost") or 0),due_at=d.get("due_at",""),notes=d.get("notes",""))
    db.session.add(w); audit("Created work order","work_order",w.id,d.get("title")); db.session.commit()
    return jsonify({"ok":True,"work_order":work_json(w)})

@ops_bp.patch("/api/work-orders/<int:wid>")
@role_required("owner","manager","maintenance","admin")
def update_work_order(wid):
    w=WorkOrder.query.get_or_404(wid); d=request.get_json() or {}
    u=get_user()
    if u.role=="maintenance" and w.assigned_to not in (None,u.id): return jsonify({"ok":False,"message":"This work order is not assigned to you."}),403
    for key in ["status","priority","notes","due_at","category"]:
        if key in d: setattr(w,key,d[key])
    if "actual_cost" in d: w.actual_cost=float(d["actual_cost"] or 0)
    if "assigned_to" in d and u.role in ["owner","manager","admin"]: w.assigned_to=int(d["assigned_to"]) if d["assigned_to"] else None
    audit("Updated work order","work_order",wid,w.status); db.session.commit()
    return jsonify({"ok":True,"work_order":work_json(w)})

@ops_bp.get("/api/service-requests")
@role_required("owner","manager","reception","housekeeping","maintenance","admin","customer")
def api_service_requests():
    u=get_user(); q=ServiceRequest.query
    if u.role=="customer": q=q.filter_by(user_id=u.id)
    elif u.role in ["housekeeping","maintenance"]: q=q.filter((ServiceRequest.assigned_to==u.id)|(ServiceRequest.assigned_to==None))
    return jsonify([request_json(x) for x in q.order_by(ServiceRequest.id.desc()).all()])

@ops_bp.post("/api/service-requests")
@role_required("customer","reception","manager","admin")
def create_service_request():
    u=get_user(); d=request.get_json() or {}
    target=int(d["user_id"]) if d.get("user_id") and u.role in ["reception","manager","admin"] else u.id
    r=ServiceRequest(user_id=target,room_number=d.get("room",""),service_type=d.get("service_type","General Service"),details=d.get("details",""),priority=d.get("priority","Normal"))
    db.session.add(r); audit("Created service request","service_request",r.id,r.service_type); db.session.commit()
    return jsonify({"ok":True,"request":request_json(r)})

@ops_bp.patch("/api/service-requests/<int:rid>")
@role_required("owner","manager","reception","housekeeping","maintenance","admin")
def update_service_request(rid):
    r=ServiceRequest.query.get_or_404(rid); d=request.get_json() or {}
    u=get_user()
    if u.role in ["housekeeping","maintenance"] and r.assigned_to not in (None,u.id): return jsonify({"ok":False,"message":"Not assigned to you."}),403
    for key in ["status","priority"]:
        if key in d: setattr(r,key,d[key])
    if "assigned_to" in d and u.role in ["owner","manager","reception","admin"]: r.assigned_to=int(d["assigned_to"]) if d["assigned_to"] else None
    audit("Updated service request","service_request",rid,r.status); db.session.commit(); return jsonify({"ok":True})

@ops_bp.get("/api/inventory")
@role_required("owner","manager","housekeeping","maintenance","admin")
def api_inventory():
    return jsonify([inventory_json(x) for x in InventoryItem.query.order_by(InventoryItem.name).all()])

@ops_bp.post("/api/inventory")
@role_required("owner","manager","admin")
def create_inventory():
    d=request.get_json() or {}
    i=InventoryItem(name=d.get("name","New Item"),category=d.get("category","General"),quantity=int(d.get("quantity",0)),min_quantity=int(d.get("min_quantity",5)),unit=d.get("unit","pcs"),location=d.get("location","Store"))
    db.session.add(i); audit("Added inventory item","inventory",i.id,i.name); db.session.commit(); return jsonify({"ok":True,"item":inventory_json(i)})

@ops_bp.patch("/api/inventory/<int:iid>")
@role_required("owner","manager","admin")
def update_inventory(iid):
    i=InventoryItem.query.get_or_404(iid); d=request.get_json() or {}
    for key in ["name","category","unit","location"]:
        if key in d: setattr(i,key,d[key])
    if "quantity" in d: i.quantity=int(d["quantity"])
    if "min_quantity" in d: i.min_quantity=int(d["min_quantity"])
    audit("Updated inventory","inventory",iid,i.name); db.session.commit(); return jsonify({"ok":True,"item":inventory_json(i)})

@ops_bp.get("/api/admin/users")
@role_required("owner","manager","admin")
def api_admin_users():
    return jsonify([staff_json(u) for u in User.query.order_by(User.id).all()])

@ops_bp.patch("/api/admin/users/<int:uid>")
@role_required("owner","manager","admin")
def admin_update_user(uid):
    u=User.query.get_or_404(uid); d=request.get_json() or {}
    if "role" in d and d["role"] in ["customer","owner","manager","reception","housekeeping","maintenance","admin"]: u.role=d["role"]
    if "status" in d: u.status=d["status"]
    if "department" in d: u.department=d["department"]
    audit("Updated user access","user",uid,f"role={u.role},status={u.status}"); db.session.commit(); return jsonify({"ok":True,"user":staff_json(u)})

@ops_bp.get("/api/audit")
@role_required("owner","manager","admin")
def api_audit():
    rows=AuditLog.query.order_by(AuditLog.id.desc()).limit(100).all()
    return jsonify([{"id":x.id,"user":x.user.name if x.user else "System","action":x.action,"entity":x.entity,"details":x.details or "","created_at":x.created_at.strftime("%d %b %Y %H:%M")} for x in rows])

@ops_bp.get("/api/analytics")
@role_required("owner","manager","admin")
def analytics():
    rooms=Room.query.all(); bookings=Booking.query.all(); payments=Payment.query.all()
    revenue=sum(x.amount for x in payments if x.status=="Paid") or sum(b.total for b in bookings if b.status!="Cancelled")
    return jsonify({"rooms":len(rooms),"available":sum(r.status=="Available" for r in rooms),"occupied":sum(r.status=="Occupied" for r in rooms),"maintenance":sum(r.status=="Maintenance" for r in rooms),"cleaning":sum(r.status=="Cleaning" for r in rooms),"bookings":len(bookings),"confirmed":sum(b.status=="Confirmed" for b in bookings),"revenue":revenue,"open_issues":Issue.query.filter(Issue.status!="Resolved").count(),"pending_tasks":Task.query.filter(Task.status!="Completed").count(),"low_stock":InventoryItem.query.filter(InventoryItem.quantity<=InventoryItem.min_quantity).count()})

@ops_bp.post("/api/check-in/<int:booking_id>")
@role_required("reception","manager","admin")
def check_in(booking_id):
    b=Booking.query.get_or_404(booking_id); b.status="Checked In"; b.room.status="Occupied"; audit("Guest checked in","booking",booking_id,b.room.number); db.session.add(Notification(user_id=b.user_id,message=f"Welcome! You are checked in to Room {b.room.number}.")); db.session.commit(); return jsonify({"ok":True})

@ops_bp.post("/api/check-out/<int:booking_id>")
@role_required("reception","manager","admin")
def check_out(booking_id):
    b=Booking.query.get_or_404(booking_id); b.status="Checked Out"; b.room.status="Cleaning"; audit("Guest checked out","booking",booking_id,b.room.number); db.session.add(Notification(user_id=b.user_id,message="Thank you for staying with OceanView Resort.")); db.session.commit(); return jsonify({"ok":True})
