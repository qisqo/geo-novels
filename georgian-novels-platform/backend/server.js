const nodemailer = require('nodemailer');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
app.use(cors());
app.use(express.json());

// --- SCHEMAS ---
const novelSchema = new mongoose.Schema({
    title: String,
    author: String,
    description: String,
    coverImage: String,
    ratings: [{ username: String, score: Number }],
    chapters: [{
        title: String,
        content: String,
        availableAt: { type: Date, default: () => new Date() } // 👈 NEW: for early access
    }],
    createdAt: { type: Date, default: Date.now }
});
const Novel = mongoose.model('Novel', novelSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    nickname: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    subscriptionStatus: { type: String, default: 'free' },
    subscriptionExpiresAt: { type: Date, default: null },  // 👈 NEW
    favorites: [{ type: String }]  // 👈 FIXED: was missing, caused silent failures
});
const User = mongoose.model('User', userSchema);

const commentSchema = new mongoose.Schema({
    targetId: String,
    username: String,
    nickname: String,
    profilePicture: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', commentSchema);

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ROUTES ---

// 1. Novels Fetching
app.get('/api/novels', async (req, res) => {
    try {
        const novels = await Novel.find().sort({ createdAt: -1 });
        res.json(novels);
    } catch (err) {
        res.status(500).json({ message: "Error fetching novels" });
    }
});

app.get('/api/novels/:id', async (req, res) => {
    try {
        const novel = await Novel.findById(req.params.id);
        if (!novel) return res.status(404).json({ message: "Novel not found" });
        res.json(novel);
    } catch (err) {
        res.status(500).json({ message: "Error fetching novel details" });
    }
});

// 2. Rating Logic
app.post('/api/novels/:id/rate', async (req, res) => {
    try {
        const { rating, username } = req.body;
        const novel = await Novel.findById(req.params.id);
        if (!novel) return res.status(404).json({ message: "Novel not found" });

        novel.ratings = novel.ratings.filter(r => r.username !== username);
        novel.ratings.push({ username, score: Number(rating) });

        await novel.save();
        res.json({ ratings: novel.ratings });
    } catch (err) {
        res.status(500).json({ message: "Error saving rating" });
    }
});

// 3. Favorites
app.post('/api/users/favorite', async (req, res) => {
    try {
        const { username, novelId } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "მომხმარებელი არ მოიძებნა" });

        const isFavorite = user.favorites.includes(novelId);
        if (isFavorite) {
            user.favorites = user.favorites.filter(id => id.toString() !== novelId);
        } else {
            user.favorites.push(novelId);
        }

        await user.save();
        res.json({ success: true, favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: "სერვერის შეცდომა" });
    }
});

app.get('/api/users/favorites/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: "მომხმარებელი არ მოიძებნა" });
        res.json(user.favorites);
    } catch (err) {
        res.status(500).json({ message: "შეცდომა ფავორიტების წამოღებისას" });
    }
});

// 4. Comments
app.get('/api/comments/:targetId', async (req, res) => {
    const comments = await Comment.find({ targetId: req.params.targetId }).sort({ createdAt: -1 });
    res.json(comments);
});

app.post('/api/comments', async (req, res) => {
    const { targetId, username, text } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "User not found" });

    const newComment = new Comment({
        targetId,
        username,
        nickname: user.nickname || user.username,
        profilePicture: user.profilePicture || 'https://via.placeholder.com/150',
        text
    });
    await newComment.save();
    res.status(201).json(newComment);
});

app.delete('/api/comments/:novelId/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { role } = req.body;

        if (role !== 'admin') {
            return res.status(403).json({ message: "ამ მოქმედების უფლება გაქვთ მხოლოდ ადმინისტრატორს!" });
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId);
        if (!deletedComment) {
            return res.status(404).json({ message: "კომენტარი ვერ მოიძებნა ან უკვე წაშლილია" });
        }

        res.json({ success: true, message: "კომენტარი წარმატებით წაიშალა!" });
    } catch (err) {
        console.error("კომენტარის წაშლის შეცდომა:", err);
        res.status(500).json({ message: "სერვერის შეცდომა კომენტარის წაშლისას." });
    }
});

// 5. User Profile
app.get('/api/users/profile/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
});

app.put('/api/users/profile/:username', async (req, res) => {
    const { nickname, profilePicture } = req.body;
    if (nickname) {
        const existing = await User.findOne({ nickname, username: { $ne: req.params.username } });
        if (existing) return res.status(400).json({ message: "ნიკნეიმი დაკავებულია" });
    }
    await User.findOneAndUpdate({ username: req.params.username }, { nickname, profilePicture });
    res.json({ message: "Profile updated" });
});

// 6. Auth
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "მომხმარებელი ან იმეილი უკვე არსებობს!" });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            username,
            email,
            password,
            isVerified: false,
            verificationCode
        });

        await newUser.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'GEO NOVELS - იმეილის ვერიფიკაცია',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2>მოგესალმებით ქართული ნოველების პლატფორმაზე!</h2>
                    <p>თქვენი რეგისტრაციის დასასრულებლად გთხოვთ გამოიყენოთ ქვემოთ მოცემული კოდი:</p>
                    <h1 style="color: #3498db; letter-spacing: 5px; text-align: center;">${verificationCode}</h1>
                    <p>თუ ეს თქვენ არ იყავით, უგულებელყავით ეს წერილი.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Nodemailer შეცდომა კოდის გაგზავნისას:", error);
            } else {
                console.log("✅ Email წარმატებით გაიგზავნა: " + info.response);
            }
        });

        res.status(201).json({ message: "რეგისტრაცია წარმატებულია! კოდი გაიგზავნა იმეილზე." });

    } catch (err) {
        console.error("❌ დეტალური შეცდომა რეგისტრაციისას ბაზაში:", err);
        res.status(500).json({ message: err.message || "სერვერის შეცდომა რეგისტრაციისას." });
    }
});

app.post('/api/users/verify', async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "მომხმარებელი ვერ მოიძებნა." });
        }

        if (user.verificationCode === code) {
            user.isVerified = true;
            user.verificationCode = null;
            await user.save();
            return res.json({ success: true, message: "იმეილი წარმატებით დადასტურდა!" });
        } else {
            return res.status(400).json({ success: false, message: "არასწორი კოდი, სცადეთ თავიდან." });
        }

    } catch (err) {
        res.status(500).json({ message: "სერვერის შეცდომა ვერიფიკაციისას." });
    }
});

// 🔧 FIXED LOGIN: now returns subscriptionStatus and subscriptionExpiresAt
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find by username only first, then check password separately for clearer errors
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "არასწორი მომხმარებელი ან პაროლი!" });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "თქვენი ანგარიში არ არის აქტიური. გთხოვთ, ჯერ დაადასტუროთ ელ-ფოსტა!"
            });
        }

        // Auto-expire subscription if needed
        if (user.subscriptionStatus === 'premium' &&
            user.subscriptionExpiresAt &&
            user.subscriptionExpiresAt < new Date()) {
            user.subscriptionStatus = 'free';
            user.subscriptionExpiresAt = null;
            await user.save();
        }

        // 👇 NOW returns all fields the frontend needs
        res.json({
            user: user.username,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionExpiresAt: user.subscriptionExpiresAt
        });

    } catch (err) {
        console.error("ლოგინის შეცდომა:", err);
        res.status(500).json({ message: "სერვერის შეცდომა ავტორიზაციისას." });
    }
});

// ──────────────────────────────────────────────────────────────
// 7. SUBSCRIPTION ROUTES (NEW)
// ──────────────────────────────────────────────────────────────

// Activate / extend premium (call this after payment confirmation)
// Body: { username, months }
app.post('/api/subscription/upgrade', async (req, res) => {
    try {
        const { username, months = 1 } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "მომხმარებელი ვერ მოიძებნა" });

        // Extend from current expiry if still active, otherwise from now
        const base =
            user.subscriptionStatus === 'premium' &&
            user.subscriptionExpiresAt &&
            user.subscriptionExpiresAt > new Date()
                ? new Date(user.subscriptionExpiresAt)
                : new Date();

        base.setMonth(base.getMonth() + Number(months));

        user.subscriptionStatus = 'premium';
        user.subscriptionExpiresAt = base;
        await user.save();

        res.json({
            message: `პრემიუმი გააქტიურდა ${base.toLocaleDateString('ka-GE')}-მდე`,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionExpiresAt: user.subscriptionExpiresAt
        });
    } catch (err) {
        console.error("Upgrade error:", err);
        res.status(500).json({ message: "სერვერის შეცდომა" });
    }
});

// Cancel subscription
// Body: { username }
app.post('/api/subscription/cancel', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "მომხმარებელი ვერ მოიძებნა" });

        user.subscriptionStatus = 'free';
        user.subscriptionExpiresAt = null;
        await user.save();

        res.json({ message: "გამოწერა გაუქმებულია" });
    } catch (err) {
        res.status(500).json({ message: "სერვერის შეცდომა" });
    }
});

// Admin: manually grant premium to any user
// Body: { adminUsername, targetUsername, months }
app.post('/api/subscription/admin-grant', async (req, res) => {
    try {
        const { adminUsername, targetUsername, months = 1 } = req.body;

        const admin = await User.findOne({ username: adminUsername });
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: "მხოლოდ ადმინს შეუძლია ეს მოქმედება" });
        }

        const target = await User.findOne({ username: targetUsername });
        if (!target) return res.status(404).json({ message: "მომხმარებელი ვერ მოიძებნა" });

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + Number(months));

        target.subscriptionStatus = 'premium';
        target.subscriptionExpiresAt = expiresAt;
        await target.save();

        res.json({
            message: `${targetUsername}-ს პრემიუმი გაეცა ${expiresAt.toLocaleDateString('ka-GE')}-მდე`
        });
    } catch (err) {
        res.status(500).json({ message: "სერვერის შეცდომა" });
    }
});

// ──────────────────────────────────────────────────────────────
// 8. CHAPTER EARLY ACCESS (NEW)
// ──────────────────────────────────────────────────────────────

// Read a chapter — checks if user is premium for locked chapters
// Query param: ?username=xxx
app.get('/api/novels/:novelId/chapters/:chapterIndex', async (req, res) => {
    try {
        const { novelId, chapterIndex } = req.params;
        const { username } = req.query;

        const novel = await Novel.findById(novelId);
        if (!novel) return res.status(404).json({ message: "ნოველა ვერ მოიძებნა" });

        const chapter = novel.chapters[Number(chapterIndex)];
        if (!chapter) return res.status(404).json({ message: "თავი ვერ მოიძებნა" });

        const now = new Date();
        const isAvailableNow = !chapter.availableAt || chapter.availableAt <= now;

        if (isAvailableNow) {
            return res.json(chapter);
        }

        // Chapter is locked — check if user is premium
        if (!username) {
            return res.status(403).json({
                message: "ეს თავი ჯერ არ არის ხელმისაწვდომი",
                availableAt: chapter.availableAt,
                requiresPremium: true
            });
        }

        const user = await User.findOne({ username });
        const isPremium =
            user &&
            user.subscriptionStatus === 'premium' &&
            user.subscriptionExpiresAt &&
            user.subscriptionExpiresAt > now;

        const isAdmin = user && user.role === 'admin';

        if (isPremium || isAdmin) {
            return res.json({ ...chapter.toObject(), isEarlyAccess: true });
        }

        const hoursLeft = Math.ceil((chapter.availableAt - now) / 3600000);
        return res.status(403).json({
            message: `ეს თავი ${hoursLeft} საათში გაიხსნება ყველასთვის. ადრე წასაკითხად გამოიწერე პრემიუმი.`,
            availableAt: chapter.availableAt,
            requiresPremium: true
        });

    } catch (err) {
        console.error("Chapter fetch error:", err);
        res.status(500).json({ message: "სერვერის შეცდომა" });
    }
});

// Admin: add chapter with early access delay
// Body: { title, content, earlyAccessHours (default 24) }
app.post('/api/novels/:novelId/chapters', async (req, res) => {
    try {
        const { title, content, earlyAccessHours = 24 } = req.body;

        const novel = await Novel.findById(req.params.novelId);
        if (!novel) return res.status(404).json({ message: "ნოველა ვერ მოიძებნა" });

        const availableAt = new Date();
        availableAt.setHours(availableAt.getHours() + Number(earlyAccessHours));

        novel.chapters.push({ title, content, availableAt });
        await novel.save();

        res.status(201).json({
            message: `თავი დაემატა. უფასო მომხმარებლები წაიკითხავენ: ${availableAt.toLocaleString('ka-GE')}`,
            availableAt
        });
    } catch (err) {
        res.status(500).json({ message: "სერვერის შეცდომა" });
    }
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log("სატესტო EMAIL_USER ცვლადი:", process.env.EMAIL_USER);
    console.log("სატესტო EMAIL_PASS ცვლადი:", process.env.EMAIL_PASS);

    transporter.verify((error, success) => {
        if (error) {
            console.error("❌ Nodemailer Config Error:", error.message);
        } else {
            console.log("✅ Nodemailer მზად არის იმეილების გასაგზავნად!");
        }
    });
});
