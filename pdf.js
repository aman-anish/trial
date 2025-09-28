// PDF Maker Application
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const themeToggle = document.getElementById('theme-toggle');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Text to PDF Elements
    const textPdfForm = document.getElementById('text-pdf-form');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const textPageSizeSelect = document.getElementById('text-page-size');
    const textOrientationSelect = document.getElementById('text-orientation');
    const textWatermarkInput = document.getElementById('text-watermark');
    const textResetBtn = document.getElementById('text-reset-btn');
    const generateTextPdfBtn = document.getElementById('generate-text-pdf');
    const textPreviewContent = document.getElementById('text-preview-content');
    
    // Image to PDF Elements
    const imagePdfForm = document.getElementById('image-pdf-form');
    const imageTitleInput = document.getElementById('image-title');
    const imageUpload = document.getElementById('image-upload');
    const imagePageSizeSelect = document.getElementById('image-page-size');
    const imageOrientationSelect = document.getElementById('image-orientation');
    const imageLayoutSelect = document.getElementById('image-layout');
    const imageResetBtn = document.getElementById('image-reset-btn');
    const generateImagePdfBtn = document.getElementById('generate-image-pdf');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imageThumbnails = document.getElementById('image-thumbnails');
    const imagePreviewContent = document.getElementById('image-preview-content');
    
    // Common Elements
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const toast = document.getElementById('toast');
    
    // State
    let uploadedImages = [];
    let isDarkMode = localStorage.getItem('theme') === 'dark';
    
    // Initialize
    init();
    
    function init() {
        // Set initial theme
        setTheme(isDarkMode);
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Text to PDF event listeners
        titleInput.addEventListener('input', updateTextPreview);
        contentInput.addEventListener('input', updateTextPreview);
        textResetBtn.addEventListener('click', resetTextForm);
        generateTextPdfBtn.addEventListener('click', generateTextPDF);
        
        // Image to PDF event listeners
        imageUpload.addEventListener('change', handleImageUpload);
        imageResetBtn.addEventListener('click', resetImageForm);
        generateImagePdfBtn.addEventListener('click', generateImagePDF);
        
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Initial preview update
        updateTextPreview();
        updateImagePreview();
    }
    
    // Theme Management
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        setTheme(isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
    
    function setTheme(dark) {
        const theme = dark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.querySelector('.theme-icon').textContent = dark ? '☀️' : '🌙';
    }
    
    // Tab Management
    function switchTab(tabId) {
        // Update active tab button
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Show active tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    }
    
    // Text to PDF Functions
    function updateTextPreview() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        // Clear previous preview
        textPreviewContent.innerHTML = '';
        
        if (!title && !content) {
            textPreviewContent.innerHTML = '<p class="preview-placeholder">Your text PDF preview will appear here...</p>';
            return;
        }
        
        // Create preview elements
        if (title) {
            const titleElement = document.createElement('h1');
            titleElement.className = 'preview-title';
            titleElement.textContent = title;
            textPreviewContent.appendChild(titleElement);
        }
        
        if (content) {
            const contentElement = document.createElement('div');
            contentElement.className = 'preview-text';
            contentElement.textContent = content;
            textPreviewContent.appendChild(contentElement);
        }
    }
    
    function resetTextForm() {
        textPdfForm.reset();
        updateTextPreview();
        showToast('Text form has been reset', 'info');
    }
    
    async function generateTextPDF() {
        // Validate form
        if (!titleInput.value.trim() && !contentInput.value.trim()) {
            showToast('Please add a title or content to generate PDF', 'error');
            return;
        }
        
        try {
            // Show progress bar
            showProgressBar();
            
            // Get PDF options
            const pageSize = textPageSizeSelect.value;
            const orientation = textOrientationSelect.value;
            const watermark = textWatermarkInput.value.trim();
            
            // Configure jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: pageSize
            });
            
            // Set margins
            const margin = 20;
            let yPosition = margin;
            const pageWidth = doc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - (2 * margin);
            
            // Add watermark if provided
            if (watermark) {
                doc.setFontSize(40);
                doc.setTextColor(200, 200, 200);
                doc.text(watermark, pageWidth / 2, doc.internal.pageSize.getHeight() / 2, {
                    align: 'center',
                    angle: 45
                });
                doc.setTextColor(0, 0, 0); // Reset color
            }
            
            // Set font and size for title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            
            // Add title
            const title = titleInput.value.trim();
            if (title) {
                const titleLines = doc.splitTextToSize(title, contentWidth);
                doc.text(titleLines, margin, yPosition);
                yPosition += (titleLines.length * 7) + 10;
                
                // Add separator line
                doc.setLineWidth(0.5);
                doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
                yPosition += 10;
            }
            
            // Update progress
            updateProgressBar(30);
            
            // Add content
            const content = contentInput.value.trim();
            if (content) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                
                const contentLines = doc.splitTextToSize(content, contentWidth);
                
                // Handle text that spans multiple pages
                for (let i = 0; i < contentLines.length; i++) {
                    // Check if we need a new page
                    if (yPosition > doc.internal.pageSize.getHeight() - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    
                    doc.text(contentLines[i], margin, yPosition);
                    yPosition += 7;
                }
            }
            
            // Update progress
            updateProgressBar(90);
            
            // Add footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth - margin,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'right' }
                );
            }
            
            // Update progress
            updateProgressBar(100);
            
            // Save the PDF
            setTimeout(() => {
                const fileName = title ? `${title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'document.pdf';
                doc.save(fileName);
                hideProgressBar();
                showToast('Text PDF downloaded successfully!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            hideProgressBar();
            showToast('Error generating PDF. Please try again.', 'error');
        }
    }
    
    // Image to PDF Functions
    function handleImageUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // Validate number of files
        if (files.length > 10) {
            showToast('Maximum 10 images allowed', 'error');
            return;
        }
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file type
            if (!file.type.match('image.*')) {
                showToast('Please select valid image files', 'error');
                continue;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast(`Image "${file.name}" is too large (max 5MB)`, 'error');
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedImages.push({
                    name: file.name,
                    data: e.target.result
                });
                
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
        
        // Reset file input to allow uploading same files again
        event.target.value = '';
    }
    
    function updateImagePreview() {
        // Update image preview container
        imagePreviewContainer.innerHTML = '';
        
        if (uploadedImages.length === 0) {
            imagePreviewContent.innerHTML = '<p class="preview-placeholder">Your image PDF preview will appear here...</p>';
            return;
        }
        
        // Create preview items for each image
        uploadedImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${image.data}" alt="Preview ${index + 1}">
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            imagePreviewContainer.appendChild(previewItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeImage(index);
            });
        });
        
        // Update thumbnails preview
        imageThumbnails.innerHTML = '';
        uploadedImages.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'image-thumbnail';
            thumbnail.innerHTML = `
                <img src="${image.data}" alt="Page ${index + 1}">
                <div class="page-number">Page ${index + 1}</div>
            `;
            imageThumbnails.appendChild(thumbnail);
        });
        
        imagePreviewContent.innerHTML = `
            <p>PDF will contain ${uploadedImages.length} image(s)</p>
            <div id="image-thumbnails" class="image-thumbnails"></div>
        `;
        
        // Re-append thumbnails to the new container
        const newThumbnailsContainer = document.getElementById('image-thumbnails');
        newThumbnailsContainer.innerHTML = imageThumbnails.innerHTML;
    }
    
    function removeImage(index) {
        uploadedImages.splice(index, 1);
        updateImagePreview();
    }
    
    function resetImageForm() {
        imagePdfForm.reset();
        uploadedImages = [];
        updateImagePreview();
        showToast('Image form has been cleared', 'info');
    }
    
    async function generateImagePDF() {
        // Validate form
        if (uploadedImages.length === 0) {
            showToast('Please upload at least one image', 'error');
            return;
        }
        
        try {
            // Show progress bar
            showProgressBar();
            
            // Get PDF options
            const pageSize = imagePageSizeSelect.value;
            const orientation = imageOrientationSelect.value;
            const layout = imageLayoutSelect.value;
            const title = imageTitleInput.value.trim();
            
            // Configure jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: orientation === 'auto' ? 'portrait' : orientation,
                unit: 'mm',
                format: pageSize === 'auto' ? 'a4' : pageSize
            });
            
            // Update progress
            updateProgressBar(10);
            
            // Process each image
            for (let i = 0; i < uploadedImages.length; i++) {
                const imageData = uploadedImages[i].data;
                
                // Add new page for each image after the first
                if (i > 0) {
                    doc.addPage();
                }
                
                // Calculate image dimensions based on layout
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = imageData;
                });
                
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 10;
                
                let imgWidth, imgHeight, x, y;
                
                switch (layout) {
                    case 'fit':
                        // Fit image to page with maintained aspect ratio
                        const widthRatio = (pageWidth - 2 * margin) / img.width;
                        const heightRatio = (pageHeight - 2 * margin) / img.height;
                        const ratio = Math.min(widthRatio, heightRatio);
                        
                        imgWidth = img.width * ratio;
                        imgHeight = img.height * ratio;
                        x = (pageWidth - imgWidth) / 2;
                        y = (pageHeight - imgHeight) / 2;
                        break;
                    
                    case 'stretch':
                        // Stretch image to fill page
                        imgWidth = pageWidth - 2 * margin;
                        imgHeight = pageHeight - 2 * margin;
                        x = margin;
                        y = margin;
                        break;
                    
                    case 'actual':
                    default:
                        // Use actual image size, centered on page
                        imgWidth = img.width * 0.264583; // Convert pixels to mm (96 DPI)
                        imgHeight = img.height * 0.264583;
                        x = (pageWidth - imgWidth) / 2;
                        y = (pageHeight - imgHeight) / 2;
                        break;
                }
                
                // Add image to PDF
                doc.addImage(imageData, 'JPEG', x, y, imgWidth, imgHeight);
                
                // Add page number
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(
                    `Page ${i + 1} of ${uploadedImages.length}`,
                    pageWidth - margin,
                    pageHeight - 5,
                    { align: 'right' }
                );
                
                // Add title on first page if provided
                if (i === 0 && title) {
                    doc.setFontSize(16);
                    doc.setTextColor(0, 0, 0);
                    doc.text(title, margin, margin);
                }
                
                // Update progress
                updateProgressBar(10 + (i / uploadedImages.length) * 80);
            }
            
            // Update progress
            updateProgressBar(95);
            
            // Save the PDF
            setTimeout(() => {
                const fileName = title ? `${title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'images.pdf';
                doc.save(fileName);
                hideProgressBar();
                showToast('Image PDF downloaded successfully!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            hideProgressBar();
            showToast('Error generating PDF. Please try again.', 'error');
        }
    }
    
    // Progress Bar Functions
    function showProgressBar() {
        progressBar.classList.remove('hidden');
        updateProgressBar(0);
    }
    
    function updateProgressBar(percentage) {
        progressFill.style.width = `${percentage}%`;
    }
    
    function hideProgressBar() {
        setTimeout(() => {
            progressBar.classList.add('hidden');
            progressFill.style.width = '0%';
        }, 500);
    }
    
    // Toast Notification
    function showToast(message, type = 'success') {
        // Update toast content
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');
        
        toastMessage.textContent = message;
        
        // Set icon based on type
        switch(type) {
            case 'success':
                toastIcon.textContent = '✅';
                break;
            case 'error':
                toastIcon.textContent = '❌';
                break;
            case 'info':
                toastIcon.textContent = 'ℹ️';
                break;
        }
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        isDarkMode = savedTheme === 'dark';
        setTheme(isDarkMode);
    }
});