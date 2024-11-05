const Poll = require('../models/Poll');
const Event = require('../models/Event');

exports.createPoll = async (req, res) => {
  try {
    const { question, options, duration, deletionTimer, type } = req.body;
    const eventId = req.params.eventId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Not authorized to create polls for this event' });
    }

    const endTime = new Date(Date.now() + duration * 1000);

    let pollOptions;
    switch (type) {
      case 'yes-no':
        pollOptions = [{ text: 'Yes' }, { text: 'No' }];
        break;
      case 'rating':
        pollOptions = [
          { text: '1' },
          { text: '2' },
          { text: '3' },
          { text: '4' },
          { text: '5' }
        ];
        break;
      default:
        pollOptions = options.map(option => ({ text: option }));
    }

    const newPoll = new Poll({
      event: eventId,
      type,
      question,
      options: pollOptions,
      createdBy: req.user.id,
      duration,
      deletionTimer: deletionTimer || 20,
      endTime
    });

    await newPoll.save();

    // Schedule poll ending
    setTimeout(() => endPoll(newPoll._id, req.app.locals.io), duration * 1000);

    // Emit socket event to notify clients about the new poll
    req.app.locals.io.to(eventId).emit('new poll', newPoll);

    res.status(201).json(newPoll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const endPoll = async (pollId, io) => {
  try {
    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) return;

    poll.isActive = false;
    poll.endedAt = new Date();
    await poll.save();

    // Emit socket event to notify clients that the poll has ended
    io.to(poll.event.toString()).emit('poll ended', poll);

    // Use the custom deletionTimer from the poll
    setTimeout(async () => {
      // Delete the poll from database
      await Poll.findByIdAndDelete(pollId);
      // Notify clients to remove the poll
      io.to(poll.event.toString()).emit('poll removed', pollId);
    }, poll.deletionTimer * 1000);
  } catch (error) {
    console.error('Error ending poll:', error);
  }
};

exports.getActivePoll = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // First check for active polls
    let poll = await Poll.findOne({ event: eventId, isActive: true });
    
    // If no active poll, check for recently ended polls
    if (!poll) {
      const recentlyEndedPoll = await Poll.findOne({
        event: eventId,
        isActive: false,
        endedAt: { $ne: null }
      }).sort({ endedAt: -1 });

      if (recentlyEndedPoll) {
        const timeSinceEnd = Date.now() - new Date(recentlyEndedPoll.endedAt).getTime();
        
        // If the poll has exceeded its deletion timer, delete it
        if (timeSinceEnd >= recentlyEndedPoll.deletionTimer * 1000) {
          await Poll.findByIdAndDelete(recentlyEndedPoll._id);
          req.app.locals.io.to(eventId).emit('poll removed', recentlyEndedPoll._id);
          poll = null;
        } else {
          // Only return the poll if it's still within its deletion timer window
          poll = recentlyEndedPoll;
          
          // Set up deletion timer for the remaining time
          const remainingTime = (recentlyEndedPoll.deletionTimer * 1000) - timeSinceEnd;
          setTimeout(async () => {
            await Poll.findByIdAndDelete(recentlyEndedPoll._id);
            req.app.locals.io.to(eventId).emit('poll removed', recentlyEndedPoll._id);
          }, remainingTime);
        }
      }
    }

    res.json({ activePoll: poll });
  } catch (error) {
    console.error('Error fetching active poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const pollId = req.params.pollId;

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(404).json({ error: 'Active poll not found' });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }

    // If you want to prevent duplicate votes, you can use IP address for anonymous users
    const voterIdentifier = req.user ? req.user.id : req.ip;

    // Check if this identifier has already voted
    if (poll.voters && poll.voters.find(voter => voter.userId === voterIdentifier)) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    poll.options[optionIndex].votes += 1;
    
    // Add the voter to the list of voters
    if (!poll.voters) poll.voters = [];
    poll.voters.push({ userId: voterIdentifier, optionIndex });

    await poll.save();

    // Emit socket event to update poll results in real-time
    req.app.locals.io.to(poll.event.toString()).emit('poll update', poll);

    res.json(poll);
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.endPoll = async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Not authorized to end this poll' });
    }

    poll.isActive = false;
    await poll.save();

    // Emit socket event to notify clients that the poll has ended
    req.app.locals.io.to(poll.event.toString()).emit('poll ended', poll);

    // Use the custom deletionTimer from the poll
    setTimeout(() => {
      req.app.locals.io.to(poll.event.toString()).emit('poll removed', poll._id);
    }, poll.deletionTimer * 1000);

    res.json(poll);
  } catch (error) {
    console.error('Error ending poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserVote = async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const voterIdentifier = req.user ? req.user.id : req.ip;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const userVote = poll.voters.find(voter => voter.userId === voterIdentifier);
    if (userVote) {
      res.json({ hasVoted: true, optionIndex: userVote.optionIndex });
    } else {
      res.json({ hasVoted: false });
    }
  } catch (error) {
    console.error('Error getting user vote:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPollHistory = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const polls = await Poll.find({ event: eventId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');

    res.json(polls);
  } catch (error) {
    console.error('Error fetching poll history:', error);
    res.status(500).json({ error: 'Server error' });
  }
};