import mongoose from 'mongoose';

const pomodoroSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 1500, // 25 minutes in seconds
    },
    start_time: {
      type: Date,
      required: true,
    },
    expected_end_time: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['RUNNING', 'PAUSED', 'COMPLETED', 'INTERRUPTED'],
      default: 'RUNNING',
    },
    paused_at: {
      type: Date,
      default: null,
    },
    remaining_seconds: {
      type: Number,
      default: null,
    },
  },
  {
    // Map Mongoose automatic createdAt to created_at and disable updatedAt
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

const PomodoroSession = mongoose.model('PomodoroSession', pomodoroSessionSchema);

export default PomodoroSession;
