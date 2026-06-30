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
        axios.get(`process.env.REACT_APP_API_URL/api/novels/${id}`).then(res => {
            setTitle(res.data.title);
            setAuthor(res.data.author)
            setDescription(res.data.description);
            setCoverImage(res.data.coverImage || '');
            setChapters(res.data.chapters || []);
        });
    }, [id]);

    const handleChapterChange = (index, field, value) => {
        const updatedChapters = [...chapters];
        updatedChapters[index][field] = value;
        setChapters(updatedChapters);
    };

    const addChapter = () => setChapters([...chapters, { title: '', content: '' }]);
    const removeChapter = (index) => setChapters(chapters.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`process.env.REACT_APP_API_URL/api/novels/${id}`, 
                { title, author, description, coverImage, chapters },
                { headers: { adminusername: user } }
            );
            alert("წარმატებით განახლდა!");
            navigate(`/novel/${id}`);
        } catch (err) {
            alert("შეცდომა განახლებისას!");
        }
    };

    const inputStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', marginBottom: '10px' };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <h2>ნოველის რედაქტირება</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="სათაური" style={inputStyle} />
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ავტორი" style={inputStyle} />
                <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="ყდის სურათის URL" style={inputStyle} />
                
                {coverImage && (
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <p>წინასწარი ხედვა:</p>
                        <img src={coverImage} alt="Preview" style={{ width: '150px', borderRadius: '10px' }} />
                    </div>
                )}

                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="აღწერა" style={{...inputStyle, height: '100px'}} />
                
                <h3>თავები</h3>
                {chapters.map((ch, index) => (
                    <div key={index} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', marginBottom: '20px' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <h4>თავი {index + 1}</h4>
                            <button type="button" onClick={() => removeChapter(index)} style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer'}}>წაშლა</button>
                        </div>
                        <input type="text" value={ch.title} onChange={(e) => handleChapterChange(index, 'title', e.target.value)} placeholder="თავის სათაური" style={inputStyle} />
                        <textarea value={ch.content} onChange={(e) => handleChapterChange(index, 'content', e.target.value)} placeholder="ტექსტი..." style={{...inputStyle, height: '150px'}} />
                    </div>
                ))}
                <button type="button" onClick={addChapter} style={{ padding: '10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>+ თავის დამატება</button>
                <button type="submit" style={{ width: '100%', padding: '15px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}>განახლება</button>
            </form>
        </div>
    );
};

export default EditNovel;
