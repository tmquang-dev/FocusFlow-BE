import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    seq_value: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    versionKey: false, // Disables __v field
  }
);

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
