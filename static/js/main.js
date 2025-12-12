
document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const sections = document.querySelectorAll('.paper-section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Lightbox Functionality
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox-modal';
    document.body.appendChild(lightbox);

    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'lightbox-content';
    lightboxImg.style.display = 'none'; // Hidden by default
    lightbox.appendChild(lightboxImg);

    // Canvas for cropped images
    const lightboxCanvas = document.createElement('canvas');
    lightboxCanvas.className = 'lightbox-content';
    lightboxCanvas.style.display = 'none'; // Hidden by default
    lightbox.appendChild(lightboxCanvas);

    const closeBtn = document.createElement('span');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    lightbox.appendChild(closeBtn);

    // Open Lightbox
    document.querySelectorAll('.method-image, .teaser-img, .result-item img, .slider-img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            if (window.innerWidth < 768) return; // Disable on mobile
            lightbox.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Disable scroll

            // Check for Scrolly/Slider special classes
            const container = img.closest('.slider-image-container');
            const isSpecial = img.classList.contains('img-pos-left') || img.classList.contains('img-pos-right');

            if (isSpecial && container) {
                // Show Canvas, Hide Img
                lightboxImg.style.display = 'none';
                lightboxCanvas.style.display = 'block';

                // Calculate Visual Aspect Ratio from Container
                const containerW = container.offsetWidth;
                const containerH = container.offsetHeight;
                const ratio = containerW / containerH;

                // Canvas Dimensions based on Image Natural Height * Container Ratio
                // This ensures resolution matches the full height of the image
                const drawH = img.naturalHeight;
                const drawW = drawH * ratio;

                lightboxCanvas.width = drawW;
                lightboxCanvas.height = drawH;

                const ctx = lightboxCanvas.getContext('2d');
                // Fill background with white (user request)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, drawW, drawH);

                if (img.classList.contains('img-pos-left')) {
                    // Left: translateX(0)
                    // Draw image at 0, 0
                    ctx.drawImage(img, 0, 0);
                } else if (img.classList.contains('img-pos-right')) {
                    // Right: translateX(-61%)
                    // Calculate shift in pixels relative to natural dimensions
                    const shiftX = img.naturalWidth * 0.61;
                    // Draw image shifted left
                    ctx.drawImage(img, -shiftX, 0);
                }
            } else {  // Normal Image: Show Img, Hide Canvas
                lightboxCanvas.style.display = 'none';
                lightboxImg.style.display = 'block';
                lightboxImg.src = img.src;
            }
        });
    });

    // Close Lightbox
    const closeLightbox = () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto'; // Enable scroll
    };

    closeBtn.addEventListener('click', closeLightbox);

    // Close on click outside
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            closeLightbox();
        }
    });

    // Slider Class
    class Slider {
        constructor(containerElement, options = {}) {
            this.container = containerElement;
            this.sliderWrapper = this.container.querySelector('.slides-wrapper');
            this.slides = this.container.querySelectorAll('.slide');
            this.progressBar = this.container.querySelector('.progress-bar');
            this.btnPrev = this.container.querySelector('.btn-prev');
            this.btnNext = this.container.querySelector('.btn-next');
            this.btnPause = this.container.querySelector('.btn-pause');
            this.navBtns = this.container.querySelectorAll('.nav-btn');

            if (!this.sliderWrapper || this.slides.length === 0) return;

            this.currentSlide = 0;
            this.isPaused = false;
            this.progress = 0;
            this.slideDuration = options.duration || 5000;
            this.intervalTime = 50;
            this.sliderInterval = null;
            this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : true;

            this.init();
        }

        init() {
            // Event Listeners
            if (this.btnNext) {
                this.btnNext.addEventListener('click', () => {
                    this.nextSlide();
                    this.startTimer();
                });
            }

            if (this.btnPrev) {
                this.btnPrev.addEventListener('click', () => {
                    this.prevSlide();
                    this.startTimer();
                });
            }

            if (this.btnPause) {
                this.btnPause.addEventListener('click', () => {
                    this.isPaused = !this.isPaused;
                    this.btnPause.innerHTML = this.isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
                });
            }

            this.navBtns.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    this.goToSlide(index);
                });
            });

            this.updateSlider();
            if (this.autoPlay) {
                this.startTimer();
            } else {
                // If autoplay is off, we still might want to show the play button state correctly?
                // Or maybe hide the play/pause button? 
                // For now, if autoplay starts off, we assume it's "paused" initially or just not running.
                // Let's set isPaused to true effectively if we don't start.
                this.isPaused = true;
                if (this.btnPause) {
                    this.btnPause.innerHTML = '<i class="fas fa-play"></i>';
                }
            }

            // Image Sizing Logic (Ported from syncHeights)
            // We'll run this on init and resize.
            // Note: syncHeights was global, but it's safer to scope it if possible, 
            // OR keep a global resizing observer that calls a method on all active sliders.
            // For simplicity in this refactor, I'll call a bounded height sync function.
            this.syncHeights();
            window.addEventListener('resize', () => this.syncHeights());

            // Also retry sync after image load
            const firstImg = this.slides[0].querySelector('img');
            if (firstImg && !firstImg.complete) {
                firstImg.onload = () => this.syncHeights();
            }
        }

        updateSlider() {
            this.sliderWrapper.style.transform = `translateX(-${this.currentSlide * 100}%)`;
            this.progress = 0;
            if (this.progressBar) this.progressBar.style.width = '0%';

            this.navBtns.forEach((btn, index) => {
                if (index === this.currentSlide) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        nextSlide() {
            this.currentSlide = (this.currentSlide + 1) % this.slides.length;
            this.updateSlider();
        }

        prevSlide() {
            this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.updateSlider();
        }

        goToSlide(index) {
            this.currentSlide = index;
            this.updateSlider();
            this.startTimer();
        }

        startTimer() {
            if (!this.autoPlay && this.isPaused) return;

            clearInterval(this.sliderInterval);
            this.sliderInterval = setInterval(() => {
                if (!this.isPaused) {
                    this.progress += this.intervalTime;
                    const percent = (this.progress / this.slideDuration) * 100;
                    if (this.progressBar) this.progressBar.style.width = `${percent}%`;

                    if (this.progress >= this.slideDuration) {
                        this.nextSlide();
                    }
                }
            }, this.intervalTime);
        }

        syncHeights() {
            if (window.innerWidth < 768) {
                // Reset styles for mobile
                this.container.querySelectorAll('.slider-image-container, .img-crop-container').forEach(el => {
                    el.style.height = '';
                    el.style.display = '';
                    el.style.alignItems = '';
                });
                this.container.querySelectorAll('.slider-image-container img, .img-pos-left, .img-pos-right').forEach(img => {
                    img.style.height = '';
                    img.style.width = '';
                });
                return;
            }

            const firstImg = this.slides[0].querySelector('.slider-img');
            if (!firstImg) return;

            // Logic adapted to scope:
            // We use the first slide's image to define the height for all containers in THIS slider.
            const firstContainer = this.slides[0].querySelector('.slider-image-container');
            if (firstContainer) {
                firstContainer.style.height = '';
                firstImg.style.height = '';
            }

            const height = firstImg.offsetHeight;
            if (height > 0) {
                this.container.querySelectorAll('.slider-image-container').forEach(container => {
                    container.style.height = `${height}px`;
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';

                    const img = container.querySelector('img');
                    if (img) {
                        img.style.height = '100%';
                        img.style.objectFit = 'contain';
                    }
                });

                this.container.querySelectorAll('.img-crop-container').forEach(container => {
                    container.style.height = `${height}px`;
                });

                this.container.querySelectorAll('.img-pos-left, .img-pos-right').forEach(img => {
                    img.style.height = '100%';
                    img.style.width = 'auto'; // Width auto to maintain aspect ratio
                    img.style.objectFit = 'cover';
                });
            }
        }
    }

    // Initialize Method Slider
    const methodSliderInit = document.querySelector('#method-slider'); // We will add this ID to HTML next
    if (methodSliderInit) {
        new Slider(methodSliderInit, { autoPlay: true });
    }

    // Initialize Video Slider (Future-proofing, will add ID later)
    const videoSliderInit = document.querySelector('#video-slider');
    if (videoSliderInit) {
        new Slider(videoSliderInit, { autoPlay: false });
    }

    // Copy BibTeX
    const copyBtn = document.getElementById('copyBibtexBtn');
    const bibtexCode = document.getElementById('bibtexCode');

    if (copyBtn && bibtexCode) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = bibtexCode.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Success feedback
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.style.color = 'var(--visible-success, #10B981)';
                copyBtn.style.borderColor = '#10B981';

                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.color = '';
                    copyBtn.style.borderColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }
});
