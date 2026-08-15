import mongoose from 'mongoose';
import Counter from './counter.model.js';

const taskSchema = new mongoose.Schema(
  {
    task_num: {
      type: Number,
      // Automatically assigned via pre-save hook, but required at the schema level
      required: false,
    },
    workspace_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'DONE'],
      default: 'BACKLOG',
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate task numbers in the same workspace
taskSchema.index({ workspace_id: 1, task_num: 1 }, { unique: true });

// Pre-save hook to automatically assign incremented task_num for new tasks
taskSchema.pre('save', async function () {
  if (!this.isNew || this.task_num != null) {
    return;
  }

  let counter;
  try {
    counter = await Counter.findByIdAndUpdate(
      this.workspace_id,
      { $inc: { seq_value: 1 } },
      { returnDocument: 'after', upsert: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      counter = await Counter.findByIdAndUpdate(
        this.workspace_id,
        { $inc: { seq_value: 1 } },
        { returnDocument: 'after', upsert: true }
      );
    } else {
      throw err;
    }
  }

  this.task_num = counter.seq_value;
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
