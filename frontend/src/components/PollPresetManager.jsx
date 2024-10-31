import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Minus, Edit, Trash2, Play } from 'lucide-react';
import api from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';

export function PollPresetManager({ eventId, onClose }) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState([]);
  const [newPreset, setNewPreset] = useState({ question: '', options: ['', ''], duration: 60, deletionTimer: 20 });
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [isActivePoll, setIsActivePoll] = useState(false);

  useEffect(() => {
    fetchPresets();
    checkActivePoll();
  }, [eventId]);

  const fetchPresets = async () => {
    try {
      const response = await api.get(`/events/${eventId}/poll-presets`);
      setPresets(response.data);
    } catch (error) {
      showErrorToast(t('pollPresets.errorFetching'));
    }
  };

  const checkActivePoll = async () => {
    try {
      const response = await api.get(`/events/${eventId}/active-poll`);
      setIsActivePoll(!!response.data.activePoll);
    } catch (error) {
      console.error('Error checking active poll:', error);
    }
  };

  const handleAddPreset = async () => {
    // Validate question
    if (!newPreset.question.trim()) {
      showErrorToast(t('pollPresets.validationErrors.questionRequired'));
      return;
    }

    // Validate options (at least 2 non-empty options)
    const validOptions = newPreset.options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      showErrorToast(t('pollPresets.validationErrors.twoOptionsRequired'));
      return;
    }

    // Validate duration
    if (newPreset.duration < 10 || newPreset.duration > 300) {
      showErrorToast(t('pollPresets.validationErrors.durationRange'));
      return;
    }

    // Validate deletion timer
    if (newPreset.deletionTimer < 5 || newPreset.deletionTimer > 300) {
      showErrorToast(t('pollPresets.validationErrors.resultDurationRange'));
      return;
    }

    try {
      const response = await api.post(`/events/${eventId}/poll-presets`, {
        question: newPreset.question,
        options: newPreset.options.filter(option => option.trim() !== ''),
        duration: newPreset.duration,
        deletionTimer: newPreset.deletionTimer
      });
      setPresets([...presets, response.data]);
      setNewPreset({ question: '', options: ['', ''], duration: 60, deletionTimer: 20 });
      showSuccessToast(t('pollPresets.successAdd'));
    } catch (error) {
      showErrorToast(t('pollPresets.errorAdd') + ': ' + (error.response?.data?.details || error.message));
    }
  };

  const handleUpdatePreset = async (presetId) => {
    const presetToUpdate = presets.find(preset => preset._id === presetId);

    // Validate question
    if (!presetToUpdate.question.trim()) {
      showErrorToast(t('pollPresets.validationErrors.questionRequired'));
      return;
    }

    // Validate options (at least 2 non-empty options)
    const validOptions = presetToUpdate.options
      .map(option => option.text)
      .filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      showErrorToast(t('pollPresets.validationErrors.twoOptionsRequired'));
      return;
    }

    // Validate duration
    if (presetToUpdate.duration < 10 || presetToUpdate.duration > 300) {
      showErrorToast(t('pollPresets.validationErrors.durationRange'));
      return;
    }

    // Validate deletion timer
    if (presetToUpdate.deletionTimer < 5 || presetToUpdate.deletionTimer > 300) {
      showErrorToast(t('pollPresets.validationErrors.resultDurationRange'));
      return;
    }

    try {
      const presetToUpdate = presets.find(preset => preset._id === presetId);
      const response = await api.put(`/events/${eventId}/poll-presets/${presetId}`, {
        question: presetToUpdate.question,
        options: presetToUpdate.options.map(option => option.text).filter(option => option.trim() !== ''),
        duration: presetToUpdate.duration,
        deletionTimer: presetToUpdate.deletionTimer
      });
      setPresets(presets.map(preset => preset._id === presetId ? response.data : preset));
      setEditingPresetId(null);
      showSuccessToast(t('pollPresets.successUpdate'));
    } catch (error) {
      showErrorToast(t('pollPresets.errorUpdate') + ': ' + (error.response?.data?.details || error.message));
    }
  };

  const handleDeletePreset = async (presetId) => {
    try {
      await api.delete(`/events/${eventId}/poll-presets/${presetId}`);
      setPresets(presets.filter(preset => preset._id !== presetId));
      showSuccessToast(t('pollPresets.successDelete'));
    } catch (error) {
      showErrorToast(t('pollPresets.errorDelete'));
    }
  };

  const handleAddOption = (preset) => {
    if (preset.options.length < 5) {
      const updatedPreset = { ...preset, options: [...preset.options, { text: '', votes: 0 }] };
      setPresets(presets.map(p => p._id === preset._id ? updatedPreset : p));
    }
  };

  const handleRemoveOption = (preset, index) => {
    if (preset.options.length > 2) {
      const updatedOptions = preset.options.filter((_, i) => i !== index);
      const updatedPreset = { ...preset, options: updatedOptions };
      setPresets(presets.map(p => p._id === preset._id ? updatedPreset : p));
    }
  };

  const handleDeployPreset = async (preset) => {
    if (isActivePoll) {
      showErrorToast(t('pollPresets.activePollError'));
      return;
    }

    try {
      console.log('Deploying preset with data:', {
        question: preset.question,
        options: preset.options.map(option => option.text),
        duration: preset.duration,
        deletionTimer: preset.deletionTimer
      });

      const response = await api.post(`/events/${eventId}/deploy-poll`, {
        question: preset.question,
        options: preset.options.map(option => option.text),
        duration: preset.duration,
        deletionTimer: preset.deletionTimer
      });
      showSuccessToast(t('pollPresets.successDeploy'));
      setIsActivePoll(true);
      onClose();
    } catch (error) {
      showErrorToast(t('pollPresets.errorDeploy') + ': ' + (error.response?.data?.details || error.message));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t('pollPresets.title')}</h2>
      {presets.map(preset => (
        <div key={preset._id} className="border p-4 rounded-md">
          {editingPresetId === preset._id ? (
            <>
              <Input
                value={preset.question}
                onChange={(e) => setPresets(presets.map(p => p._id === preset._id ? { ...p, question: e.target.value } : p))}
                className="mb-2"
              />
              {preset.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const updatedOptions = [...preset.options];
                      updatedOptions[index] = { ...updatedOptions[index], text: e.target.value };
                      setPresets(presets.map(p => p._id === preset._id ? { ...p, options: updatedOptions } : p));
                    }}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(preset, index)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => handleAddOption(preset)} className="mb-2">
                <Plus className="h-4 w-4 mr-2" />
                {t('pollPresets.addOption')}
              </Button>
              <div className="flex items-center space-x-2">
                <Label htmlFor={`duration-${preset._id}`}>{t('pollPresets.duration')}</Label>
                <Input
                  id={`duration-${preset._id}`}
                  type="number"
                  value={preset.duration}
                  onChange={(e) => setPresets(presets.map(p => p._id === preset._id ? { ...p, duration: Number(e.target.value) } : p))}
                  min="10"
                  max="300"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="deletionTimer">{t('pollPresets.resultDuration')}</Label>
                <Input
                  id="deletionTimer"
                  type="number"
                  value={preset.deletionTimer}
                  onChange={(e) => setPresets(presets.map(p => 
                    p._id === preset._id ? { ...p, deletionTimer: Number(e.target.value) } : p
                  ))}
                  min="5"
                  max="300"
                  required
                />
              </div>
              <Button onClick={() => handleUpdatePreset(preset._id)} className="mt-2">{t('pollPresets.save')}</Button>
            </>
          ) : (
            <>
              <h3 className="font-semibold">{preset.question}</h3>
              <ul className="list-disc list-inside">
                {preset.options.map((option, index) => (
                  <li key={index}>{option.text}</li>
                ))}
              </ul>
              <p>{t('pollPresets.durationSeconds')}: {preset.duration} </p>
              <p>{t('pollPresets.resultDurationSeconds')}: {preset.deletionTimer} </p>
              <div className="flex space-x-2 mt-2">
                <Button onClick={() => setEditingPresetId(preset._id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('pollPresets.edit')}
                </Button>
                <Button variant="destructive" onClick={() => handleDeletePreset(preset._id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('pollPresets.delete')}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleDeployPreset(preset)}
                  disabled={isActivePoll}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t('pollPresets.deploy')}
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
      <div className="border p-4 rounded-md">
        <h3 className="font-semibold mb-2">{t('pollPresets.addNewPreset')}</h3>
        <Input
          value={newPreset.question}
          onChange={(e) => setNewPreset({ ...newPreset, question: e.target.value })}
          placeholder={t('pollPresets.questionPlaceholder')}
          className="mb-2"
        />
        {newPreset.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              value={option}
              onChange={(e) => {
                const updatedOptions = [...newPreset.options];
                updatedOptions[index] = e.target.value;
                setNewPreset({ ...newPreset, options: updatedOptions });
              }}
              placeholder={t('pollPresets.optionPlaceholder', { number: index + 1 })}
            />
            {index > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setNewPreset({ ...newPreset, options: newPreset.options.filter((_, i) => i !== index) })}>
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {newPreset.options.length < 5 && (
          <Button type="button" variant="outline" onClick={() => setNewPreset({ ...newPreset, options: [...newPreset.options, ''] })} className="mb-2">
            <Plus className="h-4 w-4 mr-2" />
            {t('pollPresets.addOption')}
          </Button>
        )}
        <div className="flex items-center space-x-2 mb-2">
          <Label htmlFor="new-preset-duration">{t('pollPresets.durationSeconds')}</Label>
          <Input
            id="new-preset-duration"
            type="number"
            value={newPreset.duration}
            onChange={(e) => setNewPreset({ ...newPreset, duration: Number(e.target.value) })}
            min="10"
            max="300"
            required
          />
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <Label htmlFor="new-preset-deletion-timer">{t('pollPresets.resultDurationSeconds')}</Label>
          <Input
            id="new-preset-deletion-timer"
            type="number"
            value={newPreset.deletionTimer}
            onChange={(e) => setNewPreset({ ...newPreset, deletionTimer: Number(e.target.value) })}
            min="5"
            max="300"
            required
          />
        </div>
        <Button onClick={handleAddPreset}>{t('pollPresets.addPreset')}</Button>
      </div>
    </div>
  );
}