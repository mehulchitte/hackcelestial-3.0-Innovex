from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(40), nullable=False, default="customer")
    phone = db.Column(db.String(40))
    department = db.Column(db.String(80))
    status = db.Column(db.String(30), default="Active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(20), unique=True, nullable=False)
    room_type = db.Column(db.String(60), nullable=False)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), default="Available")
    image = db.Column(db.String(255), default="room-placeholder.jpg")
    floor = db.Column(db.Integer, default=1)
    description = db.Column(db.Text)
    location = db.Column(db.String(120), default="OceanView Resort, Mumbai")
    guests = db.Column(db.Integer, default=2)
    beds = db.Column(db.String(40), default="1 King Bed")

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("room.id"), nullable=False)
    check_in = db.Column(db.String(20), nullable=False)
    check_out = db.Column(db.String(20), nullable=False)
    guests = db.Column(db.Integer, default=1)
    status = db.Column(db.String(30), default="Confirmed")
    total = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User")
    room = db.relationship("Room")

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    task_type = db.Column(db.String(50), nullable=False)
    room_number = db.Column(db.String(20))
    assigned_to = db.Column(db.Integer, db.ForeignKey("user.id"))
    priority = db.Column(db.String(30), default="Medium")
    status = db.Column(db.String(30), default="Pending")
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    assignee = db.relationship("User")

class Issue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    room_number = db.Column(db.String(20))
    category = db.Column(db.String(80), default="General")
    description = db.Column(db.Text)
    priority = db.Column(db.String(30), default="Medium")
    status = db.Column(db.String(30), default="Open")
    reported_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reporter = db.relationship("User")

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WorkOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(db.Integer, db.ForeignKey("issue.id"))
    title = db.Column(db.String(180), nullable=False)
    category = db.Column(db.String(80), default="General")
    room_number = db.Column(db.String(20))
    assigned_to = db.Column(db.Integer, db.ForeignKey("user.id"))
    priority = db.Column(db.String(30), default="Medium")
    status = db.Column(db.String(30), default="Open")
    estimated_cost = db.Column(db.Float, default=0)
    actual_cost = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    due_at = db.Column(db.String(30))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    assignee = db.relationship("User")
    issue = db.relationship("Issue")

class ServiceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    room_number = db.Column(db.String(20))
    service_type = db.Column(db.String(80), nullable=False)
    details = db.Column(db.Text)
    priority = db.Column(db.String(30), default="Normal")
    status = db.Column(db.String(30), default="Requested")
    assigned_to = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    requester = db.relationship("User", foreign_keys=[user_id])
    assignee = db.relationship("User", foreign_keys=[assigned_to])

class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    category = db.Column(db.String(80), default="General")
    quantity = db.Column(db.Integer, default=0)
    min_quantity = db.Column(db.Integer, default=5)
    unit = db.Column(db.String(30), default="pcs")
    location = db.Column(db.String(100), default="Store")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(40), default="Cash")
    status = db.Column(db.String(30), default="Paid")
    reference = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    booking = db.relationship("Booking")

class ResortSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resort_name = db.Column(db.String(160), default="OceanView Resort")
    email = db.Column(db.String(160), default="hello@resortos.local")
    phone = db.Column(db.String(40), default="+91 98765 43210")
    address = db.Column(db.Text, default="OceanView Resort, Mumbai, Maharashtra")
    timezone = db.Column(db.String(60), default="Asia/Kolkata (IST)")
    currency = db.Column(db.String(30), default="INR — ₹")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def get():
        row = ResortSettings.query.first()
        if not row:
            row = ResortSettings()
            db.session.add(row)
            db.session.commit()
        return row

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    action = db.Column(db.String(160), nullable=False)
    entity = db.Column(db.String(80))
    entity_id = db.Column(db.Integer)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User")


class WeatherSnapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float)
    rainfall = db.Column(db.Float)
    wind_speed = db.Column(db.Float)
    weather_code = db.Column(db.Integer)
    payload = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TwinSimulation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scenario_name = db.Column(db.String(160), default="What-if scenario")
    parameters = db.Column(db.Text)
    result = db.Column(db.Text)
    ai_summary = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User")
