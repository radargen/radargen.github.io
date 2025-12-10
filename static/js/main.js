
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

    // Slider Logic
    const sliderWrapper = document.querySelector('.slides-wrapper');
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.querySelector('.progress-bar');
    const btnPrev = document.querySelector('.btn-prev');
    const btnNext = document.querySelector('.btn-next');
    const btnPause = document.querySelector('.btn-pause');
    const navBtns = document.querySelectorAll('.nav-btn');

    if (sliderWrapper && slides.length > 0) {
        let currentSlide = 0;
        let isPaused = false;
        let progress = 0;
        const slideDuration = 5000; // 5 seconds
        const intervalTime = 50; // Update every 50ms
        let sliderInterval;

        const updateSlider = () => {
            sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
            progress = 0;
            progressBar.style.width = '0%';

            // Update tabs
            navBtns.forEach((btn, index) => {
                if (index === currentSlide) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlider();
        };

        const prevSlide = () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            updateSlider();
        };

        const goToSlide = (index) => {
            currentSlide = index;
            updateSlider();
            startTimer(); // Reset timer
        };

        const startTimer = () => {
            clearInterval(sliderInterval);
            sliderInterval = setInterval(() => {
                if (!isPaused) {
                    progress += intervalTime;
                    const percent = (progress / slideDuration) * 100;
                    progressBar.style.width = `${percent}%`;

                    if (progress >= slideDuration) {
                        nextSlide();
                    }
                }
            }, intervalTime);
        };

        // Event Listeners
        btnNext.addEventListener('click', () => {
            nextSlide();
            startTimer(); // Reset timer on manual interaction
        });

        btnPrev.addEventListener('click', () => {
            prevSlide();
            startTimer();
        });

        btnPause.addEventListener('click', () => {
            isPaused = !isPaused;
            btnPause.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
        });

        // Tab Navigation
        navBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                goToSlide(index);
            });
        });

        // Initialize

        // Sync Heights Function
        const syncHeights = () => {
            // Disable on mobile - let CSS handle aspect ratios
            if (window.innerWidth < 768) {
                document.querySelectorAll('.slider-image-container, .img-crop-container').forEach(el => {
                    el.style.height = '';
                    el.style.display = '';
                    el.style.alignItems = '';
                });
                document.querySelectorAll('.slider-image-container img, .img-pos-left, .img-pos-right').forEach(img => {
                    img.style.height = '';
                    img.style.width = '';
                });
                return;
            }

            const firstImg = slides[0].querySelector('.slider-img');
            if (firstImg) {
                // Ensure image is loaded
                if (firstImg.complete) {
                    // RESET Step 1 styles to get natural height based on current width
                    const firstContainer = slides[0].querySelector('.slider-image-container');
                    if (firstContainer) {
                        firstContainer.style.height = '';
                        firstImg.style.height = '';
                    }

                    const height = firstImg.offsetHeight;
                    if (height > 0) {
                        document.querySelectorAll('.slider-image-container').forEach(container => {
                            // Apply height to containers to enforce uniformity
                            container.style.height = `${height}px`;
                            container.style.display = 'flex'; // Ensure flex centering
                            container.style.alignItems = 'center';

                            // FORCE image height to match container
                            const img = container.querySelector('img');
                            if (img) {
                                img.style.height = '100%';
                                img.style.objectFit = 'contain';
                            }
                        });

                        // Update crop containers specifically
                        document.querySelectorAll('.img-crop-container').forEach(container => {
                            container.style.height = `${height}px`;
                        });

                        // Fix shared image sizing to match new container height
                        document.querySelectorAll('.img-pos-left, .img-pos-right').forEach(img => {
                            img.style.height = '100%';
                            img.style.width = 'auto'; // Let width scale naturally
                            img.style.objectFit = 'cover'; // Ensure it covers the height without gaps
                        });
                    }
                } else {
                    firstImg.onload = syncHeights;
                }
            }
        };

        // Run sync
        syncHeights(); // Try immediate
        window.addEventListener('resize', syncHeights); // Re-sync on resize

        startTimer();
        startTimer();
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
