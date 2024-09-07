import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { SendIcon, SmileIcon, XIcon } from 'lucide-react';

const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '❤️', '🔥', '👀'];

function MessageForm({ eventId, onMessageSent, replyTo, setReplyTo }) {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [showNameField, setShowNameField] = useState(true);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const savedName = sessionStorage.getItem('userName');
    if (savedName) {
      setName(savedName);
      setShowNameField(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    try {
      const response = await api.post('/messages', { 
        content, 
        eventId, 
        name: user ? user.username : (name || undefined),
        replyTo: replyTo ? replyTo._id : undefined
      });
      console.log('Message sent:', response.data);
      setContent('');
      setReplyTo(null);
      if (name && !user) {
        sessionStorage.setItem('userName', name);
        setShowNameField(false);
      }
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.response?.data?.error || error.message));
    }
  };

  const addEmoji = (emoji) => {
    setContent(prevContent => prevContent + emoji);
    setShowEmojiMenu(false);
  };

  const getReplyToUsername = () => {
    if (replyTo) {
      if (replyTo.user && replyTo.user.username) {
        return replyTo.user.username;
      } else if (replyTo.name) {
        return replyTo.name;
      } else {
        return 'Anonymous';
      }
    }
    return '';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {replyTo && (
        <div className="flex items-center bg-muted p-2 rounded-md">
          <span className="text-sm text-muted-foreground mr-2">Replying to {getReplyToUsername()}:</span>
          <span className="text-sm truncate flex-grow">{replyTo.content}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        {!user && showNameField && (
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name (optional)"
            className="flex-grow"
          />
        )}
        <div className="flex-grow relative">
          <Input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Type your reply..." : "Type a message..."}
            required
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowEmojiMenu(!showEmojiMenu)}
            >
              <SmileIcon className="w-4 h-4" />
            </Button>
          </div>
          {showEmojiMenu && (
            <div className="absolute right-0 bottom-full mb-2 bg-background border border-border rounded-md shadow-lg p-2">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className="p-1 hover:bg-muted rounded"
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" variant="primary">
          <SendIcon className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </form>
  );
}

export default MessageForm;