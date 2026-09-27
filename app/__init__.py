from flask import Flask
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass
from .models import db
from .routes import main_bp, api_bp
from .routes_extra import ops_bp

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-only-change-this")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///resortos.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db_url = app.config["SQLALCHEMY_DATABASE_URI"]
    if db_url.startswith("postgres://"):
        db_url = "postgresql+psycopg://" + db_url[len("postgres://"):]
    elif db_url.startswith("postgresql://"):
        db_url = "postgresql+psycopg://" + db_url[len("postgresql://"):]
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    db.init_app(app)

    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(ops_bp)

    with app.app_context():
        db.create_all()
        from .seed import seed_database
        seed_database()
    return app
