import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Home = ({ darkMode, onOpenLogin }) => {
    const [novels, setNovels] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [userFavorites, setUserFavorites] = useState([]);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [loading, setLoading] = useState(true); // დავამატოთ ჩატვირთვის სტატუსი

    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    const fetchNovels = () => {
        axios.get('${process.env.REACT_APP_API_URL}/api/novels')
            .then(res => {
                setNovels(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchNovels();
        if (user) {
            axios.get(`${process.env.REACT_APP_API_URL}/api/users/favorites/${user}`)
                .then(res => setUserFavorites(res.data))
                .catch(err => console.log("Favorites fetch error:", err));
        }
    }, [user]);

    const handleReadClick = (id) => {
        if (user) {
            navigate(`/novel/${id}`);
        } else {
            if (typeof onOpenLogin === 'function') {
                onOpenLogin();
            } else {
                alert("გთხოვთ გაიაროთ ავტორიზაცია!");
            }
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("დარწმუნებული ხართ, რომ გსურთ წაშლა?")) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/novels/${id}`, {
                    headers: { adminusername: user }
                });
                alert("წაიშალა!");
                fetchNovels();
            } catch (err) {
                alert("წაშლა ვერ მოხერხდა.");
            }
        }
    };

    const toggleFavorite = async (e, novelId) => {
        e.stopPropagation();
        if (!user) {
            if (typeof onOpenLogin === 'function') return onOpenLogin();
            return alert("გთხოვთ გაიაროთ ავტორიზაცია!");
        }
        try {
            const res = await axios.post('${process.env.REACT_APP_API_URL}/api/users/favorite', { username: user, novelId });
            if (res.data.isFavorite) setUserFavorites(prev => [...prev, novelId]);
            else setUserFavorites(prev => prev.filter(id => id !== novelId));
        } catch (err) {
            console.log("Favorite toggle error");
        }
    };

    const calculateAvg = (ratings) => {
        if (!ratings || !Array.isArray(ratings) || ratings.length === 0) return "0.0";
        // ვფილტრავთ მხოლოდ ვალიდურ ობიექტებს
        const validRatings = ratings.filter(r => r && typeof r === 'object' && r.score !== undefined);
        if (validRatings.length === 0) return "0.0";
        const sum = validRatings.reduce((a, b) => a + b.score, 0);
        return (sum / validRatings.length).toFixed(1);
    };

    const filteredNovels = novels.filter(n => 
        (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.author.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (showOnlyFavorites ? userFavorites.includes(n._id) : true)
    );

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>იტვირთება...</div>;

    return (
        <div style={{ padding: '40px 20px' }}>
            <h1 style={{ textAlign: 'center' }}>ქართული ნოველების ბიბლიოთეკა</h1>
            <div style={{ maxWidth: '600px', margin: '20px auto 40px auto', textAlign: 'center' }}>
                <input type="text" placeholder="მოძებნე..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
                {user && <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} style={favToggleStyle}>{showOnlyFavorites ? 'ყველა' : '❤️ ფავორიტები'}</button>}
            </div>
            {role === 'admin' && <div style={{ textAlign: 'center', marginBottom: '40px' }}><Link to="/add"><button style={addBtn}>+ დამატება</button></Link></div>}
            
            <div style={gridStyle}>
                {filteredNovels.map((novel) => (
                    <div key={novel._id} style={{ ...cardStyle, backgroundColor: darkMode ? '#2a2a2a' : '#fff' }}>
                        <div style={{ position: 'relative' }}>
                            <img src={novel.coverImage} alt={novel.title} style={imgStyle} />
                            <div style={ratingBadge}>⭐ {calculateAvg(novel.ratings)}</div>
                            <button onClick={(e) => toggleFavorite(e, novel._id)} style={heartBtnStyle}>
                                {userFavorites.includes(novel._id) ? '❤️' : '🤍'}
                            </button>
                            
                            {role === 'admin' && (
                                <button onClick={(e) => handleDelete(e, novel._id)} style={deleteBtnStyle}>🗑️</button>
                            )}
                        </div>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ color: darkMode ? '#fff' : '#000' }}>{novel.title}</h3>
                            <p style={{ opacity: 0.7, color: darkMode ? '#ccc' : '#666' }}>{novel.author}</p>
                            <button onClick={() => handleReadClick(novel._id)} style={readBtn}>წაკითხვა</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// სტილები უცვლელია
const inputStyle = { width: '100%', padding: '12px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none' };
const favToggleStyle = { marginTop: '10px', padding: '8px 15px', borderRadius: '20px', border: 'none', backgroundColor: '#3498db', color: '#fff', cursor: 'pointer' };
const addBtn = { padding: '10px 20px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' };
const cardStyle = { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const imgStyle = { width: '100%', height: '350px', objectFit: 'cover' };
const ratingBadge = { position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '3px 8px', borderRadius: '10px' };
const heartBtnStyle = { position: 'absolute', top: '10px', right: '10px', background: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' };
const deleteBtnStyle = { position: 'absolute', top: '10px', left: '10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' };
const readBtn = { width: '100%', marginTop: '15px', padding: '10px', background: '#34495e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

export default Home;
