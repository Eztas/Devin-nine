class NumberplaceApp {
    constructor() {
        this.currentScreen = 'home';
        this.sudokuGenerator = new SudokuGenerator();
        this.gameBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.userBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.memoBoard = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.selectedCell = null;
        this.selectedNumber = null;
        this.inputMode = 'number'; // 'number' or 'memo'
        
        this.initializeEventListeners();
        this.showScreen('home');
    }

    initializeEventListeners() {
        const difficultySlider = document.getElementById('difficulty-slider');
        const difficultyValue = document.getElementById('difficulty-value');
        const startGameBtn = document.getElementById('start-game-btn');

        difficultySlider.addEventListener('input', (e) => {
            difficultyValue.textContent = e.target.value;
        });

        startGameBtn.addEventListener('click', () => {
            this.startGame(parseInt(difficultySlider.value));
        });

        const numberInputBtn = document.getElementById('number-input-btn');
        const memoInputBtn = document.getElementById('memo-input-btn');
        const deleteBtn = document.getElementById('delete-btn');
        const completeBtn = document.getElementById('complete-btn');

        numberInputBtn.addEventListener('click', () => {
            this.inputNumber();
        });

        memoInputBtn.addEventListener('click', () => {
            this.inputMemo();
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteCell();
        });

        completeBtn.addEventListener('click', () => {
            this.checkCompletion();
        });

        const playAgainBtn = document.getElementById('play-again-btn');
        playAgainBtn.addEventListener('click', () => {
            this.showScreen('home');
        });
    }

    showScreen(screenName) {
        const screens = ['home-screen', 'game-screen', 'result-screen'];
        screens.forEach(screen => {
            document.getElementById(screen).classList.add('hidden');
        });
        document.getElementById(`${screenName}-screen`).classList.remove('hidden');
        this.currentScreen = screenName;
    }

    async startGame(hintsCount) {
        const startBtn = document.getElementById('start-game-btn');
        startBtn.disabled = true;
        startBtn.textContent = '問題生成中...';
        startBtn.classList.add('opacity-50');

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const puzzleData = this.sudokuGenerator.generatePuzzle(hintsCount);
            this.gameBoard = puzzleData.puzzle;
            this.initialBoard = puzzleData.puzzle.map(row => [...row]);
            this.userBoard = puzzleData.puzzle.map(row => [...row]);
            this.memoBoard = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
            
            document.getElementById('hint-count').textContent = puzzleData.actualHints;
            
            this.createGameBoard();
            this.createNumberPanel();
            this.showScreen('game');
        } catch (error) {
            console.error('問題生成エラー:', error);
            alert('問題の生成に失敗しました。もう一度お試しください。');
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = 'ゲーム開始';
            startBtn.classList.remove('opacity-50');
        }
    }

    createGameBoard() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.initialBoard[row][col] !== 0) {
                    cell.textContent = this.initialBoard[row][col];
                    cell.classList.add('initial');
                }

                const memoGrid = document.createElement('div');
                memoGrid.className = 'memo-grid';
                for (let i = 0; i < 9; i++) {
                    const memoCell = document.createElement('div');
                    memoCell.className = 'memo-cell';
                    memoCell.dataset.memo = i + 1;
                    memoGrid.appendChild(memoCell);
                }
                cell.appendChild(memoGrid);

                cell.addEventListener('click', () => {
                    this.selectCell(row, col);
                });

                boardElement.appendChild(cell);
            }
        }
    }

    createNumberPanel() {
        const panelElement = document.getElementById('number-panel');
        panelElement.innerHTML = '';

        for (let num = 1; num <= 9; num++) {
            const button = document.createElement('button');
            button.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded text-xl transition duration-200';
            button.textContent = num;
            button.addEventListener('click', () => {
                this.selectNumber(num);
            });
            panelElement.appendChild(button);
        }
    }

    selectCell(row, col) {
        if (this.initialBoard[row][col] !== 0) return;

        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        this.selectedCell = { row, col };
    }

    selectNumber(num) {
        this.selectedNumber = num;
        this.updateNumberHighlight(num);
        this.updateNumberPanelHighlight(num);
    }

    updateNumberPanelHighlight(num) {
        document.querySelectorAll('#number-panel button').forEach(button => {
            button.classList.remove('bg-blue-700', 'ring-2', 'ring-blue-300');
            button.classList.add('bg-blue-500', 'hover:bg-blue-600');
        });

        const selectedButton = document.querySelector(`#number-panel button:nth-child(${num})`);
        if (selectedButton) {
            selectedButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            selectedButton.classList.add('bg-blue-700', 'ring-2', 'ring-blue-300');
        }
    }

    updateNumberHighlight(num) {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('highlighted');
        });
        document.querySelectorAll('.memo-cell').forEach(memoCell => {
            memoCell.classList.remove('highlighted');
        });

        if (num === null) return;

        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.userBoard[row][col] === num || this.initialBoard[row][col] === num) {
                cell.classList.add('highlighted');
            }

            const memoCell = cell.querySelector(`[data-memo="${num}"]`);
            if (memoCell && this.memoBoard[row][col].has(num)) {
                memoCell.classList.add('highlighted');
            }
        });
    }

    inputNumber() {
        if (this.selectedCell === null || this.selectedNumber === null) return;

        const { row, col } = this.selectedCell;
        const num = this.selectedNumber;
        
        this.userBoard[row][col] = num;
        this.memoBoard[row][col].clear();
        this.updateCellDisplay(row, col);
        this.updateNumberHighlight(num);
    }

    inputMemo() {
        if (this.selectedCell === null || this.selectedNumber === null) return;

        const { row, col } = this.selectedCell;
        const num = this.selectedNumber;
        
        if (this.userBoard[row][col] === 0) {
            if (this.memoBoard[row][col].has(num)) {
                this.memoBoard[row][col].delete(num);
            } else {
                this.memoBoard[row][col].add(num);
            }
            this.updateCellDisplay(row, col);
            this.updateNumberHighlight(num);
        }
    }

    updateCellDisplay(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const memoGrid = cell.querySelector('.memo-grid');
        
        if (this.userBoard[row][col] !== 0) {
            cell.innerHTML = `<span style="font-size: 1.5rem; font-weight: bold; position: relative; z-index: 1;">${this.userBoard[row][col]}</span>`;
            cell.appendChild(memoGrid);
            memoGrid.style.display = 'none';
        } else {
            cell.innerHTML = '';
            cell.appendChild(memoGrid);
            
            const memos = this.memoBoard[row][col];
            if (memos && memos.size > 0) {
                memoGrid.style.display = 'grid';
                
                for (let i = 0; i < 9; i++) {
                    const memoCell = memoGrid.children[i];
                    const number = i + 1;
                    if (memos.has(number)) {
                        memoCell.textContent = number;
                        memoCell.style.visibility = 'visible';
                    } else {
                        memoCell.textContent = '';
                        memoCell.style.visibility = 'hidden';
                    }
                }
            } else {
                memoGrid.style.display = 'none';
            }
        }
    }


    deleteCell() {
        if (this.selectedCell === null) return;

        const { row, col } = this.selectedCell;
        
        if (this.initialBoard[row][col] !== 0) return;

        this.userBoard[row][col] = 0;
        this.memoBoard[row][col].clear();
        this.updateCellDisplay(row, col);

        if (this.selectedNumber !== null) {
            this.updateNumberHighlight(this.selectedNumber);
        }
    }

    checkCompletion() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userBoard[row][col] === 0) {
                    alert('まだ空いているマスがあります。');
                    return;
                }
            }
        }

        const isCorrect = this.sudokuGenerator.checkSolution(this.userBoard);
        this.showResult(isCorrect);
    }

    showResult(isCorrect) {
        const resultMessage = document.getElementById('result-message');
        
        if (isCorrect) {
            resultMessage.textContent = 'クリア！';
            resultMessage.className = 'text-3xl font-bold mb-4 text-green-600';
        } else {
            resultMessage.textContent = '不正解...';
            resultMessage.className = 'text-3xl font-bold mb-4 text-red-600';
        }

        this.showScreen('result');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NumberplaceApp();
});
