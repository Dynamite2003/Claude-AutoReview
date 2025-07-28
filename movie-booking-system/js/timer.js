// 超时和订单管理类

class TimerManager {
    constructor() {
        this.timers = new Map();
        this.callbacks = new Map();
        this.intervals = new Map();
        this.defaultTimeout = 15 * 60; // 15分钟，单位：秒
    }

    /**
     * 创建定时器
     * @param {string} timerId - 定时器ID
     * @param {number} duration - 持续时间（秒）
     * @param {Function} onTick - 每秒回调函数
     * @param {Function} onComplete - 完成回调函数
     * @param {boolean} autoStart - 是否自动开始
     */
    createTimer(timerId, duration = this.defaultTimeout, onTick = null, onComplete = null, autoStart = true) {
        // 清除已存在的定时器
        this.clearTimer(timerId);

        const timer = {
            id: timerId,
            totalDuration: duration,
            remainingTime: duration,
            isRunning: false,
            isPaused: false,
            startTime: null,
            pauseTime: null,
            onTick,
            onComplete
        };

        this.timers.set(timerId, timer);

        if (autoStart) {
            this.startTimer(timerId);
        }

        return timer;
    }

    /**
     * 开始定时器
     * @param {string} timerId - 定时器ID
     */
    startTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || timer.isRunning) {
            return false;
        }

        timer.isRunning = true;
        timer.isPaused = false;
        timer.startTime = new Date();

        const intervalId = setInterval(() => {
            if (!timer.isRunning) {
                clearInterval(intervalId);
                return;
            }

            timer.remainingTime--;

            // 执行每秒回调
            if (timer.onTick) {
                timer.onTick(timer.remainingTime, timer);
            }

            // 检查是否完成
            if (timer.remainingTime <= 0) {
                this.completeTimer(timerId);
            }
        }, 1000);

        this.intervals.set(timerId, intervalId);
        return true;
    }

    /**
     * 暂停定时器
     * @param {string} timerId - 定时器ID
     */
    pauseTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isRunning || timer.isPaused) {
            return false;
        }

        timer.isPaused = true;
        timer.pauseTime = new Date();

        const intervalId = this.intervals.get(timerId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(timerId);
        }

        return true;
    }

    /**
     * 恢复定时器
     * @param {string} timerId - 定时器ID
     */
    resumeTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isRunning || !timer.isPaused) {
            return false;
        }

        timer.isPaused = false;
        timer.pauseTime = null;

        const intervalId = setInterval(() => {
            if (!timer.isRunning) {
                clearInterval(intervalId);
                return;
            }

            timer.remainingTime--;

            if (timer.onTick) {
                timer.onTick(timer.remainingTime, timer);
            }

            if (timer.remainingTime <= 0) {
                this.completeTimer(timerId);
            }
        }, 1000);

        this.intervals.set(timerId, intervalId);
        return true;
    }

    /**
     * 停止定时器
     * @param {string} timerId - 定时器ID
     */
    stopTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return false;
        }

        timer.isRunning = false;
        timer.isPaused = false;

        const intervalId = this.intervals.get(timerId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(timerId);
        }

        return true;
    }

    /**
     * 完成定时器
     * @param {string} timerId - 定时器ID
     */
    completeTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return false;
        }

        this.stopTimer(timerId);

        // 执行完成回调
        if (timer.onComplete) {
            timer.onComplete(timer);
        }

        return true;
    }

    /**
     * 重置定时器
     * @param {string} timerId - 定时器ID
     * @param {number} newDuration - 新的持续时间（可选）
     */
    resetTimer(timerId, newDuration = null) {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return false;
        }

        const wasRunning = timer.isRunning;
        this.stopTimer(timerId);

        if (newDuration !== null) {
            timer.totalDuration = newDuration;
        }

        timer.remainingTime = timer.totalDuration;
        timer.startTime = null;
        timer.pauseTime = null;

        if (wasRunning) {
            this.startTimer(timerId);
        }

        return true;
    }

    /**
     * 清除定时器
     * @param {string} timerId - 定时器ID
     */
    clearTimer(timerId) {
        this.stopTimer(timerId);
        this.timers.delete(timerId);
        return true;
    }

    /**
     * 获取定时器信息
     * @param {string} timerId - 定时器ID
     */
    getTimer(timerId) {
        return this.timers.get(timerId);
    }

    /**
     * 获取所有定时器
     */
    getAllTimers() {
        return Array.from(this.timers.values());
    }

    /**
     * 延长定时器时间
     * @param {string} timerId - 定时器ID
     * @param {number} additionalTime - 额外时间（秒）
     */
    extendTimer(timerId, additionalTime) {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return false;
        }

        timer.remainingTime += additionalTime;
        timer.totalDuration += additionalTime;
        return true;
    }

    /**
     * 获取格式化的剩余时间
     * @param {string} timerId - 定时器ID
     */
    getFormattedTime(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return '00:00';
        }

        return formatCountdown(Math.max(0, timer.remainingTime));
    }

    /**
     * 清除所有定时器
     */
    clearAllTimers() {
        this.timers.forEach((timer, timerId) => {
            this.clearTimer(timerId);
        });
    }
}

// 订单管理类
class OrderManager {
    constructor() {
        this.timerManager = new TimerManager();
        this.currentOrder = null;
        this.orderTimeout = 15 * 60; // 15分钟
        this.paymentTimeout = 15 * 60; // 支付超时时间
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 页面关闭前保存当前订单状态
        window.addEventListener('beforeunload', () => {
            if (this.currentOrder) {
                storage.setCurrentOrder(this.currentOrder);
            }
        });

        // 页面加载时恢复订单状态
        window.addEventListener('load', () => {
            this.restoreCurrentOrder();
        });
    }

    /**
     * 创建新订单
     * @param {Object} orderData - 订单数据
     */
    createOrder(orderData) {
        const order = {
            id: generateId(),
            movieId: orderData.movieId,
            movieTitle: orderData.movieTitle,
            showtimeId: orderData.showtimeId,
            showtime: orderData.showtime,
            hall: orderData.hall,
            seats: orderData.seats || [],
            totalPrice: orderData.totalPrice || 0,
            servicePrice: 5, // 服务费
            finalPrice: (orderData.totalPrice || 0) + 5,
            status: 'selecting', // selecting, pending, paid, cancelled, expired
            createTime: new Date(),
            updateTime: new Date(),
            expiryTime: new Date(Date.now() + this.orderTimeout * 1000)
        };

        this.currentOrder = order;
        storage.setCurrentOrder(order);

        // 创建选座超时定时器
        this.startSeatSelectionTimer(order.id);

        return order;
    }

    /**
     * 开始选座超时定时器
     * @param {string} orderId - 订单ID
     */
    startSeatSelectionTimer(orderId) {
        const countdownElement = document.getElementById('countdown');
        
        this.timerManager.createTimer(
            `seat_${orderId}`,
            this.orderTimeout,
            (remainingTime) => {
                // 更新界面显示
                if (countdownElement) {
                    countdownElement.textContent = formatCountdown(remainingTime);
                    
                    // 最后1分钟变红色警告
                    if (remainingTime <= 60) {
                        countdownElement.style.color = '#dc3545';
                        countdownElement.style.animation = 'blink 1s infinite';
                    }
                }
            },
            () => {
                // 超时处理
                this.handleSeatSelectionTimeout(orderId);
            }
        );
    }

    /**
     * 处理选座超时
     * @param {string} orderId - 订单ID
     */
    handleSeatSelectionTimeout(orderId) {
        if (this.currentOrder && this.currentOrder.id === orderId) {
            // 释放已选座位
            if (this.currentOrder.seats && this.currentOrder.seats.length > 0) {
                this.releasseSeats(this.currentOrder.hall, this.currentOrder.seats);
            }

            // 更新订单状态
            this.currentOrder.status = 'expired';
            this.currentOrder.updateTime = new Date();

            // 保存到历史订单
            storage.saveOrder(this.currentOrder);

            // 清除当前订单
            this.clearCurrentOrder();

            // 显示超时提示
            showToast('选座时间已超时，座位已自动释放', 'warning', 5000);

            // 返回电影选择页面
            if (typeof app !== 'undefined' && app.showMoviePage) {
                setTimeout(() => {
                    app.showMoviePage();
                }, 2000);
            }
        }
    }

    /**
     * 确认选座，进入支付
     * @param {Array} selectedSeats - 选中的座位
     */
    confirmSeatSelection(selectedSeats) {
        if (!this.currentOrder) {
            showToast('订单信息丢失，请重新选择', 'error');
            return false;
        }

        // 停止选座定时器
        this.timerManager.clearTimer(`seat_${this.currentOrder.id}`);

        // 更新订单信息
        this.currentOrder.seats = selectedSeats;
        this.currentOrder.status = 'pending';
        this.currentOrder.updateTime = new Date();
        this.currentOrder.expiryTime = new Date(Date.now() + this.paymentTimeout * 1000);

        // 保存订单
        storage.setCurrentOrder(this.currentOrder);

        // 开始支付超时定时器
        this.startPaymentTimer(this.currentOrder.id);

        return true;
    }

    /**
     * 开始支付超时定时器
     * @param {string} orderId - 订单ID
     */
    startPaymentTimer(orderId) {
        const countdownElement = document.getElementById('paymentCountdown');
        
        this.timerManager.createTimer(
            `payment_${orderId}`,
            this.paymentTimeout,
            (remainingTime) => {
                // 更新支付页面倒计时
                if (countdownElement) {
                    countdownElement.textContent = formatCountdown(remainingTime);
                    
                    // 最后2分钟变红色警告
                    if (remainingTime <= 120) {
                        countdownElement.style.color = '#dc3545';
                        countdownElement.parentElement.style.animation = 'blink 1s infinite';
                    }
                }
            },
            () => {
                // 支付超时处理
                this.handlePaymentTimeout(orderId);
            }
        );
    }

    /**
     * 处理支付超时
     * @param {string} orderId - 订单ID
     */
    handlePaymentTimeout(orderId) {
        if (this.currentOrder && this.currentOrder.id === orderId) {
            // 释放座位
            if (this.currentOrder.seats && this.currentOrder.seats.length > 0) {
                this.releasseSeats(this.currentOrder.hall, this.currentOrder.seats);
            }

            // 更新订单状态
            this.currentOrder.status = 'expired';
            this.currentOrder.updateTime = new Date();

            // 保存到历史订单
            storage.saveOrder(this.currentOrder);

            // 清除当前订单
            this.clearCurrentOrder();

            // 显示超时提示
            showToast('支付时间已超时，订单已自动取消', 'warning', 5000);

            // 返回首页
            if (typeof app !== 'undefined' && app.showMoviePage) {
                setTimeout(() => {
                    app.showMoviePage();
                }, 2000);
            }
        }
    }

    /**
     * 完成支付
     * @param {string} paymentMethod - 支付方式
     */
    completePayment(paymentMethod) {
        if (!this.currentOrder) {
            showToast('订单信息丢失', 'error');
            return false;
        }

        // 停止支付定时器
        this.timerManager.clearTimer(`payment_${this.currentOrder.id}`);

        // 更新订单状态
        this.currentOrder.status = 'paid';
        this.currentOrder.paymentMethod = paymentMethod;
        this.currentOrder.paymentTime = new Date();
        this.currentOrder.updateTime = new Date();

        // 将座位标记为已占用
        this.occupySeats(this.currentOrder.hall, this.currentOrder.seats);

        // 保存到历史订单
        storage.saveOrder(this.currentOrder);

        // 清除当前订单
        this.clearCurrentOrder();

        showToast('支付成功！', 'success');
        return true;
    }

    /**
     * 取消订单
     * @param {string} reason - 取消原因
     */
    cancelOrder(reason = '用户取消') {
        if (!this.currentOrder) {
            return false;
        }

        // 停止所有相关定时器
        this.timerManager.clearTimer(`seat_${this.currentOrder.id}`);
        this.timerManager.clearTimer(`payment_${this.currentOrder.id}`);

        // 释放座位
        if (this.currentOrder.seats && this.currentOrder.seats.length > 0) {
            this.releasseSeats(this.currentOrder.hall, this.currentOrder.seats);
        }

        // 更新订单状态
        this.currentOrder.status = 'cancelled';
        this.currentOrder.cancelReason = reason;
        this.currentOrder.cancelTime = new Date();
        this.currentOrder.updateTime = new Date();

        // 保存到历史订单
        storage.saveOrder(this.currentOrder);

        // 清除当前订单
        this.clearCurrentOrder();

        showToast('订单已取消', 'info');
        return true;
    }

    /**
     * 申请退票
     * @param {string} orderId - 订单ID
     * @param {string} reason - 退票原因
     */
    refundOrder(orderId, reason) {
        const order = storage.getOrder(orderId);
        if (!order) {
            showToast('订单不存在', 'error');
            return false;
        }

        if (order.status !== 'paid') {
            showToast('只有已支付订单才能申请退票', 'error');
            return false;
        }

        // 检查退票时限（假设电影开始前2小时内不能退票）
        const showtime = new Date(order.showtime);
        const now = new Date();
        const timeDiff = (showtime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (timeDiff < 2) {
            showToast('电影开始前2小时内无法退票', 'error');
            return false;
        }

        // 更新订单状态
        const updates = {
            status: 'refunded',
            refundReason: reason,
            refundTime: new Date(),
            refundAmount: order.finalPrice * 0.9 // 收取10%手续费
        };

        storage.updateOrder(orderId, updates);

        // 释放座位
        this.releasseSeats(order.hall, order.seats);

        showToast('退票成功，退款将在3-5个工作日内到账', 'success');
        return true;
    }

    /**
     * 释放座位
     * @param {string} hallName - 影厅名称
     * @param {Array} seats - 座位数组
     */
    releasseSeats(hallName, seats) {
        const seatUpdates = seats.map(seat => ({
            row: seat.row,
            col: seat.col,
            updates: { isSelected: false }
        }));

        storage.updateSeats(hallName, seatUpdates);
    }

    /**
     * 占用座位
     * @param {string} hallName - 影厅名称
     * @param {Array} seats - 座位数组
     */
    occupySeats(hallName, seats) {
        const seatUpdates = seats.map(seat => ({
            row: seat.row,
            col: seat.col,
            updates: { 
                isSelected: false,
                isAvailable: false,
                type: 'occupied'
            }
        }));

        storage.updateSeats(hallName, seatUpdates);
    }

    /**
     * 获取当前订单
     */
    getCurrentOrder() {
        return this.currentOrder;
    }

    /**
     * 清除当前订单
     */
    clearCurrentOrder() {
        this.currentOrder = null;
        storage.clearCurrentOrder();
        this.timerManager.clearAllTimers();
    }

    /**
     * 恢复当前订单
     */
    restoreCurrentOrder() {
        const savedOrder = storage.getCurrentOrder();
        if (!savedOrder) {
            return false;
        }

        const now = new Date();
        const expiryTime = new Date(savedOrder.expiryTime);

        // 检查订单是否已过期
        if (now > expiryTime) {
            // 订单已过期，清理数据
            this.handleOrderExpiry(savedOrder);
            return false;
        }

        // 恢复订单
        this.currentOrder = savedOrder;

        // 计算剩余时间并重新启动定时器
        const remainingTime = Math.floor((expiryTime.getTime() - now.getTime()) / 1000);

        if (savedOrder.status === 'selecting') {
            this.timerManager.createTimer(
                `seat_${savedOrder.id}`,
                remainingTime,
                (time) => {
                    const countdownElement = document.getElementById('countdown');
                    if (countdownElement) {
                        countdownElement.textContent = formatCountdown(time);
                    }
                },
                () => this.handleSeatSelectionTimeout(savedOrder.id)
            );
        } else if (savedOrder.status === 'pending') {
            this.timerManager.createTimer(
                `payment_${savedOrder.id}`,
                remainingTime,
                (time) => {
                    const countdownElement = document.getElementById('paymentCountdown');
                    if (countdownElement) {
                        countdownElement.textContent = formatCountdown(time);
                    }
                },
                () => this.handlePaymentTimeout(savedOrder.id)
            );
        }

        return true;
    }

    /**
     * 处理订单过期
     * @param {Object} expiredOrder - 过期的订单
     */
    handleOrderExpiry(expiredOrder) {
        // 释放座位
        if (expiredOrder.seats && expiredOrder.seats.length > 0) {
            this.releasseSeats(expiredOrder.hall, expiredOrder.seats);
        }

        // 更新订单状态
        expiredOrder.status = 'expired';
        expiredOrder.updateTime = new Date();

        // 保存到历史记录
        storage.saveOrder(expiredOrder);

        // 清除当前订单
        storage.clearCurrentOrder();
    }

    /**
     * 获取订单状态文本
     * @param {string} status - 订单状态
     */
    getStatusText(status) {
        const statusMap = {
            'selecting': '选座中',
            'pending': '待支付',
            'paid': '已支付',
            'cancelled': '已取消',
            'expired': '已过期',
            'refunded': '已退款'
        };
        return statusMap[status] || '未知状态';
    }

    /**
     * 获取订单状态样式类
     * @param {string} status - 订单状态
     */
    getStatusClass(status) {
        const classMap = {
            'selecting': 'pending',
            'pending': 'pending',
            'paid': 'paid',
            'cancelled': 'cancelled',
            'expired': 'expired',
            'refunded': 'cancelled'
        };
        return classMap[status] || '';
    }
}

// 添加闪烁动画样式
const blinkAnimation = `
@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
}
`;

if (!document.getElementById('timerStyles')) {
    const style = document.createElement('style');
    style.id = 'timerStyles';
    style.textContent = blinkAnimation;
    document.head.appendChild(style);
}

// 创建全局实例
const timerManager = new TimerManager();
const orderManager = new OrderManager();