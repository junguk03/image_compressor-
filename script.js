class ImageCompressor {
    constructor() {
        this.images = [];
        this.quality = 0.8;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
    }

    setupModal() {
        const modal = document.getElementById('imageModal');
        const closeBtn = document.querySelector('.modal-close');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    openImageModal(imageUrl, imageName, imageSize, label) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const modalImageName = document.getElementById('modalImageName');
        const modalImageSize = document.getElementById('modalImageSize');
        const modalLabel = document.querySelector('.modal-label');

        modalImage.src = imageUrl;
        modalImageName.textContent = imageName;
        modalImageSize.textContent = imageSize;
        modalLabel.textContent = label;
        modal.style.display = 'flex';
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        const compressAllBtn = document.getElementById('compressAllBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(file =>
                file.type.startsWith('image/')
            );
            this.handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        qualitySlider.addEventListener('input', (e) => {
            this.quality = e.target.value / 100;
            qualityValue.textContent = e.target.value;
        });

        compressAllBtn.addEventListener('click', () => this.compressAll());
        downloadAllBtn.addEventListener('click', () => this.downloadAll());
        clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    handleFiles(files) {
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name}은(는) 10MB를 초과합니다.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    originalSize: file.size,
                    originalUrl: e.target.result,
                    compressedUrl: null,
                    compressedSize: null,
                    compressed: false
                };

                this.images.push(imageData);
                this.renderImage(imageData);
                this.updateActions();
            };
            reader.readAsDataURL(file);
        });
    }

    renderImage(imageData) {
        const container = document.getElementById('imagesContainer');
        const card = document.createElement('div');
        card.className = 'image-card';
        card.id = `image-${imageData.id}`;

        card.innerHTML = `
            <img src="${imageData.originalUrl}" alt="${imageData.name}" class="image-preview" onclick="compressor.openImageModal('${imageData.originalUrl}', '${imageData.name}', '${this.formatSize(imageData.originalSize)}', '원본')" style="cursor: pointer;" title="클릭하여 크게 보기">
            <div class="image-info">
                <div class="image-name">${imageData.name}</div>
                <div class="image-size">
                    <span>원본: ${this.formatSize(imageData.originalSize)}</span>
                    ${imageData.compressed ? `<span>압축: ${this.formatSize(imageData.compressedSize)}</span>` : ''}
                </div>
                ${imageData.compressed ? `
                    <div class="size-reduction">
                        ${this.calculateReduction(imageData.originalSize, imageData.compressedSize)}% 감소
                    </div>
                ` : ''}
            </div>
            <div class="image-actions">
                <button class="btn btn-primary compress-btn" onclick="compressor.compressImage('${imageData.id}')">
                    압축하기
                </button>
                ${imageData.compressed ? `
                    <button class="btn btn-success" onclick="compressor.downloadImage('${imageData.id}')">
                        다운로드
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="compressor.removeImage('${imageData.id}')">
                    삭제
                </button>
            </div>
        `;

        container.appendChild(card);
    }

    async compressImage(id) {
        const imageData = this.images.find(img => img.id == id);
        if (!imageData) return;

        const card = document.getElementById(`image-${id}`);
        card.classList.add('processing');

        try {
            const compressedData = await this.compress(imageData.originalUrl);
            imageData.compressedUrl = compressedData.url;
            imageData.compressedSize = compressedData.size;
            imageData.compressed = true;

            this.updateImageCard(imageData);
            card.classList.remove('processing');
        } catch (error) {
            alert('압축 중 오류가 발생했습니다.');
            card.classList.remove('processing');
        }
    }

    compress(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('압축 실패'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve({
                            url: e.target.result,
                            size: blob.size
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', this.quality);
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    updateImageCard(imageData) {
        const card = document.getElementById(`image-${imageData.id}`);
        card.innerHTML = `
            ${imageData.compressed ? `
                <div class="image-comparison">
                    <div class="comparison-item" onclick="compressor.openImageModal('${imageData.originalUrl}', '${imageData.name}', '${this.formatSize(imageData.originalSize)}', '원본')" style="cursor: pointer;" title="클릭하여 크게 보기">
                        <div class="comparison-label">원본</div>
                        <img src="${imageData.originalUrl}" alt="${imageData.name}" class="image-preview">
                    </div>
                    <div class="comparison-item" onclick="compressor.openImageModal('${imageData.compressedUrl}', '${imageData.name}', '${this.formatSize(imageData.compressedSize)}', '압축')" style="cursor: pointer;" title="클릭하여 크게 보기">
                        <div class="comparison-label">압축</div>
                        <img src="${imageData.compressedUrl}" alt="${imageData.name}" class="image-preview">
                    </div>
                </div>
            ` : `
                <img src="${imageData.originalUrl}" alt="${imageData.name}" class="image-preview" onclick="compressor.openImageModal('${imageData.originalUrl}', '${imageData.name}', '${this.formatSize(imageData.originalSize)}', '원본')" style="cursor: pointer;" title="클릭하여 크게 보기">
            `}
            <div class="image-info">
                <div class="image-name">${imageData.name}</div>
                <div class="image-size">
                    <span>원본: ${this.formatSize(imageData.originalSize)}</span>
                    ${imageData.compressed ? `<span>압축: ${this.formatSize(imageData.compressedSize)}</span>` : ''}
                </div>
                ${imageData.compressed ? `
                    <div class="size-reduction">
                        ${this.calculateReduction(imageData.originalSize, imageData.compressedSize)}% 감소
                    </div>
                ` : ''}
            </div>
            <div class="image-actions">
                <button class="btn btn-primary" onclick="compressor.compressImage('${imageData.id}')">
                    재압축
                </button>
                ${imageData.compressed ? `
                    <button class="btn btn-success" onclick="compressor.downloadImage('${imageData.id}')">
                        다운로드
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="compressor.removeImage('${imageData.id}')">
                    삭제
                </button>
            </div>
        `;

        this.updateActions();
    }

    async compressAll() {
        const uncompressed = this.images.filter(img => !img.compressed);
        for (const img of uncompressed) {
            await this.compressImage(img.id);
        }
    }

    downloadImage(id) {
        const imageData = this.images.find(img => img.id == id);
        if (!imageData || !imageData.compressed) return;

        const link = document.createElement('a');
        const fileName = imageData.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg';
        link.download = fileName;
        link.href = imageData.compressedUrl;
        link.click();
    }

    async downloadAll() {
        const compressed = this.images.filter(img => img.compressed);
        for (const img of compressed) {
            this.downloadImage(img.id);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    removeImage(id) {
        this.images = this.images.filter(img => img.id != id);
        const card = document.getElementById(`image-${id}`);
        card.remove();
        this.updateActions();
    }

    clearAll() {
        if (this.images.length === 0) return;
        if (!confirm('모든 이미지를 삭제하시겠습니까?')) return;

        this.images = [];
        document.getElementById('imagesContainer').innerHTML = '';
        this.updateActions();
    }

    updateActions() {
        const actions = document.getElementById('actions');
        const compressAllBtn = document.getElementById('compressAllBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');

        if (this.images.length > 0) {
            actions.style.display = 'flex';

            const hasUncompressed = this.images.some(img => !img.compressed);
            compressAllBtn.style.display = hasUncompressed ? 'block' : 'none';

            const hasCompressed = this.images.some(img => img.compressed);
            downloadAllBtn.style.display = hasCompressed ? 'block' : 'none';
        } else {
            actions.style.display = 'none';
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    calculateReduction(original, compressed) {
        return Math.round((1 - compressed / original) * 100);
    }
}

const compressor = new ImageCompressor();
