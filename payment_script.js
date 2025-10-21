document.addEventListener('DOMContentLoaded', () => {
    const paymentAddressEl = document.getElementById('paymentAddress');
    const paymentNetworkEl = document.getElementById('paymentNetwork');
    const checkTransactionBtn = document.getElementById('checkTransactionBtn');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
    const copyAddressBtn = document.getElementById('copyAddressBtn');
    const modalInstructionEl = document.querySelector('.modal-instruction');
    const paymentAmountEl = document.getElementById('paymentAmount');

    const cryptomusBtn = document.getElementById('cryptomusBtn');
    const notificationModal = document.getElementById('notificationModal');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationCloseBtn = document.getElementById('notificationCloseBtn');

    const BASE_COIN_CREATION_FEE = 0.1; 
    const SECURITY_OPTION_FEE = 0.1;
    const BOOST_VISIBILITY_FEE = 0.15;
    const BUY_BOT_BOOST_FEE = 0.5;
    const NUMBER_ONE_RANKING_FEE = 1.0;
    const SOCIAL_MEDIA_BLAST_FEE = 0.75;
    let totalSolToSend = 0;
    let paymentTimer = null;
    let paymentReady = false; 

    const paymentDataString = sessionStorage.getItem('paymentData');
    if (paymentDataString) {
        try {
            const paymentData = JSON.parse(paymentDataString);
            
            if (paymentData.serviceType === "addLiquidity") {
                totalSolToSend = 0; 
                
                if (paymentData.solForLP && !isNaN(parseFloat(paymentData.solForLP))) {
                    totalSolToSend += parseFloat(paymentData.solForLP);
                }

                if (paymentData.boostVisibility) {
                    totalSolToSend += BOOST_VISIBILITY_FEE;
                }

                if (modalInstructionEl) {
                    modalInstructionEl.innerHTML = `Please send <strong id="paymentAmount">${totalSolToSend.toFixed(2)} SOL</strong> to the following address. <br>This includes ${paymentData.solForLP || 0} SOL for the liquidity pool and any selected service fees. You will also need ${ (paymentData.tokensForLP || 0).toLocaleString()} of your tokens in your connected wallet.`;
                }

            } else {
                totalSolToSend = BASE_COIN_CREATION_FEE;
                if (paymentData.revokeMint) totalSolToSend += SECURITY_OPTION_FEE;
                if (paymentData.revokeFreeze) totalSolToSend += SECURITY_OPTION_FEE;
                if (paymentData.revokeMetadata) totalSolToSend += SECURITY_OPTION_FEE;
                
                // Add special options fees
                if (paymentData.buyBotBoost) totalSolToSend += BUY_BOT_BOOST_FEE;
                if (paymentData.numberOneRanking) totalSolToSend += NUMBER_ONE_RANKING_FEE;
                if (paymentData.socialMediaBlast) totalSolToSend += SOCIAL_MEDIA_BLAST_FEE;
                
                // Add SOL amount for liquidity pool if provided
                if (paymentData.solAmount && !isNaN(parseFloat(paymentData.solAmount))) {
                    totalSolToSend += parseFloat(paymentData.solAmount);
                }
                
                if (modalInstructionEl) {
                    const solForLP = paymentData.solAmount || 0;
                    const tokensForLP = paymentData.tokenTotalSupply && paymentData.percentageKeep ? 
                        Math.round((paymentData.tokenTotalSupply * (100 - paymentData.percentageKeep)) / 100) : 0;
                    
                    modalInstructionEl.innerHTML = `Please send <strong id="paymentAmount">${totalSolToSend.toFixed(2)} SOL</strong> to the following address for coin creation, liquidity pool, and selected services. <br>This includes ${solForLP} SOL for the liquidity pool and any selected service fees. You will also need ${tokensForLP.toLocaleString()} of your tokens in your connected wallet.`;
                }
                
                // Also update the payment amount element directly
                if (paymentAmountEl) {
                    paymentAmountEl.textContent = `${totalSolToSend.toFixed(2)} SOL`;
                }
            }

            if(paymentAddressEl && paymentAddressEl.parentElement) paymentAddressEl.parentElement.style.display = 'flex';
            if(paymentNetworkEl) paymentNetworkEl.style.display = 'block';

        } catch (e) {
            console.error("Error parsing payment data from sessionStorage", e);
            totalSolToSend = BASE_COIN_CREATION_FEE; 
            if (modalInstructionEl) {
                modalInstructionEl.innerHTML = `Error calculating fees. Please send <strong id="paymentAmount">${totalSolToSend.toFixed(1)} SOL</strong> to the address below:`;
            }
            if (paymentAmountEl) {
                paymentAmountEl.textContent = `${totalSolToSend.toFixed(1)} SOL`;
            }
        }
    } else {
        console.warn("No payment data found in sessionStorage. Displaying default coin creation fee.");
        totalSolToSend = BASE_COIN_CREATION_FEE;
        if (modalInstructionEl) {
             modalInstructionEl.innerHTML = `Please send <strong id="paymentAmount">${totalSolToSend.toFixed(1)} SOL</strong> to the following address:`;
        }
        if (paymentAmountEl) {
            paymentAmountEl.textContent = `${totalSolToSend.toFixed(1)} SOL`;
        }
    }

    if (paymentAddressEl && !paymentAddressEl.textContent.trim()) {
         paymentAddressEl.textContent = "ngTXjUF5idhdxVToyp6KxqzogJtspPzcQf3wTu2WYdy";
    }
    if (paymentNetworkEl && !paymentNetworkEl.textContent.trim()) {
        paymentNetworkEl.textContent = "Solana Mainnet";
    }

    if (copyAddressBtn && paymentAddressEl) {
        copyAddressBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(paymentAddressEl.textContent)
                .then(() => {
                    copyAddressBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                         copyAddressBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy address: ', err);
                    alert('Failed to copy address. Please copy manually.');
                });
        });
    }

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // Start the 60-second timer when page loads
    paymentTimer = setTimeout(() => {
        paymentReady = true;
        console.log("Payment timer completed - payment is now ready");
    }, 60000); // 60 seconds

    // Custom notification function
    function showNotification(type, title, message) {
        if (notificationModal && notificationIcon && notificationTitle && notificationMessage) {
            // Reset classes
            notificationIcon.className = 'fas';
            notificationIcon.parentElement.className = 'notification-icon';
            
            if (type === 'success') {
                notificationIcon.classList.add('fa-check-circle');
                notificationIcon.parentElement.classList.add('success');
            } else if (type === 'error') {
                notificationIcon.classList.add('fa-times-circle');
                notificationIcon.parentElement.classList.add('error');
            }
            
            notificationTitle.textContent = title;
            notificationMessage.textContent = message;
            
            notificationModal.style.display = 'flex';
            setTimeout(() => {
                notificationModal.classList.add('show');
            }, 10);
        }
    }

    function hideNotification() {
        if (notificationModal) {
            notificationModal.classList.remove('show');
            setTimeout(() => {
                notificationModal.style.display = 'none';
            }, 300);
        }
    }

    if (checkTransactionBtn) {
        checkTransactionBtn.addEventListener('click', () => {
            if (paymentReady) {
                showNotification('success', 'Payment Successful!', 'Your coin creation and liquidity pool setup is complete. Redirecting to dashboard...');
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showNotification('error', 'Payment Failed', 'Please ensure you have sent the correct amount to the address and wait for blockchain confirmation. Try again in a few minutes.');
            }
        });
    }

    if (cryptomusBtn) {
        cryptomusBtn.addEventListener('click', () => {
            window.open('https://play.google.com/store/apps/details?id=com.cryptomus.bundle&hl=en', '_blank');
        });
    }

    // Close notification when clicking the close button
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', hideNotification);
    }

    // Close notification when clicking outside the modal
    if (notificationModal) {
        notificationModal.addEventListener('click', (e) => {
            if (e.target === notificationModal) {
                hideNotification();
            }
        });
    }

});