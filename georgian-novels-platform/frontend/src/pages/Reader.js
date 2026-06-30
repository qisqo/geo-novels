import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CommentSection from '../components/CommentSection';

const Reader = ({ darkMode, fontSize, setFontSize }) => {
    const { id, chapterIndex } = useParams();
    const [novel, setNovel] = useState(null);
    const navigate = useNavigate();
    const idx = parseInt(chapterIndex);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/novels/${id}`).then(res => setNovel(res.data));
        window.scrollTo(0, 0); 
    }, [id, chapterIndex]);

    if (!novel) return <div style={{ textAlign: 'center', padding: '50px' }}>იტვირთება...</div>;

    const chapter = novel.chapters[idx];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={controlsStyle(darkMode)}>
                <Link to={`/novel/${id}`} style={{ textDecoration: 'none', color: '#3498db' }}>⬅ დაბრუნება</Link>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setFontSize(prev => prev - 2)} style={circleBtn}>A-</button>
                    <button onClick={() => setFontSize(prev => prev + 2)} style={circleBtn}>A+</button>
                </div>
            </div>

            <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>{chapter.title}</h1>
            
            <div style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: '1.8', 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'serif',
                textAlign: 'justify' 
            }}>
                {chapter.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '20px 0', borderTop: '1px solid #ddd' }}>
                <button 
                    disabled={idx === 0} 
                    onClick={() => navigate(`/read/${id}/${idx - 1}`)}
                    style={navBtn(idx === 0)}
                > წინა თავი </button>

                <button 
                    disabled={idx === novel.chapters.length - 1} 
                    onClick={() => navigate(`/read/${id}/${idx + 1}`)}
                    style={navBtn(idx === novel.chapters.length - 1)}
                > შემდეგი თავი </button>
            </div>

            {/* კომენტარების სექცია კონკრეტული თავისთვის */}
            <CommentSection targetId={`${id}-chapter-${idx}`} darkMode={darkMode} />
        </div>
    );
};

const controlsStyle = (darkMode) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '10px', borderBottom: '1px solid #ddd' });
const circleBtn = { width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #ccc', cursor: 'pointer', background: 'none', color: 'inherit' };
const navBtn = (disabled) => ({ padding: '12px 25px', borderRadius: '25px', border: 'none', backgroundColor: disabled ? '#ccc' : '#34495e', color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 'bold' });

export default Reader;
