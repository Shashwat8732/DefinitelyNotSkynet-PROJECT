USE cybersec_db;
GO

-- Drop existing tables if they exist (for fresh setup)
IF OBJECT_ID('dbo.messages', 'U') IS NOT NULL DROP TABLE dbo.messages;
IF OBJECT_ID('dbo.chats', 'U') IS NOT NULL DROP TABLE dbo.chats;
IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NOT NULL DROP TABLE dbo.password_reset_tokens;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(30) NOT NULL UNIQUE,
    mobile VARCHAR(15) NOT NULL,  -- 🆕 Mobile Number
    password_hash VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    provider VARCHAR(20) DEFAULT 'email',
    avatar VARCHAR(500),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Chats table
CREATE TABLE chats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    tools NVARCHAR(MAX), -- Store JSON as string
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for chats
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);

-- Messages table
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    chat_id VARCHAR(36) NOT NULL,
    sender VARCHAR(20) NOT NULL,
    content NVARCHAR(MAX) NOT NULL, -- Store JSON as string
    timestamp DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Create indexes for messages
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Create index for password reset tokens
CREATE INDEX idx_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);

GO

-- Verify tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

PRINT '✅ Database schema created successfully with mobile number field!';
GO