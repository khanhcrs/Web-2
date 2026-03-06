import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../Context/AuthContext'; // BẮT BUỘC PHẢI CÓ DÒNG NÀY
import { API_BASE_URL } from '../../config';
import './ProductReview.css';

const ProductReview = ({ productId }) => {
    // 1. Lấy token từ AuthContext (Cách chuẩn nhất trong dự án của bạn)
    const { token: contextToken } = useContext(AuthContext);

    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/${productId}`);
            const data = await response.json();
            if (data.success) {
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error("Lỗi tải đánh giá:", error);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [fetchReviews, productId]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        // Xác nhận token
        const finalToken = contextToken || localStorage.getItem('auth-token');

        if (!finalToken) {
            setError('Vui lòng đăng nhập để đánh giá sản phẩm.');
            return;
        }
        if (!comment.trim()) {
            setError('Vui lòng nhập nội dung đánh giá.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/addreview`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'auth-token': finalToken // Chỉ sử dụng auth-token
                },
                body: JSON.stringify({ productId, rating, comment })
            });

            const data = await response.json();

            if (data.success) {
                setComment('');
                setRating(5);
                fetchReviews();
            } else {
                setError(data.message || 'Có lỗi xảy ra từ máy chủ.');
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            setError('Không thể kết nối đến máy chủ. Hãy kiểm tra Backend!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="product-review-container">
            <h3>Đánh giá sản phẩm ({reviews.length})</h3>

            <div className="review-form">
                <h4>Viết đánh giá của bạn</h4>
                {error && <p className="review-error">{error}</p>}

                <form onSubmit={handleSubmitReview}>
                    <div className="rating-select">
                        <span>Chất lượng: </span>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`star ${rating >= star ? 'selected' : ''}`}
                                onClick={() => setRating(star)}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <textarea
                        rows="4"
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Gửi đánh giá'}
                    </button>
                </form>
            </div>

            <div className="review-list">
                {reviews.length === 0 ? (
                    <p className="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                ) : (
                    reviews.map((rev) => (
                        <div key={rev.id} className="review-item">
                            <div className="review-header">
                                <strong>{rev.user_name}</strong>
                                <span className="review-date">
                                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <div className="review-stars">
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                            <p className="review-comment">{rev.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReview;