-- ================================================
-- V45: CHAT MESSAGES TABLE
-- Direct messaging with media/file sharing support
-- ================================================

CREATE TABLE chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    media_file_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying chat history between two users rapidly
CREATE INDEX idx_chat_messages_sender_recipient 
    ON chat_messages(sender_id, recipient_id);

-- Index for recipient (useful for unread messages count / lists)
CREATE INDEX idx_chat_messages_recipient 
    ON chat_messages(recipient_id);

-- Index for ordering logs chronologically
CREATE INDEX idx_chat_messages_created_at 
    ON chat_messages(created_at);

COMMENT ON TABLE chat_messages IS 'Logs of all user direct message chats and shared files';
COMMENT ON COLUMN chat_messages.sender_id IS 'User ID of the message sender';
COMMENT ON COLUMN chat_messages.recipient_id IS 'User ID of the message recipient';
COMMENT ON COLUMN chat_messages.media_file_id IS 'Optional attachment from media_files registry';

