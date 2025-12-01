import React from 'react'
import './Hero.css'
import hand_icon from '../assests/hand_icon.png'
import arrow_icon from '../assests/arrow.png'
import hero_image from '../assests/hero_image.png'

const Hero = () => {
  const handleScrollToCollections = () => {
    const section = document.getElementById('new-collections')
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <div className='hero'>
      <div className="hero-left">
        <h2>Dành cho khách hàng mới</h2>
        <div>
          <div className="hero-hand-icon">
            <p>Mới</p>
            <img src={hand_icon} alt="" />
          </div>
          <p>Bộ sưu tập</p>
          <p>Dành cho mọi người</p>
        </div>

        <div
          className="hero-latest-btn"
          onClick={handleScrollToCollections}
          role="button"
          tabIndex={0}
        >
          <div>Bộ sưu tập mới nhất</div>
          <img src={arrow_icon} alt="" />
        </div>
      </div>

      <div className="hero-right">
        <img src={hero_image} alt="" />
      </div>
    </div>
  )
}

export default Hero
