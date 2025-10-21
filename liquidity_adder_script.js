document.addEventListener('DOMContentLoaded', () => {
    const addLiquidityForm = document.getElementById('addLiquidityForm');
    const boostVisibilityCheckbox = document.getElementById('boostVisibility');
    const boostVisibilityItem = document.querySelector('label[for="boostVisibility"]');
    const mainContainer = document.querySelector('.container');
    const tokenSelect = document.getElementById('laTokenSelect');
    const tokenNameInput = document.getElementById('laTokenName');

    // Load coin data from session storage and populate dropdown
    const paymentDataString = sessionStorage.getItem('paymentData');
    if (paymentDataString) {
        try {
            const paymentData = JSON.parse(paymentDataString);
            if (paymentData.tokenName && paymentData.tokenTicker) {
                // Clear loading option and add the user's coin
                tokenSelect.innerHTML = '';
                const option = document.createElement('option');
                option.value = 'user-coin'; // We'll use this as a placeholder
                option.textContent = `${paymentData.tokenName} (${paymentData.tokenTicker})`;
                option.selected = true;
                tokenSelect.appendChild(option);
                
                // Pre-fill the token name
                if (tokenNameInput) {
                    tokenNameInput.value = paymentData.tokenName;
                }
            }
        } catch (e) {
            console.error('Error parsing payment data:', e);
            tokenSelect.innerHTML = '<option value="">Error loading coin data</option>';
        }
    } else {
        tokenSelect.innerHTML = '<option value="">No coin data found</option>';
    }

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

    if (boostVisibilityItem && boostVisibilityCheckbox) {
        if (boostVisibilityCheckbox.checked) {
            boostVisibilityItem.classList.add('selected');
        }
        boostVisibilityCheckbox.addEventListener('change', () => {
            if (boostVisibilityCheckbox.checked) {
                boostVisibilityItem.classList.add('selected');
            } else {
                boostVisibilityItem.classList.remove('selected');
            }
        });
    }

    if (addLiquidityForm && mainContainer) {
        addLiquidityForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(addLiquidityForm);

            const selectedCoin = formData.get('laTokenSelect');
            const solAmount = parseFloat(formData.get('laSolAmount'));
            const tokenAmount = parseFloat(formData.get('laTokenAmount'));
            const boostSelected = boostVisibilityCheckbox ? boostVisibilityCheckbox.checked : false;

            if (!selectedCoin || selectedCoin === '') {
                alert("Please select your coin from the dropdown.");
                return;
            }
            if (isNaN(solAmount) || solAmount <= 0) {
                alert("Please enter a valid amount of SOL to add to the pool.");
                return;
            }
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                alert("Please enter a valid amount of your tokens to add to the pool.");
                return;
            }

            let totalPaymentForService = 0;
            const BOOST_VISIBILITY_FEE = 0.15;

            if (boostSelected) {
                totalPaymentForService += BOOST_VISIBILITY_FEE;
            }
            
            // Get the original coin data from session storage
            const originalPaymentData = JSON.parse(sessionStorage.getItem('paymentData'));
            
            const paymentData = {
                serviceType: "addLiquidity",
                tokenName: originalPaymentData.tokenName,
                tokenTicker: originalPaymentData.tokenTicker,
                tokenImage: originalPaymentData.tokenImage,
                solForLP: solAmount,
                tokensForLP: tokenAmount,
                boostVisibility: boostSelected,
                paymentAmount: totalPaymentForService 
            };
            sessionStorage.setItem('paymentData', JSON.stringify(paymentData));

            mainContainer.classList.add('page-fade-out');

            setTimeout(() => {
                window.location.href = "payment.html";
            }, 400);

            console.log('--- Add Liquidity Form Data ---');
            console.log(paymentData);
        });
    }
});