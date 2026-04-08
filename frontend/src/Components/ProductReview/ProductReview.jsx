import React, { useContext, useEffect, useState } from 'react'
import './ProductReview.css'
import { AuthContext } from '../../Context/AuthContext'
import { addProductReview, getProductReviews } from '../../services/reviewService'

const ProductReview = ({ productId }) => {
  const { token } = useContext(AuthContext)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const fetchReviews = async () => {
      if (!productId) {
        return
      }

      try {
        const data = await getProductReviews(productId)
        if (!ignore) {
          setReviews(data)
        }
      } catch (fetchError) {
        console.error('Loi tai danh gia:', fetchError)
      }
    }

    fetchReviews()

    return () => {
      ignore = true
    }
  }, [productId])

  const handleSubmitReview = async (event) => {
    event.preventDefault()

    if (!token) {
      setError('Vui long dang nhap de danh gia san pham.')
      return
    }

    if (!comment.trim()) {
      setError('Vui long nhap noi dung danh gia.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await addProductReview(
        {
          productId,
          rating,
          comment: comment.trim()
        },
        token
      )

      const nextReviews = await getProductReviews(productId)
      setReviews(nextReviews)
      setComment('')
      setRating(5)
    } catch (submitError) {
      setError(submitError.message || 'Khong the gui danh gia.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='product-review-container'>
      <h3>Danh gia san pham ({reviews.length})</h3>

      <div className='review-form'>
        <h4>Viet danh gia cua ban</h4>
        {error && <p className='review-error'>{error}</p>}

        <form onSubmit={handleSubmitReview}>
          <div className='rating-select'>
            <span>Chat luong: </span>
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
            rows='4'
            placeholder='Chia se cam nhan cua ban ve san pham nay...'
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Dang xu ly...' : 'Gui danh gia'}
          </button>
        </form>
      </div>

      <div className='review-list'>
        {reviews.length === 0 ? (
          <p className='no-reviews'>Chua co danh gia nao. Hay la nguoi dau tien danh gia san pham nay.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className='review-item'>
              <div className='review-header'>
                <strong>{review.user_name}</strong>
                <span className='review-date'>
                  {new Date(review.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className='review-stars'>
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </div>
              <p className='review-comment'>{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ProductReview
