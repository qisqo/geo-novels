import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddNovel = () => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState(''); // This is for your thumbnail URL
    const [chapters, setChapters] = useState([{ title: '', content: '' }]);
    const navigate = useNavigate();

    const user = localStorage.getItem('user');

    const handleChapterChange = (index, field, value) => {
        const newChapters = [...chapters];
        newChapters[index][field] = value;
        setChapters(newChapters);
    };

    const addChapter = () => setChapters([...chapters, { title: '', content: '' }]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('process.env.REACT_APP_API_URL/api/novels', 
                { title, author, description, coverImage, chapters },
                { headers: { adminusername: user } }
            );
            alert("ნოველა წარმატებით დაემატა!");
            navigate('/');
        } catch (err) {
            alert("შეცდომა დამატებისას. დარწმუნდით რომ ადმინი ხართ.");
        }
    };

    const inputStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', marginBottom: '10px' };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
            <h2>ახალი ნოველის დამატება</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="სათაური" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
                <input type="text" placeholder="ავტორი" value={author} onChange={(e) => setAuthor(e.target.value)} style={inputStyle} required />
                <input type="text" placeholder="ყდის სურათის URL (Thumbnail)" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} style={inputStyle} />
                <textarea placeholder="აღწერა" value={description} onChange={(e) => setDescription(e.target.value)} style={{...inputStyle, height: '100px'}} required />
                
                <h3>თავები</h3>
                {chapters.map((ch, index) => (
                    <div key={index} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', marginBottom: '15px' }}>
                        <input type="text" placeholder={`თავი ${index + 1}-ის სათაური`} value={ch.title} onChange={(e) => handleChapterChange(index, 'title', e.target.value)} style={inputStyle} required />
                        <textarea placeholder="ტექსტი..." value={ch.content} onChange={(e) => handleChapterChange(index, 'content', e.target.value)} style={{...inputStyle, height: '150px'}} required />
                    </div>
                ))}
                <button type="button" onClick={addChapter} style={{ padding: '10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>+ თავის დამატება</button>
                <button type="submit" style={{ width: '100%', padding: '15px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}>შენახვა</button>
            </form>
        </div>
    );
};

export default AddNovel;
