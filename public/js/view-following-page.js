// View Following (Followers List) Page Logic
const selectedFollowerID = document.querySelector('[data-user-id]')?.dataset.userId || '';
let currentPage = 1;
let totalPages = 1;

// Load danh sách followers
async function loadFollowers(page = 1) {
    try {
        const response = await fetch(`/follow/followers?selectedFollowerID=${selectedFollowerID}&page=${page}`);
        const data = await response.json();

        if (!response.ok || data.error || !data.success) {
            showError(data.message || 'Không thể tải danh sách người theo dõi');
            return;
        }

        renderFollowers(data.data, data.pagination);
        currentPage = page;
    } catch (error) {
        showError('Không thể tải danh sách người theo dõi');
        console.error('Error loading followers:', error);
    }
}

// Render danh sách followers
function renderFollowers(followers, paginationInfo) {
    const listContainer = document.getElementById('followers-list');

    if (!followers || !Array.isArray(followers) || followers.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">Không có người theo dõi nào</div>';
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    let html = '';
    followers.forEach(follower => {
        const followingId = follower.following_id;
        const avatar = follower.avatar || '/pictures/avatar.jpg';
        const name = follower.name || followingId;

        html += `
            <div class="manager-card" data-follower-id="${followingId}">
                <div class="card-header">
                    <img src="${avatar}" alt="${name}" class="card-avatar" onerror="this.src='/pictures/avatar.jpg'">
                    <div class="card-title">${name}</div>
                    <div class="card-actions">
                        <button class="btn-danger unfollow-btn" onclick="unfollowUser('${followingId}', '${name}')">
                            ❌ Huỷ theo dõi
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;

    // Xử lý pagination
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationInfo && paginationContainer) {
        updatePagination(paginationInfo);
        paginationContainer.style.display = 'flex';
    } else if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

// Cập nhật phân trang
function updatePagination(paginationInfo) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    if (typeof paginationInfo === 'string') {
        totalPages = parseInt(paginationInfo) || 1;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (pageInfo) {
            if (totalPages > 1) {
                pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
            } else {
                pageInfo.textContent = `Trang ${currentPage}`;
            }
        }
    } else if (typeof paginationInfo === 'object') {
        totalPages = paginationInfo.totalPages || 1;
        if (prevBtn) prevBtn.disabled = !paginationInfo.hasPrevPage;
        if (nextBtn) nextBtn.disabled = !paginationInfo.hasNextPage;
        if (pageInfo) {
            pageInfo.textContent = `Trang ${paginationInfo.currentPage || currentPage} / ${totalPages}`;
        }
    }
}

// Xóa follower (unfollow)
window.unfollowUser = async function(followerId, followerName) {
    if (!confirm(`Bạn có chắc muốn hủy theo dõi ${followerName}?`)) {
        return;
    }

    const card = document.querySelector(`[data-follower-id="${followerId}"]`);
    const btn = card?.querySelector('.unfollow-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';
    }

    try {
        const response = await fetch('/follow/followers', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedFollowerID: selectedFollowerID,
                deletedFollowingsID: followerId,
                notification_value: {
                    id: null,
                    selectedIdChatRoom: null,
                    selectedSenderId: selectedFollowerID,
                    receiver_id: followerId,
                    content: `${selectedFollowerID} đã huỷ theo dõi ${followerId}`,
                    type: "static"
                }
            })
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            showError(data.message || 'Không thể hủy theo dõi');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '❌ Huỷ theo dõi';
            }
            return;
        }

        showSuccess('Đã hủy theo dõi thành công');
        loadFollowers(currentPage);
    } catch (error) {
        showError('Không thể hủy theo dõi');
        console.error('Error unfollowing user:', error);
        if (btn) {
            btn.disabled = false;
            btn.textContent = '❌ Huỷ theo dõi';
        }
    }
}

// Load trang mới
window.loadPage = function(page) {
    if (page < 1 || page > totalPages) return;
    loadFollowers(page);
}

// Hiển thị lỗi
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Hiển thị thành công
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (!successDiv) return;
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// Load dữ liệu khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadFollowers(1);
});
