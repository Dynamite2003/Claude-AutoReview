// 座位管理系统

class SeatManager {
    constructor() {
        this.selectedSeats = [];
        this.currentHall = null;
        this.currentLayout = null;
        this.maxSeatsPerOrder = 8; // 最多选择8个座位
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 座位点击事件委托
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('seat') && e.target.classList.contains('available')) {
                this.handleSeatClick(e.target);
            }
        });
    }

    /**
     * 初始化座位地图
     * @param {string} hallName - 影厅名称
     * @param {Object} movie - 电影信息
     * @param {Object} showtime - 场次信息
     */
    initializeSeatMap(hallName, movie, showtime) {
        this.currentHall = hallName;
        this.currentLayout = storage.getSeatLayout(hallName);
        this.selectedSeats = [];

        if (!this.currentLayout) {
            showToast('座位布局加载失败', 'error');
            return false;
        }

        this.renderSeatMap();
        this.updateSeatSummary();
        return true;
    }

    /**
     * 渲染座位地图
     */
    renderSeatMap() {
        const seatMapContainer = document.getElementById('seatMap');
        if (!seatMapContainer || !this.currentLayout) {
            return;
        }

        let html = '';
        
        this.currentLayout.forEach((row, rowIndex) => {
            html += '<div class="seat-row">';
            html += `<div class="row-label">${String.fromCharCode(65 + rowIndex)}</div>`;
            
            row.forEach((seat, colIndex) => {
                // 添加走道间隙
                if (colIndex === Math.floor(row.length / 2)) {
                    html += '<div class="seat-gap"></div>';
                }

                const seatClasses = this.getSeatClasses(seat);
                const seatContent = this.getSeatContent(seat);
                const seatTitle = this.getSeatTitle(seat, rowIndex, colIndex);

                html += `<div class="seat ${seatClasses}" 
                            data-row="${rowIndex}" 
                            data-col="${colIndex}"
                            title="${seatTitle}">
                            ${seatContent}
                         </div>`;
            });
            
            html += '</div>';
        });

        seatMapContainer.innerHTML = html;
    }

    /**
     * 获取座位CSS类
     * @param {Object} seat - 座位对象
     */
    getSeatClasses(seat) {
        let classes = [];

        if (seat.isSelected) {
            classes.push('selected');
        } else if (!seat.isAvailable) {
            classes.push('occupied');
        } else {
            classes.push('available');
        }

        // 添加座位类型类
        if (seat.type === 'vip') {
            classes.push('vip');
        } else if (seat.type === 'couple') {
            classes.push('couple');
        } else if (seat.type === 'maintenance') {
            classes.push('maintenance');
        }

        return classes.join(' ');
    }

    /**
     * 获取座位内容
     * @param {Object} seat - 座位对象
     */
    getSeatContent(seat) {
        if (seat.type === 'couple') {
            return ''; // 情侣座用CSS的::after显示爱心
        } else if (seat.type === 'maintenance') {
            return ''; // 维护座位用CSS的::after显示X
        }
        return seat.col + 1; // 显示座位号
    }

    /**
     * 获取座位提示文本
     * @param {Object} seat - 座位对象
     * @param {number} row - 行号
     * @param {number} col - 列号
     */
    getSeatTitle(seat, row, col) {
        const seatName = getSeatName(row, col);
        const price = formatPrice(seat.price);
        
        if (!seat.isAvailable) {
            if (seat.type === 'maintenance') {
                return `${seatName} - 维护中`;
            }
            return `${seatName} - 已售出`;
        }

        let typeText = '';
        switch (seat.type) {
            case 'vip':
                typeText = 'VIP座位';
                break;
            case 'couple':
                typeText = '情侣座';
                break;
            default:
                typeText = '普通座位';
        }

        return `${seatName} - ${typeText} - ${price}`;
    }

    /**
     * 处理座位点击
     * @param {HTMLElement} seatElement - 座位元素
     */
    handleSeatClick(seatElement) {
        const row = parseInt(seatElement.dataset.row);
        const col = parseInt(seatElement.dataset.col);
        const seat = this.currentLayout[row][col];

        if (!seat.isAvailable) {
            showToast('该座位不可选择', 'warning');
            return;
        }

        // 检查是否已选中
        const seatIndex = this.selectedSeats.findIndex(s => s.row === row && s.col === col);
        
        if (seatIndex >= 0) {
            // 取消选择
            this.deselectSeat(row, col, seatIndex);
        } else {
            // 选择座位
            this.selectSeat(row, col, seat);
        }

        this.updateSeatDisplay(seatElement, row, col);
        this.updateSeatSummary();
    }

    /**
     * 选择座位
     * @param {number} row - 行号
     * @param {number} col - 列号  
     * @param {Object} seat - 座位对象
     */
    selectSeat(row, col, seat) {
        // 检查选择数量限制
        if (this.selectedSeats.length >= this.maxSeatsPerOrder) {
            showToast(`最多只能选择${this.maxSeatsPerOrder}个座位`, 'warning');
            return false;
        }

        // 情侣座特殊处理：必须成对选择
        if (seat.type === 'couple') {
            const adjacentCol = col % 2 === 0 ? col + 1 : col - 1;
            const adjacentSeat = this.currentLayout[row][adjacentCol];
            
            if (!adjacentSeat.isAvailable) {
                showToast('情侣座必须成对选择，相邻座位不可用', 'warning');
                return false;
            }

            // 检查是否会超出选择限制
            if (this.selectedSeats.length + 2 > this.maxSeatsPerOrder) {
                showToast(`选择情侣座会超出座位数量限制（最多${this.maxSeatsPerOrder}个）`, 'warning');
                return false;
            }

            // 同时选择两个座位
            this.selectedSeats.push({
                row,
                col,
                type: seat.type,
                price: seat.price,
                name: getSeatName(row, col)
            });

            this.selectedSeats.push({
                row,
                col: adjacentCol,
                type: adjacentSeat.type,
                price: adjacentSeat.price,
                name: getSeatName(row, adjacentCol)
            });

            // 更新布局中的选择状态
            this.currentLayout[row][col].isSelected = true;
            this.currentLayout[row][adjacentCol].isSelected = true;

            // 更新相邻座位的显示
            const adjacentElement = document.querySelector(`[data-row="${row}"][data-col="${adjacentCol}"]`);
            if (adjacentElement) {
                this.updateSeatDisplay(adjacentElement, row, adjacentCol);
            }

            showToast('已选择情侣座', 'success');
        } else {
            // 普通座位选择
            this.selectedSeats.push({
                row,
                col,
                type: seat.type,
                price: seat.price,
                name: getSeatName(row, col)
            });

            this.currentLayout[row][col].isSelected = true;
        }

        return true;
    }

    /**
     * 取消选择座位
     * @param {number} row - 行号
     * @param {number} col - 列号
     * @param {number} seatIndex - 在selectedSeats中的索引
     */
    deselectSeat(row, col, seatIndex) {
        const seat = this.selectedSeats[seatIndex];
        
        // 情侣座特殊处理
        if (seat.type === 'couple') {
            // 找到相邻的座位并一起取消
            const adjacentCol = col % 2 === 0 ? col + 1 : col - 1;
            const adjacentIndex = this.selectedSeats.findIndex(s => s.row === row && s.col === adjacentCol);
            
            if (adjacentIndex >= 0) {
                this.selectedSeats.splice(Math.max(seatIndex, adjacentIndex), 1);
                this.selectedSeats.splice(Math.min(seatIndex, adjacentIndex), 1);
                
                this.currentLayout[row][adjacentCol].isSelected = false;
                
                // 更新相邻座位显示
                const adjacentElement = document.querySelector(`[data-row="${row}"][data-col="${adjacentCol}"]`);
                if (adjacentElement) {
                    this.updateSeatDisplay(adjacentElement, row, adjacentCol);
                }
            }
        } else {
            this.selectedSeats.splice(seatIndex, 1);
        }

        this.currentLayout[row][col].isSelected = false;
    }

    /**
     * 更新座位显示
     * @param {HTMLElement} seatElement - 座位元素
     * @param {number} row - 行号
     * @param {number} col - 列号
     */
    updateSeatDisplay(seatElement, row, col) {
        const seat = this.currentLayout[row][col];
        const newClasses = this.getSeatClasses(seat);
        seatElement.className = `seat ${newClasses}`;
    }

    /**
     * 更新座位选择摘要
     */
    updateSeatSummary() {
        this.updateSelectedSeatsList();
        this.updatePriceInfo();
        this.updateConfirmButton();
    }

    /**
     * 更新已选座位列表显示
     */
    updateSelectedSeatsList() {
        const seatsListContainer = document.getElementById('selectedSeatsList');
        if (!seatsListContainer) return;

        if (this.selectedSeats.length === 0) {
            seatsListContainer.innerHTML = '<span class="no-seats">请选择座位</span>';
            return;
        }

        let html = '';
        this.selectedSeats.forEach((seat, index) => {
            const seatTypeClass = seat.type === 'vip' ? 'vip' : 
                                 seat.type === 'couple' ? 'couple' : '';
            
            html += `<div class="seat-tag ${seatTypeClass}">
                        ${seat.name}
                        <button class="remove-seat" onclick="seatManager.removeSeat(${index})" title="移除座位">
                            ×
                        </button>
                     </div>`;
        });

        seatsListContainer.innerHTML = html;
    }

    /**
     * 移除指定座位
     * @param {number} index - 座位索引
     */
    removeSeat(index) {
        if (index < 0 || index >= this.selectedSeats.length) {
            return;
        }

        const seat = this.selectedSeats[index];
        const seatElement = document.querySelector(`[data-row="${seat.row}"][data-col="${seat.col}"]`);
        
        if (seatElement) {
            // 模拟点击来取消选择
            this.handleSeatClick(seatElement);
        }
    }

    /**
     * 更新价格信息
     */
    updatePriceInfo() {
        const totalPriceElement = document.getElementById('totalPrice');
        const finalPriceElement = document.getElementById('finalPrice');
        
        if (!totalPriceElement || !finalPriceElement) return;

        const totalPrice = this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
        const servicePrice = 5;
        const finalPrice = totalPrice + servicePrice;

        totalPriceElement.textContent = formatPrice(totalPrice);
        finalPriceElement.textContent = formatPrice(finalPrice);
    }

    /**
     * 更新确认按钮状态
     */
    updateConfirmButton() {
        const confirmButton = document.getElementById('confirmBooking');
        if (!confirmButton) return;

        if (this.selectedSeats.length > 0) {
            confirmButton.disabled = false;
            confirmButton.textContent = `确认订座 (${this.selectedSeats.length}个座位)`;
        } else {
            confirmButton.disabled = true;
            confirmButton.textContent = '确认订座';
        }
    }

    /**
     * 获取选中的座位
     */
    getSelectedSeats() {
        return [...this.selectedSeats];
    }

    /**
     * 获取总价格
     */
    getTotalPrice() {
        return this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    }

    /**
     * 清空选择
     */
    clearSelection() {
        this.selectedSeats.forEach(seat => {
            if (this.currentLayout && this.currentLayout[seat.row] && this.currentLayout[seat.row][seat.col]) {
                this.currentLayout[seat.row][seat.col].isSelected = false;
            }
        });

        this.selectedSeats = [];
        this.renderSeatMap();
        this.updateSeatSummary();
    }

    /**
     * 智能推荐座位
     * @param {number} count - 需要的座位数量
     */
    recommendSeats(count = 2) {
        if (!this.currentLayout || count <= 0 || count > this.maxSeatsPerOrder) {
            return [];
        }

        const availableSeats = [];
        
        // 收集所有可用座位
        this.currentLayout.forEach((row, rowIndex) => {
            row.forEach((seat, colIndex) => {
                if (seat.isAvailable && !seat.isSelected) {
                    availableSeats.push({
                        row: rowIndex,
                        col: colIndex,
                        seat: seat,
                        score: this.calculateSeatScore(rowIndex, colIndex, seat)
                    });
                }
            });
        });

        // 按评分排序
        availableSeats.sort((a, b) => b.score - a.score);

        // 寻找连续座位
        const recommendations = this.findContinuousSeats(availableSeats, count);
        
        return recommendations;
    }

    /**
     * 计算座位评分
     * @param {number} row - 行号
     * @param {number} col - 列号
     * @param {Object} seat - 座位对象
     */
    calculateSeatScore(row, col, seat) {
        let score = 100;
        
        // 行位置评分（中间行更好）
        const totalRows = this.currentLayout.length;
        const middleRow = Math.floor(totalRows / 2);
        const rowDistance = Math.abs(row - middleRow);
        score -= rowDistance * 5;

        // 列位置评分（中间列更好）
        const totalCols = this.currentLayout[row].length;
        const middleCol = Math.floor(totalCols / 2);
        const colDistance = Math.abs(col - middleCol);
        score -= colDistance * 3;

        // 座位类型加分
        if (seat.type === 'vip') {
            score += 20;
        } else if (seat.type === 'couple') {
            score += 15;
        }

        // 避免边缘座位
        if (col === 0 || col === totalCols - 1) {
            score -= 10;
        }

        // 前排和后排扣分
        if (row === 0) {
            score -= 15;
        } else if (row === totalRows - 1) {
            score -= 10;
        }

        return score;
    }

    /**
     * 寻找连续座位
     * @param {Array} availableSeats - 可用座位数组
     * @param {number} count - 需要的座位数量
     */
    findContinuousSeats(availableSeats, count) {
        const seatMap = new Map();
        
        // 按行分组
        availableSeats.forEach(seatInfo => {
            const rowKey = seatInfo.row;
            if (!seatMap.has(rowKey)) {
                seatMap.set(rowKey, []);
            }
            seatMap.get(rowKey).push(seatInfo);
        });

        let bestCombination = [];
        let bestScore = -1;

        // 在每一行中寻找连续座位
        for (let [rowIndex, rowSeats] of seatMap) {
            rowSeats.sort((a, b) => a.col - b.col);
            
            for (let i = 0; i <= rowSeats.length - count; i++) {
                const combination = [];
                let isContinuous = true;
                let totalScore = 0;

                for (let j = 0; j < count; j++) {
                    const currentSeat = rowSeats[i + j];
                    combination.push(currentSeat);
                    totalScore += currentSeat.score;

                    if (j > 0) {
                        const prevSeat = rowSeats[i + j - 1];
                        if (currentSeat.col - prevSeat.col > 1) {
                            isContinuous = false;
                            break;
                        }
                    }
                }

                if (isContinuous && totalScore > bestScore) {
                    bestScore = totalScore;
                    bestCombination = combination;
                }
            }
        }

        return bestCombination;
    }

    /**
     * 自动选择推荐座位
     * @param {number} count - 座位数量
     */
    autoSelectSeats(count = 2) {
        if (this.selectedSeats.length > 0) {
            showToast('请先清空当前选择', 'warning');
            return false;
        }

        const recommendations = this.recommendSeats(count);
        
        if (recommendations.length === 0) {
            showToast('没有找到合适的连续座位', 'warning');
            return false;
        }

        // 自动选择推荐座位
        recommendations.forEach(seatInfo => {
            const seatElement = document.querySelector(`[data-row="${seatInfo.row}"][data-col="${seatInfo.col}"]`);
            if (seatElement) {
                this.handleSeatClick(seatElement);
            }
        });

        showToast(`已为您推荐${recommendations.length}个座位`, 'success');
        return true;
    }

    /**
     * 重置座位选择
     */
    reset() {
        this.selectedSeats = [];
        this.currentHall = null;
        this.currentLayout = null;
    }

    /**
     * 获取座位统计信息
     */
    getSeatStatistics() {
        if (!this.currentLayout) {
            return null;
        }

        const stats = {
            total: 0,
            available: 0,
            occupied: 0,
            selected: 0,
            vip: 0,
            couple: 0,
            maintenance: 0
        };

        this.currentLayout.forEach(row => {
            row.forEach(seat => {
                stats.total++;
                
                if (seat.isSelected) {
                    stats.selected++;
                } else if (seat.isAvailable) {
                    stats.available++;
                } else {
                    stats.occupied++;
                }

                if (seat.type === 'vip') {
                    stats.vip++;
                } else if (seat.type === 'couple') {
                    stats.couple++;
                } else if (seat.type === 'maintenance') {
                    stats.maintenance++;
                }
            });
        });

        return stats;
    }
}

// 创建全局座位管理器实例
const seatManager = new SeatManager();