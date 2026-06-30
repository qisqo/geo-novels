const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    isVerified: { type: Boolean, default: false },
    // ეს არის ახალი ველი, რომელიც შეინახავს ფავორიტების ID-ებს
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Novel' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);