class MinesweeperGame {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.gameBoard = [];
        this.gameState = 'playing'; // playing, won, lost
        this.revealedCells = 0;
        this.flaggedCells = 0;
        this.startTime = null;
        this.timer = null;
        
        this.initializeGame();
        this.bindEvents();
    }
    
    initializeGame() {
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        this.gameState = 'playing';
        this.revealedCells = 0;
        this.flaggedCells = 0;
        this.startTime = null;
        
        this.createBoard();
        this.placeMines();
        this.calculateNumbers();
        this.renderBoard();
        this.updateDisplay();
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        document.getElementById('timer-display').textContent = '000';
        document.getElementById('face-icon').textContent = '😊';
    }
    
    createBoard() {
        this.gameBoard = [];
        for (let row = 0; row < this.rows; row++) {
            this.gameBoard[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.gameBoard[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }
    
    placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.gameBoard[row][col].isMine) {
                this.gameBoard[row][col].isMine = true;
                minesPlaced++;
            }
        }
    }
    
    calculateNumbers() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.gameBoard[row][col].isMine) {
                    let count = 0;
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            const newRow = row + i;
                            const newCol = col + j;
                            if (this.isValidCell(newRow, newCol) && 
                                this.gameBoard[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    this.gameBoard[row][col].neighborMines = count;
                }
            }
        }
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    renderBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleLeftClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    handleLeftClick(event, row, col) {
        event.preventDefault();
        if (this.gameState !== 'playing') return;
        
        const cell = this.gameBoard[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        if (!this.startTime) {
            this.startTime = Date.now();
            this.startTimer();
        }
        
        this.revealCell(row, col);
        this.updateDisplay();
        this.checkGameState();
    }
    
    handleRightClick(event, row, col) {
        event.preventDefault();
        if (this.gameState !== 'playing') return;
        
        const cell = this.gameBoard[row][col];
        if (cell.isRevealed) return;
        
        cell.isFlagged = !cell.isFlagged;
        this.flaggedCells += cell.isFlagged ? 1 : -1;
        
        this.updateCellDisplay(row, col);
        this.updateDisplay();
    }
    
    revealCell(row, col) {
        const cell = this.gameBoard[row][col];
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        this.revealedCells++;
        
        if (cell.isMine) {
            this.gameState = 'lost';
            this.revealAllMines();
            document.getElementById('face-icon').textContent = '😵';
            return;
        }
        
        this.updateCellDisplay(row, col);
        
        // 如果是空白格子，自动揭开周围的格子
        if (cell.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (this.isValidCell(newRow, newCol)) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    
    updateCellDisplay(row, col) {
        const cell = this.gameBoard[row][col];
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        cellElement.className = 'cell';
        
        if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            cellElement.textContent = '🚩';
        } else if (cell.isRevealed) {
            cellElement.classList.add('revealed');
            if (cell.isMine) {
                cellElement.classList.add('mine');
                cellElement.textContent = '💣';
            } else if (cell.neighborMines > 0) {
                cellElement.classList.add(`num-${cell.neighborMines}`);
                cellElement.textContent = cell.neighborMines;
            } else {
                cellElement.textContent = '';
            }
        } else {
            cellElement.textContent = '';
        }
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.gameBoard[row][col];
                if (cell.isMine && !cell.isFlagged) {
                    cell.isRevealed = true;
                    this.updateCellDisplay(row, col);
                }
            }
        }
    }
    
    checkGameState() {
        const totalCells = this.rows * this.cols;
        const cellsToReveal = totalCells - this.totalMines;
        
        if (this.revealedCells === cellsToReveal && this.gameState === 'playing') {
            this.gameState = 'won';
            document.getElementById('face-icon').textContent = '😎';
            
            // 自动标记所有剩余的地雷
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    const cell = this.gameBoard[row][col];
                    if (cell.isMine && !cell.isFlagged) {
                        cell.isFlagged = true;
                        this.flaggedCells++;
                        this.updateCellDisplay(row, col);
                    }
                }
            }
            this.updateDisplay();
            
            // 【修复：仅在胜利时显示弹窗】
            // 停止计时器
            if (this.timer) {
                clearInterval(this.timer);
            }
            // 获取弹窗元素并显示
            const modal = document.getElementById('success-modal');
            modal.classList.add('show');

            // 关闭弹窗事件（点击按钮）
            document.getElementById('close-modal').addEventListener('click', () => {
                modal.classList.remove('show');
            });

            // 关闭弹窗事件（点击弹窗外部）
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
        // 移除原本在这里的弹窗显示代码
    }
    
    updateDisplay() {
        const remainingMines = this.totalMines - this.flaggedCells;
        document.getElementById('mine-count').textContent = remainingMines.toString().padStart(3, '0');
        
        const totalCells = this.rows * this.cols - this.totalMines;
        const progress = Math.round((this.revealedCells / totalCells) * 100);
        document.getElementById('progress').textContent = `${progress}%`;
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const displayTime = Math.min(elapsed, 999);
            document.getElementById('timer-display').textContent = displayTime.toString().padStart(3, '0');
        }, 1000);
    }
    
    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        
        // 更新难度按钮状态
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(difficulty).classList.add('active');
        
        this.initializeGame();
    }
    
    bindEvents() {
        // 难度选择
        document.getElementById('easy').addEventListener('click', () => this.changeDifficulty('easy'));
        document.getElementById('medium').addEventListener('click', () => this.changeDifficulty('medium'));
        document.getElementById('hard').addEventListener('click', () => this.changeDifficulty('hard'));
        
        // 新游戏按钮
        document.getElementById('new-game').addEventListener('click', () => this.initializeGame());
        
        // 笑脸按钮
        document.getElementById('face-icon').addEventListener('click', () => this.initializeGame());
        
        // 阻止右键菜单
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
            }
        });
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});