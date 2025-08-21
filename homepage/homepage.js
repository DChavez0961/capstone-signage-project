// Select all slides and dots
const slides = document.querySelectorAll('.product-slide');
const dots = document.querySelectorAll('.dot');

let currentSlideIndex = 0;

// Function to show a slide by index
function showSlide(index) {
  if (index >= slides.length) {
    currentSlideIndex = 0;
  } else if (index < 0) {
    currentSlideIndex = slides.length - 1;
  } else {
    currentSlideIndex = index;
  }

  slides.forEach((slide, i) => {
    slide.classList.remove('active');
    dots[i].classList.remove('active');

    if (i === currentSlideIndex) {
      slide.classList.add('active');
      dots[i].classList.add('active');
    }
  });
}

// Attach event listeners to nav buttons
document.querySelector('.prev-btn').addEventListener('click', () => {
  showSlide(currentSlideIndex - 1);
});

document.querySelector('.next-btn').addEventListener('click', () => {
  showSlide(currentSlideIndex + 1);
});

// Attach event listeners to dots
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    showSlide(i);
  });
});

// Initialize carousel on page load
showSlide(currentSlideIndex);