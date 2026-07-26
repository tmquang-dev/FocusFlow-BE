import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
      // TTL Index: deletes document when current time matches or exceeds expires_at
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['register', 'forgot_password'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
