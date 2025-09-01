// comments.js
// 댓글 UI 및 기능 모듈화

export function createCommentSection(itemId) {
    const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const container = document.createElement('div');
    container.className = 'comment-section';
    container.innerHTML = `

        <div class="comments-list" id="comments-list-${safeId}">
            <div class="no-comments">작성된 댓글이 없습니다.</div>
        </div>
        <div class="comment-form">
            <input 
                type="text"
                id="comment-author-${safeId}"
                placeholder="작성자 이름"
                maxlength="8"
                class="comment-author-input stylish-author-input"
                style="margin-bottom:12px;width:100%;box-sizing:border-box;border-radius:8px;padding:12px 16px;border:1.5px solid #d1d5db;font-size:16px;background:#f8f9fa;transition:border-color 0.2s;"
            />
            <textarea 
                id="comment-content-${safeId}" 
                placeholder="댓글을 작성해주세요 (최대 300자)" 
                maxlength="300"
                rows="3"
            ></textarea>
            <div class="comment-form-bottom">
                <span class="char-count" id="char-count-${safeId}">0/300</span>
                <button class="comment-submit" id="comment-submit-${safeId}">댓글 작성</button>
            </div>
        </div>
    `;
    // 글자 수 카운터 이벤트 리스너 추가
    const textarea = container.querySelector(`#comment-content-${safeId}`);
    const charCount = container.querySelector(`#char-count-${safeId}`);
    const submitBtn = container.querySelector(`#comment-submit-${safeId}`);
    if (textarea && charCount && submitBtn) {
        textarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = `${length}/300`;
            charCount.className = length > 250 ? 'char-count warning' : 'char-count';
            submitBtn.disabled = length === 0 || length > 300;
        });
    }
    return container;
}

export async function loadComments(itemId) {
    const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const commentsList = document.getElementById(`comments-list-${safeId}`);
    const commentCount = document.getElementById(`comment-count-${safeId}`);
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            if (!window.supabaseClient) {
                const supabaseUrl = 'https://pimgwrosozsowpetqeeq.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbWd3cm9zb3pzb3dwZXRxZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTcxMjgsImV4cCI6MjA3MDk5MzEyOH0.VKEsxMu47TDVvV93Gy9I-z4UmfNYlNEhSYkBSS5vDqU';
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            }
            const supabaseClient = window.supabaseClient;
            const { data: comments, error } = await supabaseClient
                .from('comments')
                .select('*')
                .eq('item_id', itemId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Supabase 댓글 로드 오류:', error);
                throw error;
            }
            if (commentCount) {
                commentCount.textContent = `(${comments.length})`;
            }
            if (commentsList) {
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="no-comments">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</div>';
                } else {
                    commentsList.innerHTML = comments.map(comment => {
                        const date = new Date(comment.created_at).toLocaleString('ko-KR', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        const escapeHtml = (text) => {
                            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
                            return text.replace(/[&<>"']/g, function(m) { return map[m]; });
                        };
                        return `
                            <div class="comment-item" style="display:flex;justify-content:space-between;align-items:center;">
                                <div style="flex:1;">
                                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                                    <div class="comment-date">${date}</div>
                                </div>
                                <div class="comment-author" style="margin-left:16px;color:#888;font-size:13px;white-space:nowrap;">${escapeHtml(comment.author || '')}</div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } else {
            throw new Error('Supabase 라이브러리가 로드되지 않았습니다');
        }
    } catch (error) {
        console.error('댓글 로드 실패:', error);
        if (commentsList) {
            commentsList.innerHTML = '<div class="no-comments">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</div>';
        }
        if (commentCount) {
            commentCount.textContent = '(0)';
        }
    }
}

export async function submitComment(itemId) {
    const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const contentElement = document.getElementById(`comment-content-${safeId}`);
    const authorElement = document.getElementById(`comment-author-${safeId}`);
    if (!contentElement || !authorElement) {
        console.error('댓글 입력 요소를 찾을 수 없습니다');
        return;
    }
    const content = contentElement.value.trim();
    const author = authorElement.value.trim();
    if (!author) {
        alert('작성자 이름을 입력해주세요.');
        return;
    }
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }
    if (content.length > 300) {
        alert('댓글은 300자 이내로 작성해주세요.');
        return;
    }
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            if (!window.supabaseClient) {
                const supabaseUrl = 'https://pimgwrosozsowpetqeeq.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbWd3cm9zb3pzb3dwZXRxZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTcxMjgsImV4cCI6MjA3MDk5MzEyOH0.VKEsxMu47TDVvV93Gy9I-z4UmfNYlNEhSYkBSS5vDqU';
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            }
            const supabaseClient = window.supabaseClient;
            const { data, error } = await supabaseClient
                .from('comments')
                .insert([
                    {
                        item_id: itemId,
                        content: content,
                        author: author
                    }
                ]);
            if (error) {
                console.error('Supabase 오류:', error);
                throw error;
            }
            contentElement.value = '';
            const charCount = document.getElementById(`char-count-${safeId}`);
            if (charCount) {
                charCount.textContent = '0/300';
                charCount.className = 'char-count';
            }
            const submitBtn = document.getElementById(`comment-submit-${safeId}`);
            if (submitBtn) {
                submitBtn.disabled = true;
            }
            await loadComments(itemId);
        } else {
            throw new Error('Supabase 라이브러리가 로드되지 않았습니다');
        }
    } catch (error) {
        console.error('댓글 저장 실패:', error);
        alert('댓글 저장 중 오류가 발생했습니다. Supabase 설정을 확인해주세요.');
    }
}

// 전역 등록 (model.html에서 window로도 접근 가능하게)
window.createCommentSection = createCommentSection;
window.loadComments = loadComments;
window.submitComment = submitComment;
