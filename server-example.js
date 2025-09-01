// server.js - Express 백엔드 프록시 (선택사항)
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Supabase 클라이언트 (서버에서만)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // 서비스 키 사용
);

// 댓글 API 엔드포인트
app.get('/api/comments/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { item_id, content, author } = req.body;
    
    // 입력 검증
    if (!content || !author || content.length > 300) {
      return res.status(400).json({ error: '입력값이 올바르지 않습니다.' });
    }
    
    const { data, error } = await supabase
      .from('comments')
      .insert([{ item_id, content, author }]);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
