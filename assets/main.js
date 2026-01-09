// NordMail - Main JavaScript
// Handles mobile menu and smooth scrolling

(function() {
    'use strict';

    // Mobile Menu Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnToggle = navToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#' || href === '#!') {
                return;
            }

            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                
                // Calculate offset for sticky header
                const header = document.getElementById('header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Sticky Header Background on Scroll
    const header = document.getElementById('header');
    if (header) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                header.style.backgroundColor = 'rgba(10, 14, 39, 0.98)';
            } else {
                header.style.backgroundColor = 'rgba(10, 14, 39, 0.95)';
            }
            
            lastScroll = currentScroll;
        });
    }

    // Contact form submission - sends data to Netlify Function which stores in Neon DB
    // (Netlify Forms removed - replaced with database-based submission)
    const contactForm = document.getElementById('kontakt-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const requiredFields = contactForm.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#f44336';
                } else {
                    field.style.borderColor = '';
                }
            });

            // Check checkbox
            const checkbox = contactForm.querySelector('input[type="checkbox"][name="samtykke"]');
            if (checkbox && !checkbox.checked) {
                isValid = false;
                checkbox.parentElement.style.color = '#f44336';
            } else if (checkbox) {
                checkbox.parentElement.style.color = '';
            }

            // Email validation
            const emailField = contactForm.querySelector('input[type="email"]');
            if (emailField && emailField.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailField.value)) {
                    isValid = false;
                    emailField.style.borderColor = '#f44336';
                }
            }

            // If validation fails, show message
            if (!isValid) {
                alert('Vennligst fyll ut alle påkrevde felt korrekt.');
                return;
            }

            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sender...';
            submitBtn.disabled = true;

            // Collect form data and send to Netlify Function
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('navn'),
                email: formData.get('email'),
                website: formData.get('nettside') || '',
                service: formData.get('tjeneste'),
                budget: formData.get('budsjett'),
                message: formData.get('melding') || ''
            };

            try {
                const response = await fetch('/.netlify/functions/create-lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    window.location.href = '/thank-you.html';
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                alert('Beklager, noe gikk galt. Vennligst prøv igjen senere.');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });

        // Remove error styling on input
        const formInputs = contactForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', function() {
                this.style.borderColor = '';
                if (this.type === 'checkbox') {
                    this.parentElement.style.color = '';
                }
            });
        });
    }

})();
