import React, { useState } from 'react';

function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [text, setText] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Сначала выберите файл');
      return;
    }
    alert(`Будем загружать файл: ${selectedFile.name}`);
  };

  const handleTextSubmit = () => {
    alert(`Отправляем текст: ${text}`);
  };

  return (
    <div style={{ margin: '50px auto', maxWidth: '400px' }}>
      <h2>Загрузка файлов</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Загрузить</button>
      {selectedFile && <p>Выбрано: {selectedFile.name}</p>}

      <h2>Ввод текста</h2>
      <textarea
        style={{ width: '100%', height: '100px' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleTextSubmit}>Отправить</button>
    </div>
  );
}

export default DashboardPage;
