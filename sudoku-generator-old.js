class SudokuGenerator {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
    }

    generateComplete() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.fillBoard();
        this.solution = this.board.map(row => [...row]);
        return this.board;
    }

    fillBoard() {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    this.shuffle(numbers);
                    
                    for (let num of numbers) {
                        if (this.isValid(row, col, num)) {
                            this.board[row][col] = num;
                            
                            if (this.fillBoard()) {
                                return true;
                            }
                            
                            this.board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    isValid(row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) return false;
        }

        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) return false;
        }

        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[startRow + i][startCol + j] === num) return false;
            }
        }

        return true;
    }

    generatePuzzle(hintsCount) {
        this.generateComplete();
        
        const positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push([row, col]);
            }
        }
        this.shuffle(positions);

        let currentHints = 81;
        let attempts = 0;
        const maxAttempts = 1000;

        for (let i = 0; i < positions.length && currentHints > hintsCount && attempts < maxAttempts; i++) {
            const [row, col] = positions[i];
            const backup = this.board[row][col];
            this.board[row][col] = 0;
            
            if (this.hasUniqueSolution()) {
                currentHints--;
            } else {
                this.board[row][col] = backup;
            }
            attempts++;
        }

        return {
            puzzle: this.board.map(row => [...row]),
            solution: this.solution.map(row => [...row]),
            actualHints: currentHints
        };
    }

    hasUniqueSolution() {
        const testBoard = this.board.map(row => [...row]);
        let solutionCount = 0;
        
        const solve = (board) => {
            if (solutionCount > 1) return false;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValidForBoard(board, row, col, num)) {
                                board[row][col] = num;
                                
                                if (solve(board)) {
                                    solutionCount++;
                                    if (solutionCount > 1) {
                                        board[row][col] = 0;
                                        return false;
                                    }
                                }
                                
                                board[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        solve(testBoard);
        return solutionCount === 1;
    }

    isValidForBoard(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }

        return true;
    }

    checkSolution(userBoard) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userBoard[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }
}
