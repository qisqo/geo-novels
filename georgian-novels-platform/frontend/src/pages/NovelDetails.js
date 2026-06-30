import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import CommentSection from '../components/CommentSection';

const NovelDetails = ({ darkMode }) => {
    const { id } = useParams();
    const [novel, setNovel] = useState(null);
    const user = localStorage.getItem('user');

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/novels/${id}`).then(res => setNovel(res.data));
    }, [id]);

    const handleRate = async (score) => {
        if (!user) return alert("შეფასებისთვის გაიარეთ ავტორიზაცია");
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/novels/${id}/rate`, {
                rating: score,
                username: user
            });
            setNovel({ ...novel, ratings: res.data.ratings });
        } catch (err) {
            alert("შეფასება ვერ მოხერხდა");
        }
    };

    const calculateAvg = () => {
        if (!novel?.ratings?.length) return "0.0";
        const sum = novel.ratings.reduce((a, b) => a + b.score, 0);
        return (sum / novel.ratings.length).toFixed(1);
    };

    if (!novel) return <div style={{ textAlign: 'center', padding: '50px' }}>იტვირთება...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <img src={novel.coverImage} alt={novel.title} style={{ width: '100%', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} />
                    
                    <div style={ratingBox(darkMode)}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f1c40f' }}>⭐ {calculateAvg()}</div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{novel.ratings?.length || 0} შეფასება</p>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button key={num} onClick={() => handleRate(num)} style={rateBtn}>{num}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ flex: '2', minWidth: '300px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{novel.title}</h1>
                    <h3 style={{ color: '#3498db', marginBottom: '20px' }}>{novel.author}</h3>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1rem', marginBottom: '30px' }}>{novel.description}</p>
                    
                    <h2>სარჩევი</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        {novel.chapters.map((chapter, index) => (
                            <Link key={index} to={`/read/${id}/${index}`} style={chapterLink(darkMode)}>
                                <span>თავი {index + 1}: {chapter.title}</span>
                                <span>➔</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* კომენტარების სექცია მთლიანი ნოველისთვის */}
            <CommentSection targetId={id} darkMode={darkMode} />
        </div>
    );
};

const ratingBox = (darkMode) => ({ marginTop: '20px', padding: '20px', borderRadius: '15px', backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9', textAlign: 'center' });
const rateBtn = { padding: '5px 10px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '5px', background: '#fff' };
const chapterLink = (darkMode) => ({ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: darkMode ? '#333' : '#fff', border: '1px solid #ddd', borderRadius: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 'bold' });

export default NovelDetails;
