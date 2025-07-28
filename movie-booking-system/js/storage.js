// 本地存储管理类

class StorageManager {
    constructor() {
        this.prefix = 'movieBooking_';
        this.initializeData();
    }

    /**
     * 初始化默认数据
     */
    initializeData() {
        // 如果没有初始化数据，则创建默认数据
        if (!this.getData('initialized')) {
            this.initializeMovies();
            this.initializeTheaters();
            this.initializeSeatLayouts();
            this.setData('initialized', true);
        }
    }

    /**
     * 初始化电影数据
     */
    initializeMovies() {
        const movies = [
            {
                id: 'movie1',
                title: '流浪地球2',
                description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出...',
                duration: 173,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY3ZWVhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7mtZHmtYHlnLDnkIMyPC90ZXh0Pjwvc3ZnPg==',
                price: 45,
                showtimes: [
                    { id: 'st1', time: '09:30', hall: '1号厅', availableSeats: 89, totalSeats: 120 },
                    { id: 'st2', time: '12:15', hall: '1号厅', availableSeats: 67, totalSeats: 120 },
                    { id: 'st3', time: '15:45', hall: '2号厅', availableSeats: 134, totalSeats: 150 },
                    { id: 'st4', time: '18:30', hall: '1号厅', availableSeats: 23, totalSeats: 120 },
                    { id: 'st5', time: '21:20', hall: '3号厅', availableSeats: 98, totalSeats: 100 }
                ]
            },
            {
                id: 'movie2',
                title: '满江红',
                description: '南宋绍兴年间，岳飞死后四年，秦桧率兵与金国会谈。会谈前夜，金国使者死在宰相驻地，密信也不翼而飞。小兵张大与亲兵营副统领孙均受命彻查此事...',
                duration: 159,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGMzNTQ1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7mu6Hlsoxnhqk8L3RleHQ+PC9zdmc+',
                price: 42,
                showtimes: [
                    { id: 'st6', time: '10:00', hall: '2号厅', availableSeats: 123, totalSeats: 150 },
                    { id: 'st7', time: '13:30', hall: '3号厅', availableSeats: 45, totalSeats: 100 },
                    { id: 'st8', time: '16:15', hall: '1号厅', availableSeats: 78, totalSeats: 120 },
                    { id: 'st9', time: '19:45', hall: '2号厅', availableSeats: 12, totalSeats: 150 },
                    { id: 'st10', time: '22:30', hall: '3号厅', availableSeats: 89, totalSeats: 100 }
                ]
            },
            {
                id: 'movie3',
                title: '深海',
                description: '一位少女在神秘的深海世界中追寻探索，邂逅一段独特生命旅程的故事。影片以创新技术打造出瑰丽梦幻的深海世界...',
                duration: 112,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTdhMmI4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7mt7HmtbdPC3RleHQ+PC9zdmc+',
                price: 38,
                showtimes: [
                    { id: 'st11', time: '11:20', hall: '3号厅', availableSeats: 78, totalSeats: 100 },
                    { id: 'st12', time: '14:00', hall: '1号厅', availableSeats: 56, totalSeats: 120 },
                    { id: 'st13', time: '16:40', hall: '3号厅', availableSeats: 34, totalSeats: 100 },
                    { id: 'st14', time: '20:15', hall: '1号厅', availableSeats: 87, totalSeats: 120 }
                ]
            },
            {
                id: 'movie4',
                title: '阿凡达：水之道',
                description: '杰克·萨利已在潘多拉星球上生活，与妮蒂莉组建了家庭，育有一双儿女。某天意外来袭，尽管杰克拼死抵抗，但最终还是败下阵来...',
                duration: 192,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjhhNzQ1Ii8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7pmL/lh6Hmib46PC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNTUlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5rC05LmL6YGTDOwtV6IlZ0Ik1oWs2cD5+fG5+9zksL3d+fG5+CRC90ZXh0Pjwvc3ZnPg==',
                price: 55,
                showtimes: [
                    { id: 'st15', time: '09:00', hall: '2号厅', availableSeats: 134, totalSeats: 150 },
                    { id: 'st16', time: '12:45', hall: '2号厅', availableSeats: 98, totalSeats: 150 },
                    { id: 'st17', time: '16:30', hall: '2号厅', availableSeats: 67, totalSeats: 150 },
                    { id: 'st18', time: '20:15', hall: '2号厅', availableSeats: 23, totalSeats: 150 }
                ]
            }
        ];
        this.setData('movies', movies);
    }

    /**
     * 初始化影厅数据
     */
    initializeTheaters() {
        const theaters = {
            '1号厅': { rows: 12, seatsPerRow: 10, totalSeats: 120 },
            '2号厅': { rows: 15, seatsPerRow: 10, totalSeats: 150 },
            '3号厅': { rows: 10, seatsPerRow: 10, totalSeats: 100 }
        };
        this.setData('theaters', theaters);
    }

    /**
     * 初始化座位布局
     */
    initializeSeatLayouts() {
        const layouts = {
            '1号厅': this.generateSeatLayout(12, 10, 'standard'),
            '2号厅': this.generateSeatLayout(15, 10, 'large'),
            '3号厅': this.generateSeatLayout(10, 10, 'small')
        };
        this.setData('seatLayouts', layouts);
    }

    /**
     * 生成座位布局
     * @param {number} rows - 行数
     * @param {number} cols - 列数
     * @param {string} type - 影厅类型
     */
    generateSeatLayout(rows, cols, type) {
        const layout = [];
        
        for (let row = 0; row < rows; row++) {
            const seatRow = [];
            for (let col = 0; col < cols; col++) {
                let seatType = 'normal';
                let isAvailable = true;
                
                // 根据影厅类型设置特殊座位
                if (type === 'large') {
                    // 大影厅：前两排VIP，最后两排情侣座
                    if (row < 2) {
                        seatType = 'vip';
                    } else if (row >= rows - 2 && col % 2 === 0 && col < cols - 1) {
                        seatType = 'couple';
                    }
                } else if (type === 'standard') {
                    // 标准影厅：第一排VIP，最后一排部分情侣座
                    if (row === 0) {
                        seatType = 'vip';
                    } else if (row === rows - 1 && col >= 2 && col <= 6 && col % 2 === 0) {
                        seatType = 'couple';
                    }
                }
                
                // 随机设置一些座位为已占用或维护中
                const random = Math.random();
                if (random < 0.15) {
                    isAvailable = false;
                    seatType = 'occupied';
                } else if (random < 0.02) {
                    isAvailable = false;
                    seatType = 'maintenance';
                }
                
                seatRow.push({
                    row,
                    col,
                    type: seatType,
                    isAvailable,
                    isSelected: false,
                    price: this.getSeatPrice(seatType)
                });
            }
            layout.push(seatRow);
        }
        
        return layout;
    }

    /**
     * 获取座位价格
     * @param {string} seatType - 座位类型
     */
    getSeatPrice(seatType) {
        const basePrice = 40;
        switch (seatType) {
            case 'vip':
                return basePrice + 20;
            case 'couple':
                return basePrice + 15;
            default:
                return basePrice;
        }
    }

    /**
     * 存储数据
     * @param {string} key - 键名
     * @param {any} data - 数据
     */
    setData(key, data) {
        try {
            const fullKey = this.prefix + key;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    /**
     * 获取数据
     * @param {string} key - 键名
     * @returns {any} - 数据
     */
    getData(key) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('获取数据失败:', error);
            return null;
        }
    }

    /**
     * 删除数据
     * @param {string} key - 键名
     */
    removeData(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有数据
     */
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 获取所有电影
     */
    getMovies() {
        return this.getData('movies') || [];
    }

    /**
     * 根据ID获取电影
     * @param {string} movieId - 电影ID
     */
    getMovie(movieId) {
        const movies = this.getMovies();
        return movies.find(movie => movie.id === movieId);
    }

    /**
     * 获取影厅信息
     * @param {string} hallName - 影厅名称
     */
    getTheater(hallName) {
        const theaters = this.getData('theaters') || {};
        return theaters[hallName];
    }

    /**
     * 获取座位布局
     * @param {string} hallName - 影厅名称
     */
    getSeatLayout(hallName) {
        const layouts = this.getData('seatLayouts') || {};
        return layouts[hallName];
    }

    /**
     * 更新座位状态
     * @param {string} hallName - 影厅名称
     * @param {number} row - 行号
     * @param {number} col - 列号
     * @param {Object} updates - 更新的属性
     */
    updateSeat(hallName, row, col, updates) {
        const layouts = this.getData('seatLayouts') || {};
        if (layouts[hallName] && layouts[hallName][row] && layouts[hallName][row][col]) {
            Object.assign(layouts[hallName][row][col], updates);
            return this.setData('seatLayouts', layouts);
        }
        return false;
    }

    /**
     * 批量更新座位状态
     * @param {string} hallName - 影厅名称
     * @param {Array} seatUpdates - 座位更新数组
     */
    updateSeats(hallName, seatUpdates) {
        const layouts = this.getData('seatLayouts') || {};
        if (!layouts[hallName]) return false;

        seatUpdates.forEach(({ row, col, updates }) => {
            if (layouts[hallName][row] && layouts[hallName][row][col]) {
                Object.assign(layouts[hallName][row][col], updates);
            }
        });

        return this.setData('seatLayouts', layouts);
    }

    /**
     * 重置座位选择状态
     * @param {string} hallName - 影厅名称
     */
    resetSeatSelection(hallName) {
        const layouts = this.getData('seatLayouts') || {};
        if (!layouts[hallName]) return false;

        layouts[hallName].forEach(row => {
            row.forEach(seat => {
                if (seat.isSelected) {
                    seat.isSelected = false;
                }
            });
        });

        return this.setData('seatLayouts', layouts);
    }

    /**
     * 保存订单
     * @param {Object} order - 订单信息
     */
    saveOrder(order) {
        const orders = this.getData('orders') || [];
        order.id = order.id || generateId();
        order.createTime = order.createTime || new Date();
        orders.push(order);
        return this.setData('orders', orders);
    }

    /**
     * 获取所有订单
     */
    getOrders() {
        return this.getData('orders') || [];
    }

    /**
     * 根据ID获取订单
     * @param {string} orderId - 订单ID
     */
    getOrder(orderId) {
        const orders = this.getOrders();
        return orders.find(order => order.id === orderId);
    }

    /**
     * 更新订单状态
     * @param {string} orderId - 订单ID
     * @param {Object} updates - 更新的属性
     */
    updateOrder(orderId, updates) {
        const orders = this.getOrders();
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            Object.assign(orders[orderIndex], updates);
            orders[orderIndex].updateTime = new Date();
            return this.setData('orders', orders);
        }
        return false;
    }

    /**
     * 删除订单
     * @param {string} orderId - 订单ID
     */
    deleteOrder(orderId) {
        const orders = this.getOrders();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        return this.setData('orders', filteredOrders);
    }

    /**
     * 获取用户当前进行中的订单
     */
    getCurrentOrder() {
        return this.getData('currentOrder');
    }

    /**
     * 设置当前订单
     * @param {Object} order - 订单信息
     */
    setCurrentOrder(order) {
        return this.setData('currentOrder', order);
    }

    /**
     * 清除当前订单
     */
    clearCurrentOrder() {
        return this.removeData('currentOrder');
    }

    /**
     * 保存用户偏好设置
     * @param {Object} preferences - 偏好设置
     */
    savePreferences(preferences) {
        return this.setData('preferences', preferences);
    }

    /**
     * 获取用户偏好设置
     */
    getPreferences() {
        return this.getData('preferences') || {
            autoSelectBestSeats: false,
            preferredSeatType: 'normal',
            rememberLastSelection: true,
            enableNotifications: true
        };
    }

    /**
     * 导出数据（用于备份）
     */
    exportData() {
        const data = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                const shortKey = key.replace(this.prefix, '');
                data[shortKey] = this.getData(shortKey);
            }
        });

        return JSON.stringify(data, null, 2);
    }

    /**
     * 导入数据（用于恢复）
     * @param {string} jsonData - JSON格式的数据
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            Object.keys(data).forEach(key => {
                this.setData(key, data[key]);
            });

            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    /**
     * 获取存储统计信息
     */
    getStorageStats() {
        let totalSize = 0;
        let itemCount = 0;
        
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                totalSize += localStorage.getItem(key).length;
                itemCount++;
            }
        });

        return {
            itemCount,
            totalSize,
            formattedSize: (totalSize / 1024).toFixed(2) + ' KB'
        };
    }
}

// 创建全局存储管理器实例
const storage = new StorageManager();