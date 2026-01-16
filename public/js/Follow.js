const follow = {
    // ========== HÀM KIỂM TRA TRẠNG THÁI FOLLOW ==========
    checkAndUpdateFollowStatus: async (buttonElement, follower, following) => {
        try {
            const response = await fetch('/follow/existingfollowing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ follower, following })
            });

            const result = await response.json();
            if (result.exists) {
                buttonElement.textContent = '✓ Đang theo dõi';
                buttonElement.dataset.status = 'following';
            } else {
                buttonElement.textContent = '+ Follow user này';
                buttonElement.dataset.status = 'not-following';
            }
        } catch (err) {
            console.error('Check follow error:', err);
            buttonElement.textContent = 'Lỗi kiểm tra';
            buttonElement.dataset.status = 'error';
        }
    },
    // ========== HÀM FOLLOW ==========
    handleFollow: async (buttonElement, selectedFollowerID, targetUserId) => {
        buttonElement.textContent = 'Đang xử lý...';
        buttonElement.dataset.status = 'loading';

        try {
            const response = await fetch('/follow/followers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedFollowerID: selectedFollowerID,
                    additionedFollowingsID: [targetUserId],
                    notification_value: {
                        id: null,
                        selectedIdChatRoom: null,
                        selectedSenderId: selectedFollowerID,
                        receiver_id: targetUserId,
                        content: `${selectedFollowerID} đã bắt đầu theo dõi ${targetUserId}`,
                        type: "follow"
                    }
                })
            });

            const result = await response.json();

            if (result.error) {
                alert('Lỗi: ' + result.message);
                buttonElement.textContent = '+ Follow user này';
                buttonElement.dataset.status = 'not-following';
            } else {
                buttonElement.textContent = '✓ Đang theo dõi';
                buttonElement.dataset.status = 'following';
            }
        } catch (err) {
            console.error('Follow error:', err);
            alert('Lỗi kết nối server');
            buttonElement.textContent = '+ Follow user này';
            buttonElement.dataset.status = 'not-following';
        }
    },
    // ========== HÀM UNFOLLOW ==========
    handleUnfollow: async (buttonElement, selectedFollowerID, targetUserId) => {
        buttonElement.textContent = 'Đang xử lý...';
        buttonElement.dataset.status = 'loading';

        try {
            const response = await fetch('follow/followers', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedFollowerID: selectedFollowerID,
                    deletedFollowingsID: [targetUserId],
                    notification_value: {
                        id: null,
                        selectedIdChatRoom: null,
                        selectedSenderId: selectedFollowerID,
                        receiver_id: targetUserId,
                        content: `${selectedFollowerID} đã huỷ theo dõi ${targetUserId}`,
                        type: "follow"
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                buttonElement.textContent = '+ Follow user này';
                buttonElement.dataset.status = 'not-following';
            } else {
                alert('Lỗi: ' + result.message);
                buttonElement.textContent = '✓ Đang theo dõi';
                buttonElement.dataset.status = 'following';
            }
        } catch (err) {
            console.error('Unfollow error:', err);
            alert('Lỗi kết nối server');
            buttonElement.textContent = '✓ Đang theo dõi';
            buttonElement.dataset.status = 'following';
        }
    },
    // ========== HÀM ẨN BÀI VIẾT ==========
    handleHidePost: (postId) => {
        const newsElement = document.querySelector(`input[value="${postId}"]`)?.closest('.news');
        if (newsElement) {
            newsElement.style.display = 'none';
            alert("Đã ẩn bài viết")
        }
    },
    // ========== HÀM BÁO CÁO ==========
    handleReport: (postId) => {
        const reason = prompt('Lý do báo cáo:');
        if (!reason) return;

        //try {
        this.handleHidePost(postId);
        // const response = await fetch('/report', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         postId: postId,
        //         reason: reason,
        //         userId: id_user
        //     })
        // });

        // const result = await response.json();
        // showToast(
        //     result.success ? 'Đã gửi báo cáo' : 'Lỗi: ' + result.message,
        //     result.success ? 'success' : 'error'
        // );
        // } catch (err) {
        //     console.error('Report error:', err);
        //     showToast('Lỗi kết nối server', 'error');
        // }
    }
}

export default follow