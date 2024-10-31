import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fi, enUS } from 'date-fns/locale';
import api from '../services/api';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Trash2 } from 'lucide-react';
import { showSuccessToast, showErrorToast, showConfirmToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';

export function PollHistory({ eventId }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchPollHistory();
  }, [eventId]);

  const fetchPollHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}/poll-history`);
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching poll history:', error);
      showErrorToast('Failed to fetch poll history');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    showConfirmToast(
      'Are you sure you want to clear the poll history? This action cannot be undone.',
      async () => {
        try {
          await api.delete(`/events/${eventId}/poll-history`);
          showSuccessToast('Poll history cleared successfully');
          fetchPollHistory(); // Refresh the poll list
        } catch (error) {
          console.error('Error clearing poll history:', error);
          showErrorToast('Failed to clear poll history');
        }
      }
    );
  };

  const formatDate = (date) => {
    if (i18n.language === 'fi') {
      return format(new Date(date), "d.M.yyyy 'klo' HH:mm", { locale: fi });
    } else {
      return format(new Date(date), 'PPP p', { locale: enUS });
    }
  };

  if (loading) {
    return <div>{t('pollHistory.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t('pollHistory.title')}</h2>
        <Button variant="destructive" onClick={handleClearHistory}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t('pollHistory.clearHistory')}
        </Button>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 p-4">
          {polls.length === 0 ? (
            <p>{t('pollHistory.noPollsInHistory')}</p>
          ) : (
            polls.map((poll) => (
              <Card key={poll._id}>
                <CardHeader>
                  <CardTitle>{poll.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('pollHistory.createdBy')}: {poll.createdBy.username} - {formatDate(poll.createdAt)}
                  </p>
                  <ul className="list-disc list-inside">
                    {poll.options.map((option, index) => (
                      <li key={index}>
                        {option.text}: {option.votes} {t('pollHistory.votes')}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    {t('pollHistory.status')}: {poll.isActive ? t('pollHistory.active') : t('pollHistory.ended')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}