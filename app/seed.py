from .models import db, User, Room, Booking, Task, Issue, Notification, WorkOrder, ServiceRequest, InventoryItem, Payment, AuditLog, ResortSettings

def seed_database():
    if User.query.first():
        return
    db.session.add(ResortSettings())
    users = [
        ("Resort Owner","owner@resortos.local","owner"),
        ("Operations Manager","manager@resortos.local","manager"),
        ("Priya Sharma","reception@resortos.local","reception"),
        ("Neha Patil","housekeeping@resortos.local","housekeeping"),
        ("Vikram Singh","maintenance@resortos.local","maintenance"),
        ("System Admin","admin@resortos.local","admin"),
        ("Mehul Guest","customer@resortos.local","customer"),
    ]
    created={}
    for name,email,role in users:
        u=User(name=name,email=email,role=role,status="Active")
        u.set_password("password123")
        created[role]=u
        db.session.add(u)
    db.session.flush()

    mumbai = "OceanView Resort — Mumbai"
    goa = "OceanView Resort — Goa"
    udaipur = "OceanView Resort — Udaipur"
    rooms = [
        ("101","Deluxe Room",8500,"Available",1,mumbai,2,"1 King Bed","room-101.jpg"),
        ("102","Deluxe Room",8500,"Occupied",1,mumbai,2,"1 King Bed","room-102.jpg"),
        ("201","Executive Suite",14800,"Available",2,mumbai,2,"1 King Bed","room-201.jpg"),
        ("202","Executive Suite",14800,"Cleaning",2,mumbai,2,"1 King Bed","room-202.jpg"),
        ("301","Premium Villa",24900,"Available",3,mumbai,4,"2 King Beds","room-301.jpg"),
        ("302","Premium Villa",24900,"Maintenance",3,mumbai,4,"2 King Beds","room-302.jpg"),
        ("401","Ocean View Suite",18500,"Available",4,mumbai,3,"1 King Bed","room-401.jpg"),
        ("402","Family Suite",16500,"Available",4,mumbai,4,"2 Queen Beds","room-402.jpg"),
        ("G101","Deluxe Room",7200,"Available",1,goa,2,"1 King Bed","room-warm.jpg"),
        ("G201","Executive Suite",13200,"Available",2,goa,2,"1 King Bed","room-warm-2.jpg"),
        ("G301","Premium Villa",22500,"Available",3,goa,4,"2 King Beds","room-classic.jpg"),
        ("U101","Deluxe Room",9800,"Available",1,udaipur,2,"1 King Bed","room-101.jpg"),
        ("U201","Executive Suite",16500,"Available",2,udaipur,2,"1 King Bed","room-201.jpg"),
        ("U301","Premium Villa",28900,"Available",3,udaipur,4,"2 King Beds","room-301.jpg"),
    ]
    for num,typ,price,status,floor,loc,guests,beds,img in rooms:
        db.session.add(Room(number=num,room_type=typ,price=price,status=status,floor=floor,location=loc,guests=guests,beds=beds,image=img,
            description=f"Beautiful {typ.lower()} with premium resort amenities."))

    db.session.flush()
    import datetime as dt
    for r in Room.query.filter(Room.status=="Available").limit(3).all():
        b=Booking(user_id=created["customer"].id, room_id=r.id, check_in="2026-09-28", check_out="2026-09-30",
                  guests=2,total=r.price*2,status="Confirmed")
        db.session.add(b)

    tasks=[
        ("Deep Cleaning • Room 202","Cleaning","202",created["housekeeping"].id,"High","Pending"),
        ("Room Cleaning • Room 101","Cleaning","101",created["housekeeping"].id,"Medium","In Progress"),
        ("Kitchen Operations","Kitchen","Main Kitchen",created["housekeeping"].id,"Low","Pending"),
        ("AC Inspection • Room 302","Repair","302",created["maintenance"].id,"High","Pending"),
    ]
    for title,tt,room,uid,prio,status in tasks:
        db.session.add(Task(title=title,task_type=tt,room_number=room,assigned_to=uid,priority=prio,status=status))
    db.session.add(Issue(title="AC not cooling",room_number="302",category="HVAC",
        description="Guest reported weak cooling.",priority="High",status="Open",reported_by=created["reception"].id))
    db.session.add(Issue(title="Bathroom tap leakage",room_number="202",category="Plumbing",
        description="Minor leakage reported during inspection.",priority="Medium",status="In Progress",reported_by=created["manager"].id))
    db.session.add(Notification(user_id=created["owner"].id,message="Weekly revenue report is ready."))
    db.session.add(Notification(user_id=created["manager"].id,message="2 high-priority operational items need attention."))

    db.session.add(WorkOrder(title="AC Compressor Inspection", category="HVAC", room_number="302", assigned_to=created["maintenance"].id, priority="High", status="Open", estimated_cost=4500, due_at="2026-09-28", notes="Check compressor and refrigerant pressure."))
    db.session.add(WorkOrder(title="Bathroom Tap Repair", category="Plumbing", room_number="202", assigned_to=created["maintenance"].id, priority="Medium", status="In Progress", estimated_cost=1200, due_at="2026-09-27", notes="Replace worn cartridge."))
    db.session.add(ServiceRequest(user_id=created["customer"].id, room_number="101", service_type="Extra Towels", details="Please send 2 extra towels.", priority="Normal", status="Requested", assigned_to=created["housekeeping"].id))
    inventory=[("Bath Towels","Housekeeping",38,20,"pcs","Linen Store"),("Shampoo","Amenities",14,20,"bottles","Housekeeping Store"),("LED Bulbs","Maintenance",26,10,"pcs","Maintenance Store"),("AC Filters","Maintenance",8,8,"pcs","Maintenance Store"),("Coffee Pods","F&B",65,25,"pcs","Pantry")]
    for name,cat,qty,minq,unit,loc in inventory: db.session.add(InventoryItem(name=name,category=cat,quantity=qty,min_quantity=minq,unit=unit,location=loc))
    for b in Booking.query.limit(2).all(): db.session.add(Payment(booking_id=b.id,amount=b.total,method="UPI",status="Paid",reference=f"UPI-RS-{b.id:04d}"))
    db.session.add(AuditLog(user_id=created["admin"].id,action="System initialized",entity="system",details="ResortOS demo database seeded."))
    db.session.commit()
