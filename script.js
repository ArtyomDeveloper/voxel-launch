document.addEventListener('DOMContentLoaded', () => {
    const createCoinAndLpForm = document.getElementById('createCoinAndLpForm');
    const mainContainer = document.querySelector('.container');

    const tokenImageInput = document.getElementById('tokenImage');
    const imagePreview = document.getElementById('imagePreview');
    const fileInputContent = document.getElementById('fileInputContent');

    const tokenTotalSupplyInput = document.getElementById('tokenTotalSupply');
    const solAmountInput = document.getElementById('solAmount');
    const tokenPercentageKeepInput = document.getElementById('tokenPercentageKeep');
    const lpSummary = document.getElementById('lpSummary');
    const keptTokensSpan = document.getElementById('keptTokens');
    const lpTokensSpan = document.getElementById('lpTokens');

    const revokeMintCheckbox = document.getElementById('revokeMint');
    const revokeFreezeCheckbox = document.getElementById('revokeFreeze');
    const revokeMetadataCheckbox = document.getElementById('revokeMetadata');
    const buyBotBoostCheckbox = document.getElementById('buyBotBoost');
    const numberOneRankingCheckbox = document.getElementById('numberOneRanking');
    const socialMediaBlastCheckbox = document.getElementById('socialMediaBlast');
    const securityOptionItems = document.querySelectorAll('.security-option-item');

    const fadeElements = document.querySelectorAll('.fade-in-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };
    const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
    fadeElements.forEach(el => scrollObserver.observe(el));

    if (tokenImageInput) {
        tokenImageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if(imagePreview) imagePreview.src = e.target.result;
                    if(imagePreview) imagePreview.style.display = 'block';
                    if(fileInputContent) fileInputContent.style.display = 'none';
                }
                reader.readAsDataURL(file);
            } else {
                if(imagePreview) imagePreview.src = '#';
                if(imagePreview) imagePreview.style.display = 'none';
                if(fileInputContent) fileInputContent.style.display = 'flex';
            }
        });
    }

    securityOptionItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            if (checkbox.checked) {
                item.classList.add('selected');
            }
            checkbox.addEventListener('change', function() {
                 if (this.checked) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
    });


    function updateLPSummary() {
        if (!tokenTotalSupplyInput || !tokenPercentageKeepInput || !keptTokensSpan || !lpTokensSpan) return;

        const totalTokenSupply = parseFloat(tokenTotalSupplyInput.value);
        if (isNaN(totalTokenSupply) || totalTokenSupply <= 0) {
            keptTokensSpan.textContent = '0';
            lpTokensSpan.textContent = '0';
            return;
        }
        const percentageToKeep = parseFloat(tokenPercentageKeepInput.value) || 0;
        if (isNaN(percentageToKeep) || percentageToKeep < 0 || percentageToKeep > 99) {
            keptTokensSpan.textContent = 'N/A';
            lpTokensSpan.textContent = 'N/A';
            return;
        }
        const tokensToKeep = Math.round((totalTokenSupply * percentageToKeep) / 100);
        const tokensForLP = totalTokenSupply - tokensToKeep;
        keptTokensSpan.textContent = tokensToKeep.toLocaleString();
        lpTokensSpan.textContent = tokensForLP.toLocaleString();
    }

    if(tokenTotalSupplyInput) tokenTotalSupplyInput.addEventListener('input', updateLPSummary);
    if(tokenPercentageKeepInput) tokenPercentageKeepInput.addEventListener('input', updateLPSummary);

    if (createCoinAndLpForm && mainContainer) {
        createCoinAndLpForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(createCoinAndLpForm);
            const tokenName = formData.get('tokenName');
            const tokenTicker = formData.get('tokenTicker') ? formData.get('tokenTicker').toUpperCase() : '';
            const tokenTotalSupply = parseFloat(formData.get('tokenTotalSupply'));
            const solAmount = parseFloat(formData.get('solAmount'));
            const percentageKeep = parseFloat(formData.get('tokenPercentageKeep'));

            const revokeMint = revokeMintCheckbox ? revokeMintCheckbox.checked : false;
            const revokeFreeze = revokeFreezeCheckbox ? revokeFreezeCheckbox.checked : false;
            const revokeMetadata = revokeMetadataCheckbox ? revokeMetadataCheckbox.checked : false;
            const buyBotBoost = buyBotBoostCheckbox ? buyBotBoostCheckbox.checked : false;
            const numberOneRanking = numberOneRankingCheckbox ? numberOneRankingCheckbox.checked : false;
            const socialMediaBlast = socialMediaBlastCheckbox ? socialMediaBlastCheckbox.checked : false;

            if (!tokenName || !tokenTicker || (tokenImageInput && !tokenImageInput.files[0]) || isNaN(tokenTotalSupply) || tokenTotalSupply <= 0 || isNaN(solAmount) || solAmount <= 0 || isNaN(percentageKeep) || percentageKeep < 0 || percentageKeep > 99) {
                alert("Please fill in all required fields correctly, including the token image.");
                return;
            }
            
            // Store image data as base64 for dashboard access
            let imageDataUrl = null;
            if (tokenImageInput && tokenImageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imageDataUrl = e.target.result;
                    localStorage.setItem('coinImageData', imageDataUrl);
                };
                reader.readAsDataURL(tokenImageInput.files[0]);
            }

            const paymentData = {
                serviceType: "createCoin",
                tokenName, tokenTicker, tokenTotalSupply, solAmount, percentageKeep,
                revokeMint, revokeFreeze, revokeMetadata, buyBotBoost, numberOneRanking, socialMediaBlast
            };
            sessionStorage.setItem('paymentData', JSON.stringify(paymentData));

            mainContainer.classList.add('page-fade-out');

            setTimeout(() => {
                window.location.href = "payment.html";
            }, 400);

            console.log('--- Form Data Logged, Fading out and Redirecting to Payment Page ---');
            console.log(paymentData);
        });
    }

    if (imagePreview) imagePreview.style.display = 'none';
    if (fileInputContent) fileInputContent.style.display = 'flex';
    updateLPSummary();
});