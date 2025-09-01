// 댓글 UI 및 기능 모듈화

export function createCommentSection(itemId) {
    const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const container = document.createElement('div');
    container.className = 'comment-section';
    container.innerHTML = `
        <h3 style="text-align: left;">댓글 <span class="comment-count" id="comment-count-${safeId}">(0)</span></h3>
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
                style="width:100%;box-sizing:border-box;border-radius:8px;padding:12px 16px;border:1.5px solid #d1d5db;font-size:14px;background:#f8f9fa;resize:vertical;min-height:80px;"
            ></textarea>
            <div class="comment-form-bottom" style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                <span class="char-count" id="char-count-${safeId}" style="font-size:12px;color:#666;">0/300</span>
                <button class="comment-submit" id="comment-submit-${safeId}" disabled style="background:#6366f1;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;">댓글 작성</button>
            </div>
        </div>
    `;
    // 글자 수 카운터 이벤트 리스너 추가
    const textarea = container.querySelector(`#comment-content-${safeId}`);
    const charCount = container.querySelector(`#char-count-${safeId}`);
    const submitBtn = container.querySelector(`#comment-submit-${safeId}`);
    const authorInput = container.querySelector(`#comment-author-${safeId}`);
    
    if (textarea && charCount && submitBtn) {
        // 텍스트 입력 시 글자 수 카운터 업데이트
        textarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = `${length}/300`;
            charCount.className = length > 250 ? 'char-count warning' : 'char-count';
            
            // 작성자 이름과 댓글 내용이 모두 있을 때만 버튼 활성화
            const authorLength = authorInput.value.trim().length;
            submitBtn.disabled = length === 0 || length > 300 || authorLength === 0;
            submitBtn.style.opacity = submitBtn.disabled ? '0.5' : '1';
            submitBtn.style.cursor = submitBtn.disabled ? 'not-allowed' : 'pointer';
        });
        
        // 작성자 이름 입력 시 버튼 상태 업데이트
        authorInput.addEventListener('input', function() {
            const authorLength = this.value.trim().length;
            const contentLength = textarea.value.length;
            submitBtn.disabled = contentLength === 0 || contentLength > 300 || authorLength === 0;
            submitBtn.style.opacity = submitBtn.disabled ? '0.5' : '1';
            submitBtn.style.cursor = submitBtn.disabled ? 'not-allowed' : 'pointer';
        });
        
        // 댓글 작성 버튼 클릭 이벤트
        submitBtn.addEventListener('click', async function() {
            if (!submitBtn.disabled) {
                await submitComment(itemId);
            }
        });
        
        // 모바일 터치 이벤트 추가
        submitBtn.addEventListener('touchstart', async function(e) {
            e.preventDefault();
            if (!submitBtn.disabled) {
                await submitComment(itemId);
            }
        }, { passive: false });
    }
    
    return container;
}

export async function loadComments(itemId) {
    const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const commentsList = document.getElementById(`comments-list-${safeId}`);
    const commentCount = document.getElementById(`comment-count-${safeId}`);
    
    try {
        // model.html에서 정의된 전역 클라이언트 사용
        const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : window.globalSupabaseClient;
        
        if (!supabaseClient) {
            throw new Error('Supabase 클라이언트를 찾을 수 없습니다. model.html에서 클라이언트가 초기화되었는지 확인해주세요.');
        }
        
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
        // model.html에서 정의된 전역 클라이언트 사용
        const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : window.globalSupabaseClient;
        
        if (!supabaseClient) {
            throw new Error('Supabase 클라이언트를 찾을 수 없습니다. model.html에서 클라이언트가 초기화되었는지 확인해주세요.');
        }
        
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
        
        // 댓글 입력창 초기화
        contentElement.value = '';
        authorElement.value = '';
        const charCount = document.getElementById(`char-count-${safeId}`);
        if (charCount) {
            charCount.textContent = '0/300';
            charCount.className = 'char-count';
        }
        
        const submitBtn = document.getElementById(`comment-submit-${safeId}`);
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
        }
        
        // 댓글 목록 새로고침
        await loadComments(itemId);
        
    } catch (error) {
        console.error('댓글 저장 실패:', error);
        alert('댓글 저장 중 오류가 발생했습니다.');
    }
}

// 전역 등록 (model.html에서 window로도 접근 가능하게)
window.createCommentSection = createCommentSection;
window.loadComments = loadComments;
window.submitComment = submitComment;
