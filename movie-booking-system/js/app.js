// 主应用程序

class MovieBookingApp {
    constructor() {
        this.currentPage = 'movie';
        this.currentMovie = null;
        this.currentShowtime = null;
        this.bindEvents();
        this.initialize();
    }

    /**
     * 初始化应用
     */
    initialize() {
        this.showMoviePage();
        this.loadMovies();
        
        // 检查是否有未完成的订单
        setTimeout(() => {
            this.checkIncompleteOrder();
        }, 100);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航按钮事件
        document.getElementById('homeBtn')?.addEventListener('click', () => {
            this.showMoviePage();
        });

        document.getElementById('ordersBtn')?.addEventListener('click', () => {
            this.showOrdersPage();
        });

        // 返回按钮事件
        document.getElementById('backToShowtime')?.addEventListener('click', () => {
            this.showShowtimePage(this.currentMovie);
        });

        // 确认订座按钮
        document.getElementById('confirmBooking')?.addEventListener('click', () => {
            this.confirmSeatSelection();
        });

        // 支付相关按钮
        document.getElementById('confirmPayment')?.addEventListener('click', () => {
            this.processPayment();
        });

        document.getElementById('cancelPayment')?.addEventListener('click', () => {
            this.cancelCurrentOrder();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // 页面可见性变化（用于暂停/恢复定时器）
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * 显示电影选择页面
     */
    showMoviePage() {
        this.switchPage('moviePage');
        this.currentPage = 'movie';
        this.loadMovies();
    }

    /**
     * 显示场次选择页面
     * @param {Object} movie - 电影对象
     */
    showShowtimePage(movie) {
        this.currentMovie = movie;
        this.switchPage('showtimePage');
        this.currentPage = 'showtime';
        this.loadMovieDetails(movie);
        this.loadShowtimes(movie);
    }

    /**
     * 显示选座页面
     * @param {Object} movie - 电影对象
     * @param {Object} showtime - 场次对象
     */
    showSeatPage(movie, showtime) {
        this.currentMovie = movie;
        this.currentShowtime = showtime;
        this.switchPage('seatPage');
        this.currentPage = 'seat';
        
        // 创建订单
        const order = orderManager.createOrder({
            movieId: movie.id,
            movieTitle: movie.title,
            showtimeId: showtime.id,
            showtime: `${formatDate(new Date(), 'MM-DD')} ${showtime.time}`,
            hall: showtime.hall,
            totalPrice: 0
        });

        if (!order) {
            showToast('创建订单失败', 'error');
            this.showMoviePage();
            return;
        }

        // 加载选座信息
        this.loadSeatBookingInfo(movie, showtime);
        
        // 初始化座位地图
        if (!seatManager.initializeSeatMap(showtime.hall, movie, showtime)) {
            showToast('座位地图加载失败', 'error');
            this.showShowtimePage(movie);
        }
    }

    /**
     * 显示支付页面
     */
    showPaymentPage() {
        this.switchPage('paymentPage');
        this.currentPage = 'payment';
        this.loadPaymentInfo();
    }

    /**
     * 显示订单页面
     */
    showOrdersPage() {
        this.switchPage('ordersPage');
        this.currentPage = 'orders';
        this.loadOrders();
    }

    /**
     * 切换页面
     * @param {string} pageId - 页面ID
     */
    switchPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }
    }

    /**
     * 加载电影列表
     */
    loadMovies() {
        const movies = storage.getMovies();
        const movieGrid = document.getElementById('movieGrid');
        
        if (!movieGrid || !movies.length) {
            return;
        }

        let html = '';
        movies.forEach(movie => {
            const availableShowtimes = movie.showtimes.filter(st => st.availableSeats > 0).length;
            
            html += `
                <div class="movie-card" onclick="app.showShowtimePage(${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                    <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaaguaXoOWbvueJhzwvdGV4dD48L3N2Zz4='">
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-description">${movie.description}</p>
                        <div class="movie-meta">
                            <span class="movie-duration">${movie.duration}分钟</span>
                            <span class="movie-price">起${formatPrice(movie.price)}</span>
                        </div>
                        <div class="movie-meta">
                            <span style="color: #28a745;">${availableShowtimes}个场次可选</span>
                        </div>
                    </div>
                </div>
            `;
        });

        movieGrid.innerHTML = html;
    }

    /**
     * 加载电影详情
     * @param {Object} movie - 电影对象
     */
    loadMovieDetails(movie) {
        document.getElementById('selectedMoviePoster').src = movie.poster;
        document.getElementById('selectedMovieTitle').textContent = movie.title;
        document.getElementById('selectedMovieDesc').textContent = movie.description;
        document.getElementById('selectedMovieDuration').textContent = `时长：${movie.duration}分钟`;
    }

    /**
     * 加载场次列表
     * @param {Object} movie - 电影对象
     */
    loadShowtimes(movie) {
        const showtimeList = document.getElementById('showtimeList');
        if (!showtimeList) return;

        let html = '';
        movie.showtimes.forEach(showtime => {
            const isAvailable = showtime.availableSeats > 0;
            const availabilityClass = isAvailable ? '' : 'disabled';
            const availabilityText = isAvailable ? 
                `剩余${showtime.availableSeats}座` : 
                '售罄';

            html += `
                <div class="showtime-card ${availabilityClass}" 
                     ${isAvailable ? `onclick="app.showSeatPage(${JSON.stringify(movie).replace(/"/g, '&quot;')}, ${JSON.stringify(showtime).replace(/"/g, '&quot;')})"` : ''}>
                    <div class="showtime-header">
                        <div class="showtime-time">${showtime.time}</div>
                        <div class="showtime-hall">${showtime.hall}</div>
                    </div>
                    <div class="showtime-info">
                        <div class="available-seats">${availabilityText}</div>
                        <div class="showtime-price">起${formatPrice(movie.price)}</div>
                    </div>
                </div>
            `;
        });

        showtimeList.innerHTML = html;
    }

    /**
     * 加载选座页面的预订信息
     * @param {Object} movie - 电影对象
     * @param {Object} showtime - 场次对象
     */
    loadSeatBookingInfo(movie, showtime) {
        document.getElementById('bookingMovieName').textContent = movie.title;
        document.getElementById('bookingShowtime').textContent = 
            `${formatDate(new Date(), 'MM-DD')} ${showtime.time} ${showtime.hall}`;
    }

    /**
     * 确认选座
     */
    confirmSeatSelection() {
        const selectedSeats = seatManager.getSelectedSeats();
        
        if (selectedSeats.length === 0) {
            showToast('请先选择座位', 'warning');
            return;
        }

        const totalPrice = seatManager.getTotalPrice();
        
        // 确认选座
        if (orderManager.confirmSeatSelection(selectedSeats)) {
            // 更新订单价格
            const currentOrder = orderManager.getCurrentOrder();
            if (currentOrder) {
                currentOrder.totalPrice = totalPrice;
                currentOrder.finalPrice = totalPrice + 5; // 加上服务费
                storage.setCurrentOrder(currentOrder);
            }

            this.showPaymentPage();
        }
    }

    /**
     * 加载支付信息
     */
    loadPaymentInfo() {
        const currentOrder = orderManager.getCurrentOrder();
        if (!currentOrder) {
            showToast('订单信息丢失', 'error');
            this.showMoviePage();
            return;
        }

        document.getElementById('paymentMovieTitle').textContent = currentOrder.movieTitle;
        document.getElementById('paymentShowtime').textContent = 
            `${currentOrder.showtime} ${currentOrder.hall}`;
        
        const seatNames = currentOrder.seats.map(seat => seat.name).join(', ');
        document.getElementById('paymentSeats').textContent = `座位：${seatNames}`;
        document.getElementById('paymentAmount').textContent = formatPrice(currentOrder.finalPrice);
    }

    /**
     * 处理支付
     */
    async processPayment() {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        
        if (!paymentMethod) {
            showToast('请选择支付方式', 'warning');
            return;
        }

        const confirmed = await showConfirm(
            '确认支付',
            `确认使用${this.getPaymentMethodText(paymentMethod)}支付吗？`,
            '确认支付',
            '取消'
        );

        if (!confirmed) {
            return;
        }

        // 显示加载
        showLoading(true);

        // 模拟支付处理时间
        setTimeout(() => {
            showLoading(false);
            
            if (orderManager.completePayment(paymentMethod)) {
                this.showPaymentSuccess();
            } else {
                showToast('支付失败，请重试', 'error');
            }
        }, 2000);
    }

    /**
     * 获取支付方式文本
     * @param {string} method - 支付方式
     */
    getPaymentMethodText(method) {
        const methodMap = {
            'alipay': '支付宝',
            'wechat': '微信支付',
            'card': '银行卡'
        };
        return methodMap[method] || method;
    }

    /**
     * 显示支付成功
     */
    async showPaymentSuccess() {
        await showConfirm(
            '支付成功',
            '恭喜您！电影票购买成功，请准时观影。',
            '查看订单',
            '返回首页'
        );

        // 无论用户选择什么，都显示订单页面
        this.showOrdersPage();
    }

    /**
     * 取消当前订单
     */
    async cancelCurrentOrder() {
        const confirmed = await showConfirm(
            '取消订单',
            '确定要取消当前订单吗？已选座位将被释放。',
            '确定取消',
            '继续支付'
        );

        if (confirmed) {
            orderManager.cancelOrder('用户主动取消');
            seatManager.reset();
            this.showMoviePage();
        }
    }

    /**
     * 加载订单列表
     */
    loadOrders() {
        const orders = storage.getOrders().sort((a, b) => 
            new Date(b.createTime) - new Date(a.createTime)
        );
        
        const ordersContainer = document.getElementById('ordersList');
        if (!ordersContainer) return;

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-orders">
                    <div class="empty-orders-icon">🎬</div>
                    <p>暂无订单记录</p>
                    <button class="btn btn-primary" onclick="app.showMoviePage()">立即购票</button>
                </div>
            `;
            return;
        }

        let html = '';
        orders.forEach(order => {
            const statusClass = orderManager.getStatusClass(order.status);
            const statusText = orderManager.getStatusText(order.status);
            const seatNames = order.seats ? order.seats.map(seat => seat.name).join(', ') : '无';
            const canRefund = order.status === 'paid' && this.canRefundOrder(order);

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-id">订单号：${order.id}</div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="order-details">
                        <div class="order-movie">${order.movieTitle}</div>
                        <div class="order-info-row">
                            <span>场次时间：</span>
                            <span>${order.showtime}</span>
                        </div>
                        <div class="order-info-row">
                            <span>影厅座位：</span>
                            <span>${order.hall} ${seatNames}</span>
                        </div>
                        <div class="order-info-row">
                            <span>订单金额：</span>
                            <span class="price">${formatPrice(order.finalPrice || 0)}</span>
                        </div>
                        <div class="order-info-row">
                            <span>创建时间：</span>
                            <span>${formatDate(new Date(order.createTime))}</span>
                        </div>
                    </div>
                    <div class="order-actions">
                        ${canRefund ? `<button class="btn btn-danger" onclick="app.refundOrder('${order.id}')">申请退票</button>` : ''}
                        ${order.status === 'paid' ? `<button class="btn btn-secondary" onclick="app.showOrderDetails('${order.id}')">查看详情</button>` : ''}
                    </div>
                </div>
            `;
        });

        ordersContainer.innerHTML = html;
    }

    /**
     * 检查订单是否可以退票
     * @param {Object} order - 订单对象
     */
    canRefundOrder(order) {
        if (order.status !== 'paid') return false;
        
        try {
            const showtime = new Date(order.showtime);
            const now = new Date();
            const timeDiff = (showtime.getTime() - now.getTime()) / (1000 * 60 * 60);
            return timeDiff > 2; // 电影开始前2小时可退票
        } catch (e) {
            return false;
        }
    }

    /**
     * 申请退票
     * @param {string} orderId - 订单ID
     */
    async refundOrder(orderId) {
        const confirmed = await showConfirm(
            '申请退票',
            '确定要申请退票吗？退票将收取10%的手续费。',
            '确定退票',
            '取消'
        );

        if (confirmed) {
            if (orderManager.refundOrder(orderId, '用户申请退票')) {
                this.loadOrders(); // 刷新订单列表
            }
        }
    }

    /**
     * 显示订单详情
     * @param {string} orderId - 订单ID
     */
    showOrderDetails(orderId) {
        const order = storage.getOrder(orderId);
        if (!order) {
            showToast('订单不存在', 'error');
            return;
        }

        const seatNames = order.seats ? order.seats.map(seat => seat.name).join(', ') : '无';
        const paymentTime = order.paymentTime ? formatDate(new Date(order.paymentTime)) : '未支付';
        
        showConfirm(
            '订单详情',
            `电影：${order.movieTitle}\n场次：${order.showtime}\n座位：${order.hall} ${seatNames}\n金额：${formatPrice(order.finalPrice || 0)}\n支付时间：${paymentTime}`,
            '关闭',
            ''
        );
    }

    /**
     * 检查未完成订单
     */
    checkIncompleteOrder() {
        const currentOrder = orderManager.getCurrentOrder();
        if (currentOrder) {
            const message = currentOrder.status === 'selecting' ? 
                '您有未完成的选座，是否继续？' : 
                '您有未支付的订单，是否继续支付？';
                
            showConfirm('未完成订单', message, '继续', '取消')
                .then(result => {
                    if (result) {
                        this.resumeIncompleteOrder(currentOrder);
                    } else {
                        orderManager.cancelOrder('用户放弃');
                    }
                });
        }
    }

    /**
     * 恢复未完成订单
     * @param {Object} order - 订单对象
     */
    resumeIncompleteOrder(order) {
        const movie = storage.getMovie(order.movieId);
        if (!movie) {
            showToast('电影信息已失效', 'error');
            orderManager.cancelOrder('电影信息失效');
            return;
        }

        const showtime = movie.showtimes.find(st => st.id === order.showtimeId);
        if (!showtime) {
            showToast('场次信息已失效', 'error');
            orderManager.cancelOrder('场次信息失效');
            return;
        }

        if (order.status === 'selecting') {
            this.showSeatPage(movie, showtime);
        } else if (order.status === 'pending') {
            this.currentMovie = movie;
            this.currentShowtime = showtime;
            this.showPaymentPage();
        }
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeydown(e) {
        // ESC键返回上一页
        if (e.key === 'Escape') {
            e.preventDefault();
            switch (this.currentPage) {
                case 'showtime':
                    this.showMoviePage();
                    break;
                case 'seat':
                    this.showShowtimePage(this.currentMovie);
                    break;
                case 'payment':
                    this.showSeatPage(this.currentMovie, this.currentShowtime);
                    break;
                case 'orders':
                    this.showMoviePage();
                    break;
            }
        }

        // 在选座页面按数字键快速选择座位
        if (this.currentPage === 'seat' && /^[1-8]$/.test(e.key)) {
            e.preventDefault();
            const count = parseInt(e.key);
            seatManager.autoSelectSeats(count);
        }

        // Ctrl+Enter 快速确认
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (this.currentPage === 'seat') {
                this.confirmSeatSelection();
            } else if (this.currentPage === 'payment') {
                this.processPayment();
            }
        }
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        const currentOrder = orderManager.getCurrentOrder();
        if (!currentOrder) return;

        if (document.hidden) {
            // 页面隐藏时暂停定时器
            if (currentOrder.status === 'selecting') {
                timerManager.pauseTimer(`seat_${currentOrder.id}`);
            } else if (currentOrder.status === 'pending') {
                timerManager.pauseTimer(`payment_${currentOrder.id}`);
            }
        } else {
            // 页面显示时恢复定时器
            if (currentOrder.status === 'selecting') {
                timerManager.resumeTimer(`seat_${currentOrder.id}`);
            } else if (currentOrder.status === 'pending') {
                timerManager.resumeTimer(`payment_${currentOrder.id}`);
            }
        }
    }

    /**
     * 获取当前页面
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * 获取应用状态
     */
    getAppState() {
        return {
            currentPage: this.currentPage,
            currentMovie: this.currentMovie,
            currentShowtime: this.currentShowtime,
            currentOrder: orderManager.getCurrentOrder(),
            selectedSeats: seatManager.getSelectedSeats()
        };
    }
}

// 创建全局应用实例
const app = new MovieBookingApp();

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
    showToast('系统出现错误，请刷新页面重试', 'error');
});

// 未处理的Promise异常
window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise异常:', e.reason);
    showToast('操作失败，请重试', 'error');
});

// 导出给外部使用
window.movieBookingApp = app;