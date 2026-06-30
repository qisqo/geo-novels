import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditNovel = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [chapters, setChapters] = useState([]);

    const user = localStorage.getItem('user');

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/novels/${id}`).then(res => {
            setTitle(res.data.title);
            // FIX: was `author: setAuthor(...)` (labeled statement, a JS syntax quirk — sets nothing)
            setAuthor(res.data.author);
            setDescription(res.data.description);
            setCoverImage(res.data.coverImage || '');
            setChapters(res.data.chapters || []);
        });
    }, [id]);

    const handleChapterChange = (index, field, value) => {
        const updatedChapters = [...chapters];
        updatedChapters[index] = { ...updatedChapters[index], [field]: value };
        setChapters(updatedChapters);
    };

    const addChapter = () => setChapters([...chapters, { title: '', content: '' }]);
    const removeChapter = (index) => setChapters(chapters.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/novels/${id}`,
                { title, author, description, coverImage, chapters },
                { headers: { adminusername: user } }
            );
            alert('წარმატებით განახლდა!');
            navigate(`/novel/${id}`);
        } catch (err) {
            alert('შეცდომა განახლებისას!');
        }
    };

    const inputStyle = {
        padding: '12px', borderRadius: '8px', border: '1px solid #ccc',
        width: '100%', marginBottom: '12px', fontSize: '0.95rem', boxSizing: 'border-box'
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <h2>ნოველის რედაქტირება</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="სათაური" style={inputStyle} required />
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ავტორი" style={inputStyle} required />
                <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="ყდის სურათის URL" style={inputStyle} />

                {coverImage && (
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '8px' }}>წინასწარი ხედვა:</p>
                        <img src={coverImage} alt="Preview" style={{ width: '140px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} />
                    </div>
                )}

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="აღწერა"
                    style={{ ...inputStyle, height: '110px', resize: 'vertical', fontFamily: 'inherit' }}
                />

                <h3 style={{ marginBottom: '15px' }}>თავები</h3>
                {chapters.map((ch, index) => (
                    <div key={index} style={{ padding: '18px', border: '1px solid #ddd', borderRadius: '12px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0 }}>თავი {index + 1}</h4>
                            <button type="button" onClick={() => removeChapter(index)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                🗑️ წაშლა
                            </button>
                        </div>
                        <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                            placeholder="თავის სათაური"
                            style={inputStyle}
                        />
                        <textarea
                            value={ch.content}
                            onChange={(e) => handleChapterChange(index, 'content', e.target.value)}
                            placeholder="ტექსტი..."
                            style={{ ...inputStyle, height: '160px', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button type="button" onClick={addChapter} style={{ padding: '10px 18px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + თავის დამატება
                    </button>
                    <button type="submit" style={{ flex: 1, padding: '12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                        განახლება ✓
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditNovel;