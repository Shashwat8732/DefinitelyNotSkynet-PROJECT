# backend/database.py
from sqlalchemy import create_engine, Column, String, DateTime, Text, Date, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.pool import NullPool
from datetime import datetime
import os
import urllib.parse


# Azure SQL Database Configuration
AZURE_SQL_SERVER = os.getenv("AZURE_SQL_SERVER", "cybersecdefinitelynotskynet.database.windows.net")
AZURE_SQL_DATABASE = os.getenv("AZURE_SQL_DATABASE", "cybersec_db")
AZURE_SQL_USERNAME = os.getenv("AZURE_SQL_USERNAME", "sqladmin")
AZURE_SQL_PASSWORD = os.getenv("AZURE_SQL_PASSWORD", "cybersecdefinitelynotskynet@123")
 
encoded_password = urllib.parse.quote_plus(AZURE_SQL_PASSWORD)
encoded_username=urllib.parse.quote_plus(f"{AZURE_SQL_USERNAME}@cybersecdefinitelynotskynet")

# Connection String
CONNECTION_STRING = (
    f"mssql+pymssql://{encoded_username}:{encoded_password}@{AZURE_SQL_SERVER}:1433/{AZURE_SQL_DATABASE}"
    
    
)

# Create Engine
engine = create_engine(
    CONNECTION_STRING,
    poolclass=NullPool,
    echo=False  # Set to True for debugging
)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============= DATABASE MODELS =============

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)  # UUID
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(30), unique=True, nullable=False, index=True)
    mobile = Column(String(15), nullable=False)  # 🆕 Mobile Number
    password_hash = Column(String(255), nullable=False)
    dob = Column(Date, nullable=False)
    provider = Column(String(20), default="email")  # email, google, apple
    avatar = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(String(36), primary_key=True)  # UUID
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    tools = Column(JSON, default=[])  # Store as JSON array
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True)  # UUID
    chat_id = Column(String(36), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # user, ai, system
    content = Column(Text, nullable=False)  # Store as JSON string
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(500), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ============= DATABASE INITIALIZATION =============

def init_database():
    """Create all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============= USER CRUD OPERATIONS =============

class UserDB:
    @staticmethod
    def create_user(db, user_data: dict):
        """Create new user"""
        import uuid
        from sqlalchemy.exc import IntegrityError
        
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name=user_data["name"],
            email=user_data["email"],
            username=user_data["username"],
            mobile=user_data["mobile"],  # 🆕
            password_hash=user_data["password_hash"],
            dob=user_data["dob"],
            provider=user_data.get("provider", "email"),
            avatar=user_data.get("avatar")
        )
        
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError as e:
            db.rollback()
            if "email" in str(e.orig):
                raise ValueError("Email already exists")
            elif "username" in str(e.orig):
                raise ValueError("Username already exists")
            raise
    
    @staticmethod
    def get_user_by_email(db, email: str):
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db, username: str):
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_id(db, user_id: str):
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def update_password(db, email: str, new_password_hash: str):
        """Update user password"""
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.password_hash = new_password_hash
            user.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False
    
    @staticmethod
    def update_user(db, user_id: str, update_data: dict):
        """Update user data"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in update_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False

# ============= CHAT CRUD OPERATIONS =============

class ChatDB:
    @staticmethod
    def create_chat(db, user_id: str, title: str, tools: list = []):
        """Create new chat"""
        import uuid
        
        chat_id = str(uuid.uuid4())
        chat = Chat(
            id=chat_id,
            user_id=user_id,
            title=title,
            tools=tools
        )
        
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat
    
    @staticmethod
    def get_user_chats(db, user_id: str, limit: int = 50):
        """Get all chats for a user"""
        chats = db.query(Chat).filter(
            Chat.user_id == user_id
        ).order_by(
            Chat.updated_at.desc()
        ).limit(limit).all()
        
        return chats
    
    @staticmethod
    def get_chat_by_id(db, chat_id: str):
        """Get chat by ID"""
        return db.query(Chat).filter(Chat.id == chat_id).first()
    
    @staticmethod
    def update_chat(db, chat_id: str, update_data: dict):
        """Update chat"""
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            for key, value in update_data.items():
                if hasattr(chat, key):
                    setattr(chat, key, value)
            chat.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False
    
    @staticmethod
    def delete_chat(db, chat_id: str):
        """Delete chat and its messages"""
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            db.delete(chat)
            db.commit()
            return True
        return False

# ============= MESSAGE CRUD OPERATIONS =============

class MessageDB:
    @staticmethod
    def create_message(db, chat_id: str, message_data: dict):
        """Create new message"""
        import uuid
        import json
        
        message_id = str(uuid.uuid4())
        
        # Convert message_data to JSON string for storage
        content = json.dumps(message_data)
        
        message = Message(
            id=message_id,
            chat_id=chat_id,
            sender=message_data.get("sender", "user"),
            content=content
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    
    @staticmethod
    def get_chat_messages(db, chat_id: str, limit: int = 100):
        """Get all messages for a chat"""
        import json
        
        messages = db.query(Message).filter(
            Message.chat_id == chat_id
        ).order_by(
            Message.timestamp.asc()
        ).limit(limit).all()
        
        # Parse JSON content
        result = []
        for msg in messages:
            msg_dict = {
                "id": msg.id,
                "chat_id": msg.chat_id,
                "sender": msg.sender,
                "timestamp": msg.timestamp.isoformat()
            }
            
            # Parse content JSON
            try:
                content = json.loads(msg.content)
                msg_dict.update(content)
            except:
                msg_dict["text"] = msg.content
            
            result.append(msg_dict)
        
        return result
    
    @staticmethod
    def delete_chat_messages(db, chat_id: str):
        """Delete all messages in a chat"""
        deleted = db.query(Message).filter(Message.chat_id == chat_id).delete()
        db.commit()
        return deleted

# ============= PASSWORD RESET TOKEN OPERATIONS =============

class PasswordResetDB:
    @staticmethod
    def create_reset_token(db, email: str, token: str, expires_at: datetime):
        """Create password reset token"""
        import uuid
        
        reset_token = PasswordResetToken(
            id=str(uuid.uuid4()),
            email=email,
            token=token,
            expires_at=expires_at
        )
        
        db.add(reset_token)
        db.commit()
        return reset_token
    
    @staticmethod
    def get_valid_token(db, token: str):
        """Get valid (unused and not expired) reset token"""
        now = datetime.utcnow()
        return db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > now
        ).first()
    
    @staticmethod
    def mark_token_used(db, token: str):
        """Mark reset token as used"""
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        if reset_token:
            reset_token.used = True
            db.commit()
            return True
        return False