// src/components/ModerationTab.jsx
import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { CheckIcon, XIcon } from 'lucide-react';
import api from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';
import socket from '../services/socket';
import { useNotifications } from '../context/NotificationContext';

export function ModerationTab({ eventId }) {
  const { t } = useTranslation();
  const [pendingMessages, setPendingMessages] = useState([]);
  const { clearNotification } = useNotifications();

  useEffect(() => {
    fetchPendingMessages();

    // Socket event listeners
    socket.on('new message to moderate', (newMessage) => {
      setPendingMessages(prevMessages => [...prevMessages, newMessage]);
    });

    socket.on('message approved', (messageId) => {
      setPendingMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
    });

    socket.on('message deleted', (messageId) => {
      setPendingMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
    });

    return () => {
      socket.off('new message to moderate');
      socket.off('message approved');
      socket.off('message deleted');
    };
  }, [eventId]);

  const fetchPendingMessages = async () => {
    try {
      const response = await api.get(`/events/${eventId}/pending-messages`);
      setPendingMessages(response.data);
    } catch (error) {
      console.error('Error fetching pending messages:', error);
    }
  };

  const handleApprove = async (messageId) => {
    try {
      await api.put(`/messages/approve/${messageId}`);
      setPendingMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
      clearNotification(messageId);
      showSuccessToast(t('moderation.messageApproved'));
    } catch (error) {
      console.error('Error approving message:', error);
      showErrorToast(t('moderation.errorApproving'));
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      setPendingMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
      clearNotification(messageId);
      showSuccessToast(t('moderation.messageDeleted'));
    } catch (error) {
      console.error('Error deleting message:', error);
      showErrorToast(t('moderation.errorDeleting'));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t('moderation.title')}</h2>
      {pendingMessages.length === 0 ? (
        <p>{t('moderation.noPendingMessages')}</p>
      ) : (
        pendingMessages.map(message => (
          <Card key={message._id}>
            <CardContent className="p-4">
              <p className="font-semibold">{message.content}</p>
              <p className="text-sm text-muted-foreground">
                {t('moderation.by', { user: message.user ? message.user.username : message.name })}
              </p>
              <div className="mt-2 flex justify-end space-x-2">
                <Button size="sm" onClick={() => handleApprove(message._id)}>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {t('moderation.approve')}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(message._id)}>
                  <XIcon className="w-4 h-4 mr-2" />
                  {t('moderation.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
