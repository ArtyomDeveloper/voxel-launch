document.addEventListener('DOMContentLoaded', () => {
    const coinIcon = document.getElementById('coinIcon');
    const coinName = document.getElementById('coinName');
    const coinTicker = document.getElementById('coinTicker');
    const marketCap = document.getElementById('marketCap');
    const liquidityPool = document.getElementById('liquidityPool');
    const chartBars = document.getElementById('chartBars');
    const activityList = document.getElementById('activityList');
    const liquidityActions = document.getElementById('liquidityActions');
    const removeLiquidityBtn = document.getElementById('removeLiquidityBtn');

    // Sound effects
    const buySound = new Audio('buy-sound.mp3');
    const sellSound = new Audio('sell-sound.mp3');
    const successSound = new Audio('success.mp3');
    
    // Function to play buy sound
    function playBuySound() {
        buySound.currentTime = 0;
        buySound.play().catch(e => console.log('Buy sound play failed:', e));
    }
    
    // Function to play sell sound
    function playSellSound() {
        sellSound.currentTime = 0;
        sellSound.play().catch(e => console.log('Sell sound play failed:', e));
    }
    
    // Function to play success sound
    function playSuccessSound() {
        successSound.currentTime = 0;
        successSound.play().catch(e => console.log('Success sound play failed:', e));
    }

    // Get coin data from session storage
    const paymentDataString = sessionStorage.getItem('paymentData');
    let coinData = {
        name: 'Your Coin',
        ticker: 'TICKER',
        icon: '#'
    };

    if (paymentDataString) {
        try {
            const paymentData = JSON.parse(paymentDataString);
            coinData = {
                name: paymentData.tokenName || 'Your Coin',
                ticker: paymentData.tokenTicker || 'TICKER',
                icon: paymentData.tokenImage ? URL.createObjectURL(paymentData.tokenImage) : '#'
            };
        } catch (e) {
            console.error('Error parsing coin data:', e);
        }
    }

    // Also check for image data in localStorage (fallback)
    const imageData = localStorage.getItem('coinImageData');
    if (imageData && coinData.icon === '#') {
        coinData.icon = imageData;
    }

    // Initialize coin display
    if (coinIcon && coinData.icon !== '#') {
        coinIcon.src = coinData.icon;
    }
    if (coinName) coinName.textContent = coinData.name;
    if (coinTicker) coinTicker.textContent = coinData.ticker;

    // Chart data
    let chartData = [];
    let currentPriceValue = 1.00; // Starting price in dollars
    let basePrice = 1.00; // Base price for percentage calculations
    let priceChangePercent = 0;
    let totalVolume = 0; // Track total trading volume
    let liquidityPoolAmount = 0; // Track liquidity pool (exact dollar amounts from all trades)
    let marketCapValue = 0; // Starting market cap at $0

    // Initialize chart with some initial data
    function initializeChart() {
        chartData = [];
        for (let i = 0; i < 50; i++) {
            chartData.push({
                value: basePrice + (Math.random() - 0.5) * 0.1, // Small variations around $1.00
                time: new Date(Date.now() - (49 - i) * 60000), // 1 minute intervals
                type: 'initial' // Initial data points
            });
        }
        renderChart();
    }

    // Render the chart bars
    function renderChart() {
        if (!chartBars) return;
        
        chartBars.innerHTML = '';
        const maxValue = Math.max(...chartData.map(d => d.value));
        const minValue = Math.min(...chartData.map(d => d.value));
        const range = maxValue - minValue || 0.01; // Minimum range to prevent division by zero

        chartData.forEach((data, index) => {
            const bar = document.createElement('div');
            const height = ((data.value - minValue) / range) * 100;
            bar.className = 'bar';
            bar.style.height = `${Math.max(height, 5)}%`; // Minimum 5% height for visibility
            
            // Color based on trade type
            if (data.type === 'buy') {
                bar.style.backgroundColor = '#10B981'; // Green for buys
            } else if (data.type === 'sell') {
                bar.style.backgroundColor = '#EF4444'; // Red for sells
            } else {
                bar.style.backgroundColor = '#6B7280'; // Gray for initial data
            }
            
            chartBars.appendChild(bar);
        });
    }

    // Update price display
    function updatePrice() {
        if (marketCap) {
            // Market cap starts at $0 and grows with trading activity
            marketCapValue = Math.round(liquidityPoolAmount * (currentPriceValue / basePrice));
            marketCap.textContent = `$${marketCapValue.toLocaleString()}`;
        }
        if (liquidityPool) {
            // Liquidity pool is the exact dollar amount from buys
            liquidityPool.textContent = `$${liquidityPoolAmount.toLocaleString()}`;
        }
    }

    // Add random buy order
    function addRandomBuy() {
        // Play buy sound effect
        playBuySound();
        
        // Calculate dollar amount with progressive increase
        const baseAmount = Math.random() * 20 + 10; // $10.00 to $30.00 base
        const dollarAmount = Math.round((baseAmount * buyAmountMultiplier) * 100) / 100;
        
        // Direct price impact - each dollar adds to the price
        const priceImpact = dollarAmount * 0.01; // $10 = $0.10 price increase
        const oldPrice = currentPriceValue;
        currentPriceValue += priceImpact;
        totalVolume += dollarAmount;
        liquidityPoolAmount += dollarAmount; // Add exact dollar amount to liquidity pool
        
        // Calculate price change percentage
        priceChangePercent = ((currentPriceValue - basePrice) / basePrice) * 100;
        
        // Add to chart data
        chartData.push({
            value: currentPriceValue,
            time: new Date(),
            type: 'buy'
        });
        
        // Keep only last 50 data points
        if (chartData.length > 50) {
            chartData.shift();
        }
        
        // Update displays
        updatePrice();
        renderChart();
        
        // Add to activity list with dollar amount
        addActivityItem(dollarAmount, 'buy');
    }

    // Add random sell order
    function addRandomSell() {
        // Play sell sound effect
        playSellSound();
        
        // Calculate dollar amount for sells (smaller than buys)
        let dollarAmount;
        if (isRapidTrading) {
            // Rapid trading: $5.00 to $50.00
            dollarAmount = Math.round((Math.random() * 45 + 5) * 100) / 100; // $5.00 to $50.00 with 2 decimals
        } else {
            // Slow trading: $5.00 to $15.00
            dollarAmount = Math.round((Math.random() * 10 + 5) * 100) / 100; // $5.00 to $15.00 with 2 decimals
        }
        
        // Direct price impact for sells (smaller impact)
        const priceImpact = dollarAmount * 0.005; // $10 = $0.05 price decrease
        const oldPrice = currentPriceValue;
        currentPriceValue = Math.max(currentPriceValue - priceImpact, 0.01); // Don't go below $0.01
        totalVolume += dollarAmount;
        liquidityPoolAmount = Math.max(liquidityPoolAmount - dollarAmount, 0); // Subtract dollar amount from liquidity pool (sells remove from pool), but don't go below 0
        
        // Calculate price change percentage
        priceChangePercent = ((currentPriceValue - basePrice) / basePrice) * 100;
        
        // Add to chart data
        chartData.push({
            value: currentPriceValue,
            time: new Date(),
            type: 'sell'
        });
        
        // Keep only last 50 data points
        if (chartData.length > 50) {
            chartData.shift();
        }
        
        // Update displays
        updatePrice();
        renderChart();
        
        // Add to activity list with dollar amount
        addActivityItem(dollarAmount, 'sell');
    }

    // Add activity item to the list
    function addActivityItem(amount, type = 'buy') {
        if (!activityList) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const isBuy = type === 'buy';
        const sign = isBuy ? '+' : '-';
        const orderType = isBuy ? 'Buy Order' : 'Sell Order';
        
        activityItem.innerHTML = `
            <div>
                <div class="activity-type ${isBuy ? 'buy' : 'sell'}">${orderType}</div>
                <div class="activity-time">${timeString}</div>
            </div>
            <div class="activity-amount">${sign}$${amount.toFixed(2)}</div>
        `;
        
        // Add to top of list
        activityList.insertBefore(activityItem, activityList.firstChild);
        
        // Keep only last 10 items
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }



    // Initialize everything
    initializeChart();
    updatePrice();

    // Trading simulation variables
    let simulationStartTime = Date.now();
    let isRapidTrading = false;
    let tradingInterval = null;
    let speedMultiplier = 1;
    let isSellingPhase = false;
    let buyAmountMultiplier = 1;

    // Start random trading simulation after 10 seconds
    setTimeout(() => {
        console.log('Starting random trading simulation...');
        
        // Add first buy immediately
        addRandomBuy();
        
        // Start with slow trading (2-8 seconds between trades)
        startSlowTrading();
        
        // Every minute, increase speed by 50% and buy amounts by 50%
        const speedInterval = setInterval(() => {
            speedMultiplier *= 1.5;
            buyAmountMultiplier *= 1.5;
            console.log('Speed increased to:', speedMultiplier + 'x');
            console.log('Buy amounts increased to:', buyAmountMultiplier + 'x');
        }, 60000); // Every 60 seconds
        
        // After 10 minutes, stop buying and start slow selling
        const sellingStartTime = 600000; // 10 minutes (600 seconds)
        setTimeout(() => {
            console.log('Entering slow selling phase...');
            isSellingPhase = true;
            clearInterval(speedInterval);
        }, sellingStartTime);
        
    }, 10000); // 10 seconds delay

    function startSlowTrading() {
        function scheduleNextTrade() {
            // Apply speed multiplier to delay
            const baseDelay = Math.random() * 6000 + 2000; // 2-8 seconds base
            const delay = baseDelay / speedMultiplier;
            
            setTimeout(() => {
                if (!isSellingPhase) {
                    // During buying phase: 80% chance of buy, 20% chance of sell
                    if (Math.random() < 0.8) {
                        addRandomBuy();
                    } else {
                        addRandomSell();
                    }
                    scheduleNextTrade(); // Schedule the next one
                } else {
                    // During slow selling phase: 0% chance of buy, 100% chance of sell
                    // Very slow: 10-15 seconds between sells
                    const slowDelay = Math.random() * 5000 + 10000; // 10-15 seconds
                    setTimeout(() => {
                        addRandomSell();
                        scheduleNextTrade(); // Schedule the next one
                    }, slowDelay);
                    return; // Don't schedule immediately, wait for slow delay
                }
            }, delay);
        }
        scheduleNextTrade();
    }



    // Handle remove liquidity button click
    if (removeLiquidityBtn) {
        removeLiquidityBtn.addEventListener('click', () => {
            showRemoveLiquidityConfirmation();
        });
    }
    
    // Function to show confirmation popup
    function showRemoveLiquidityConfirmation() {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background-color: var(--surface-modal);
                border-radius: var(--squircle-radius);
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(var(--shadow-medium-rgb), 0.2);
                border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px; color: #EF4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: var(--text-primary); font-size: 1.5rem; font-weight: 600; margin: 0 0 15px 0;">
                    Remove Liquidity?
                </h3>
                <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.5; margin: 0 0 25px 0;">
                    Are you sure you want to remove your liquidity from the pool? This action cannot be undone.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="confirmRemove" style="
                        background-color: #EF4444;
                        color: white;
                        border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
                        padding: 12px 24px;
                        border-radius: var(--squircle-radius-small);
                        font-size: 1rem;
                        font-weight: 600;
                        font-family: 'Poppins', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Yes, Remove</button>
                    <button id="cancelRemove" style="
                        background-color: var(--surface-accent);
                        color: var(--text-primary);
                        border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
                        padding: 12px 24px;
                        border-radius: var(--squircle-radius-small);
                        font-size: 1rem;
                        font-weight: 600;
                        font-family: 'Poppins', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        document.getElementById('confirmRemove').addEventListener('click', () => {
            document.body.removeChild(modal);
            startRemoveLiquidityProcess();
        });
        
        document.getElementById('cancelRemove').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Function to start the remove liquidity process
    function startRemoveLiquidityProcess() {
        // Create loading modal
        const loadingModal = document.createElement('div');
        loadingModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        loadingModal.innerHTML = `
            <div style="
                background-color: var(--surface-modal);
                border-radius: var(--squircle-radius);
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(var(--shadow-medium-rgb), 0.2);
                border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px; color: var(--brand-primary);">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <h3 style="color: var(--text-primary); font-size: 1.5rem; font-weight: 600; margin: 0 0 15px 0;">
                    Removing Liquidity...
                </h3>
                <div style="
                    width: 100%;
                    height: 8px;
                    background-color: var(--surface-accent);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 15px;
                ">
                    <div id="loadingBar" style="
                        width: 0%;
                        height: 100%;
                        background-color: var(--brand-primary);
                        border-radius: 4px;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                    Processing your withdrawal...
                </p>
            </div>
        `;
        
        document.body.appendChild(loadingModal);
        
        // Animate loading bar over 3 seconds
        const loadingBar = document.getElementById('loadingBar');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            loadingBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    document.body.removeChild(loadingModal);
                    showSuccessAnimation();
                }, 300);
            }
        }, 30); // 3 seconds total (3000ms / 100 steps = 30ms per step)
    }
    
    // Function to show success animation
    function showSuccessAnimation() {
        // Play success sound
        playSuccessSound();
        
        // Reset all values to zero
        currentPriceValue = 0.01; // Set to minimum value
        basePrice = 0.01;
        priceChangePercent = 0;
        totalVolume = 0;
        liquidityPoolAmount = 0;
        marketCapValue = 0;
        
        // Stop all trading activity
        isSellingPhase = true; // This will prevent any new trades
        speedMultiplier = 0; // Stop all speed increases
        
        // Clear chart data and add a single point at zero
        chartData = [{
            value: 0.01,
            time: new Date(),
            type: 'reset'
        }];
        
        // Update displays
        updatePrice();
        renderChart();
        
        // Clear activity list
        if (activityList) {
            activityList.innerHTML = '';
        }
        
        // Create success modal
        const successModal = document.createElement('div');
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        successModal.innerHTML = `
            <div style="
                background-color: var(--surface-modal);
                border-radius: var(--squircle-radius);
                padding: 30px;
                max-width: 450px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(var(--shadow-medium-rgb), 0.2);
                border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
                animation: slideIn 0.5s ease;
            ">
                <div style="font-size: 4rem; margin-bottom: 20px; color: #10B981; animation: bounce 0.6s ease;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 style="color: var(--text-primary); font-size: 1.8rem; font-weight: 700; margin: 0 0 15px 0;">
                    Successfully Removed!
                </h3>
                <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.5; margin: 0 0 20px 0;">
                    Your liquidity has been successfully removed from the pool. The funds have been sent to the wallet address that you paid with.
                </p>
                <p style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600; margin: 0 0 25px 0;">
                    Trading has stopped. Ready to create a new coin?
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="createNewCoin" style="
                        background-color: var(--brand-primary);
                        color: var(--text-on-brand);
                        border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
                        padding: 12px 24px;
                        border-radius: var(--squircle-radius-small);
                        font-size: 1rem;
                        font-weight: 600;
                        font-family: 'Poppins', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Create New Coin</button>
                    <button id="closeSuccess" style="
                        background-color: var(--surface-accent);
                        color: var(--text-primary);
                        border: var(--cartoon-outline-thickness) solid var(--outline-cartoon);
                        padding: 12px 24px;
                        border-radius: var(--squircle-radius-small);
                        font-size: 1rem;
                        font-weight: 600;
                        font-family: 'Poppins', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Stay Here</button>
                </div>
            </div>
        `;
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: scale(0.8) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successModal);
        
        // Handle create new coin button
        document.getElementById('createNewCoin').addEventListener('click', () => {
            document.body.removeChild(successModal);
            document.head.removeChild(style);
            // Redirect to the main page to create a new coin
            window.location.href = 'index.html';
        });
        
        // Handle close button
        document.getElementById('closeSuccess').addEventListener('click', () => {
            document.body.removeChild(successModal);
            document.head.removeChild(style);
        });
        
        // Close on background click
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                document.body.removeChild(successModal);
                document.head.removeChild(style);
            }
        });
    }
});
