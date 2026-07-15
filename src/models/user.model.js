import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password_hash: {
      type: String,
      // Optional if logging in via Google/Github OAuth
      required: function () {
        return this.auth_provider === 'local';
      },
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar_url: {
      type: String,
      default: null,
    },
    social_links: {
      github: {
        provider_id: { type: String, default: null },
        username: { type: String, default: null },
      },
      google: {
        provider_id: { type: String, default: null },
        email: { type: String, default: null },
      },
    },
    auth_provider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    provider_id: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values for local users
      default: null,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose pre-save middleware to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password_hash') || !this.password_hash) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Instance method to check password validity
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(candidatePassword, this.password_hash);
};

const User = mongoose.model('User', userSchema);

export default User;
