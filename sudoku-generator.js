class SudokuGenerator {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.minimalTemplates = this.getMinimalTemplates();
    }

    getMinimalTemplates() {
        return [
            [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,3,0,8,5],
                [0,0,1,0,2,0,0,0,0],
                [0,0,0,5,0,7,0,0,0],
                [0,0,4,0,0,0,1,0,0],
                [0,9,0,0,0,0,0,0,0],
                [5,0,0,0,0,0,0,7,3],
                [0,0,2,0,1,0,0,0,0],
                [0,0,0,0,4,0,0,0,9]
            ],
            [
                [0,0,0,0,0,0,0,1,0],
                [4,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,6,0,2],
                [0,0,0,0,3,0,0,0,0],
                [5,0,0,0,0,0,0,0,0],
                [0,0,0,0,7,0,0,0,0],
                [6,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,7],
                [0,3,0,0,0,0,0,0,0]
            ]
        ];
    }

    generateComplete() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.fillBoardOptimized();
        this.solution = this.board.map(row => [...row]);
        return this.board;
    }

    fillBoardOptimized() {
        const emptyCells = this.getEmptyCellsSorted();
        return this.fillBoardRecursive(emptyCells, 0);
    }

    getEmptyCellsSorted() {
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    const possibleValues = this.getPossibleValues(row, col);
                    emptyCells.push({ row, col, possibleCount: possibleValues.length, possibleValues });
                }
            }
        }
        return emptyCells.sort((a, b) => a.possibleCount - b.possibleCount);
    }

    getPossibleValues(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (this.isValid(row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }

    fillBoardRecursive(emptyCells, index) {
        if (index >= emptyCells.length) return true;

        const { row, col, possibleValues } = emptyCells[index];
        this.shuffle(possibleValues);

        for (let num of possibleValues) {
            if (this.isValid(row, col, num)) {
                this.board[row][col] = num;
                
                if (this.fillBoardRecursive(emptyCells, index + 1)) {
                    return true;
                }
                
                this.board[row][col] = 0;
            }
        }
        return false;
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
        let bestPuzzle = null;
        let bestHintCount = 81;
        const maxRetries = 30;

        for (let retry = 0; retry < maxRetries; retry++) {
            let result = null;

            if (hintsCount <= 21) {
                result = this.generateFromTemplate(hintsCount);
                if (result && result.actualHints <= hintsCount && this.isLogicallySolvable(result.puzzle)) {
                    return result;
                }
            }

            result = this.generateWithSymmetry(hintsCount);
            if (result && result.actualHints <= hintsCount && this.isLogicallySolvable(result.puzzle)) {
                return result;
            }

            result = this.generateWithConstraintPropagation(hintsCount);
            if (result && result.actualHints <= hintsCount && this.isLogicallySolvable(result.puzzle)) {
                return result;
            }

            if (result && result.actualHints < bestHintCount && this.isLogicallySolvable(result.puzzle)) {
                bestPuzzle = result;
                bestHintCount = result.actualHints;
            }
        }

        const basicResult = this.generateBasic(hintsCount);
        if (basicResult && this.isLogicallySolvable(basicResult.puzzle)) {
            return basicResult;
        }

        return bestPuzzle;
    }

    generateFromTemplate(hintsCount) {
        if (this.minimalTemplates.length === 0) return null;

        const template = this.minimalTemplates[Math.floor(Math.random() * this.minimalTemplates.length)];
        
        this.generateComplete();
        const transformedTemplate = this.transformTemplate(template);
        
        if (this.countHints(transformedTemplate) <= hintsCount) {
            return {
                puzzle: transformedTemplate,
                solution: this.solution.map(row => [...row]),
                actualHints: this.countHints(transformedTemplate)
            };
        }

        return null;
    }

    transformTemplate(template) {
        const result = Array(9).fill().map(() => Array(9).fill(0));
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (template[row][col] !== 0) {
                    result[row][col] = this.solution[row][col];
                }
            }
        }
        
        return result;
    }

    generateWithSymmetry(hintsCount) {
        this.generateComplete();
        
        const symmetryTypes = ['rotational', 'diagonal', 'horizontal', 'vertical'];
        const symmetryType = symmetryTypes[Math.floor(Math.random() * symmetryTypes.length)];
        
        return this.removeCluesWithSymmetry(hintsCount, symmetryType);
    }

    removeCluesWithSymmetry(hintsCount, symmetryType) {
        const puzzle = this.solution.map(row => [...row]);
        let currentHints = 81;
        
        const positions = this.getSymmetricPositions(symmetryType);
        this.shuffle(positions);

        for (let posGroup of positions) {
            if (currentHints <= hintsCount) break;
            
            const backups = posGroup.map(([row, col]) => puzzle[row][col]);
            
            posGroup.forEach(([row, col]) => {
                puzzle[row][col] = 0;
            });
            
            if (this.hasUniqueSolutionForBoard(puzzle)) {
                currentHints -= posGroup.length;
            } else {
                posGroup.forEach(([row, col], index) => {
                    puzzle[row][col] = backups[index];
                });
            }
        }

        return {
            puzzle: puzzle,
            solution: this.solution.map(row => [...row]),
            actualHints: currentHints
        };
    }

    getSymmetricPositions(symmetryType) {
        const positions = [];
        const used = Array(9).fill().map(() => Array(9).fill(false));

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (used[row][col]) continue;

                const group = [[row, col]];
                used[row][col] = true;

                let symRow, symCol;
                switch (symmetryType) {
                    case 'rotational':
                        symRow = 8 - row;
                        symCol = 8 - col;
                        break;
                    case 'diagonal':
                        symRow = col;
                        symCol = row;
                        break;
                    case 'horizontal':
                        symRow = row;
                        symCol = 8 - col;
                        break;
                    case 'vertical':
                        symRow = 8 - row;
                        symCol = col;
                        break;
                }

                if (symRow !== row || symCol !== col) {
                    if (!used[symRow][symCol]) {
                        group.push([symRow, symCol]);
                        used[symRow][symCol] = true;
                    }
                }

                positions.push(group);
            }
        }

        return positions;
    }

    generateWithConstraintPropagation(hintsCount) {
        this.generateComplete();
        
        const puzzle = this.solution.map(row => [...row]);
        const cellPriorities = this.calculateCellPriorities();
        
        let currentHints = 81;
        
        for (let { row, col } of cellPriorities) {
            if (currentHints <= hintsCount) break;
            
            const backup = puzzle[row][col];
            puzzle[row][col] = 0;
            
            if (this.hasUniqueSolutionWithConstraintPropagation(puzzle)) {
                currentHints--;
            } else {
                puzzle[row][col] = backup;
            }
        }

        return {
            puzzle: puzzle,
            solution: this.solution.map(row => [...row]),
            actualHints: currentHints
        };
    }

    calculateCellPriorities() {
        const priorities = [];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const priority = this.calculateCellPriority(row, col);
                priorities.push({ row, col, priority });
            }
        }
        
        return priorities.sort((a, b) => b.priority - a.priority);
    }

    calculateCellPriority(row, col) {
        let priority = 0;
        
        const centerDistance = Math.abs(row - 4) + Math.abs(col - 4);
        priority += (8 - centerDistance) * 2;
        
        const blockCenterRow = Math.floor(row / 3) * 3 + 1;
        const blockCenterCol = Math.floor(col / 3) * 3 + 1;
        const blockCenterDistance = Math.abs(row - blockCenterRow) + Math.abs(col - blockCenterCol);
        priority += (2 - blockCenterDistance);
        
        return priority;
    }

    hasUniqueSolutionWithConstraintPropagation(puzzle) {
        const testBoard = puzzle.map(row => [...row]);
        return this.solveWithConstraintPropagation(testBoard) === 1;
    }

    solveWithConstraintPropagation(board) {
        let solutionCount = 0;
        const maxSolutions = 2;
        
        const solve = (currentBoard) => {
            if (solutionCount >= maxSolutions) return;
            
            if (!this.propagateConstraints(currentBoard)) return;
            
            if (this.isComplete(currentBoard)) {
                solutionCount++;
                return;
            }
            
            const { row, col } = this.selectMostConstrainedCell(currentBoard);
            if (row === -1) return;
            
            const possibleValues = this.getPossibleValuesForBoard(currentBoard, row, col);
            
            for (let num of possibleValues) {
                const newBoard = currentBoard.map(r => [...r]);
                newBoard[row][col] = num;
                solve(newBoard);
            }
        };
        
        solve(board);
        return solutionCount;
    }

    propagateConstraints(board) {
        let changed = true;
        
        while (changed) {
            changed = false;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const possible = this.getPossibleValuesForBoard(board, row, col);
                        
                        if (possible.length === 0) return false;
                        
                        if (possible.length === 1) {
                            board[row][col] = possible[0];
                            changed = true;
                        }
                    }
                }
            }
        }
        
        return true;
    }

    selectMostConstrainedCell(board) {
        let minPossible = 10;
        let bestRow = -1, bestCol = -1;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const possibleCount = this.getPossibleValuesForBoard(board, row, col).length;
                    if (possibleCount < minPossible) {
                        minPossible = possibleCount;
                        bestRow = row;
                        bestCol = col;
                    }
                }
            }
        }
        
        return { row: bestRow, col: bestCol };
    }

    isComplete(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) return false;
            }
        }
        return true;
    }

    getPossibleValuesForBoard(board, row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            if (this.isValidForBoard(board, row, col, num)) {
                possible.push(num);
            }
        }
        return possible;
    }

    generateBasic(hintsCount) {
        this.generateComplete();
        
        const positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push([row, col]);
            }
        }
        this.shuffle(positions);

        let currentHints = 81;
        const maxAttempts = 2000;
        let attempts = 0;

        for (let i = 0; i < positions.length && currentHints > hintsCount && attempts < maxAttempts; i++) {
            const [row, col] = positions[i];
            const backup = this.board[row][col];
            this.board[row][col] = 0;
            
            if (this.hasUniqueSolutionForBoard(this.board)) {
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

    countHints(board) {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) count++;
            }
        }
        return count;
    }

    hasUniqueSolutionForBoard(board) {
        const testBoard = board.map(row => [...row]);
        let solutionCount = 0;
        
        const solve = (currentBoard) => {
            if (solutionCount > 1) return false;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (currentBoard[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValidForBoard(currentBoard, row, col, num)) {
                                currentBoard[row][col] = num;
                                
                                if (solve(currentBoard)) {
                                    solutionCount++;
                                    if (solutionCount > 1) {
                                        currentBoard[row][col] = 0;
                                        return false;
                                    }
                                }
                                
                                currentBoard[row][col] = 0;
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

    isLogicallySolvable(puzzle) {
        const testBoard = puzzle.map(row => [...row]);
        return this.solveWithLogicalTechniques(testBoard);
    }

    solveWithLogicalTechniques(board) {
        let progress = true;
        let iterations = 0;
        const maxIterations = 100;

        while (progress && iterations < maxIterations) {
            progress = false;
            iterations++;

            if (this.applyNakedSingles(board)) progress = true;
            if (this.applyHiddenSingles(board)) progress = true;
            if (this.applyPointingPairs(board)) progress = true;
            if (this.applyBoxLineReduction(board)) progress = true;
            if (this.applyNakedPairs(board)) progress = true;
            if (this.applyHiddenPairs(board)) progress = true;

            if (this.isComplete(board)) {
                return this.isValidSolution(board);
            }
        }

        return false;
    }

    applyNakedSingles(board) {
        let progress = false;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const possible = this.getPossibleValuesForBoard(board, row, col);
                    if (possible.length === 1) {
                        board[row][col] = possible[0];
                        progress = true;
                    }
                }
            }
        }
        return progress;
    }

    applyHiddenSingles(board) {
        let progress = false;

        for (let row = 0; row < 9; row++) {
            for (let num = 1; num <= 9; num++) {
                const possibleCols = [];
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0 && this.isValidForBoard(board, row, col, num)) {
                        possibleCols.push(col);
                    }
                }
                if (possibleCols.length === 1) {
                    board[row][possibleCols[0]] = num;
                    progress = true;
                }
            }
        }

        for (let col = 0; col < 9; col++) {
            for (let num = 1; num <= 9; num++) {
                const possibleRows = [];
                for (let row = 0; row < 9; row++) {
                    if (board[row][col] === 0 && this.isValidForBoard(board, row, col, num)) {
                        possibleRows.push(row);
                    }
                }
                if (possibleRows.length === 1) {
                    board[possibleRows[0]][col] = num;
                    progress = true;
                }
            }
        }

        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                for (let num = 1; num <= 9; num++) {
                    const possibleCells = [];
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            const row = boxRow * 3 + r;
                            const col = boxCol * 3 + c;
                            if (board[row][col] === 0 && this.isValidForBoard(board, row, col, num)) {
                                possibleCells.push([row, col]);
                            }
                        }
                    }
                    if (possibleCells.length === 1) {
                        const [row, col] = possibleCells[0];
                        board[row][col] = num;
                        progress = true;
                    }
                }
            }
        }

        return progress;
    }

    applyPointingPairs(board) {
        let progress = false;

        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                for (let num = 1; num <= 9; num++) {
                    const possibleCells = [];
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            const row = boxRow * 3 + r;
                            const col = boxCol * 3 + c;
                            if (board[row][col] === 0 && this.isValidForBoard(board, row, col, num)) {
                                possibleCells.push([row, col]);
                            }
                        }
                    }

                    if (possibleCells.length >= 2 && possibleCells.length <= 3) {
                        const sameRow = possibleCells.every(([r, c]) => r === possibleCells[0][0]);
                        const sameCol = possibleCells.every(([r, c]) => c === possibleCells[0][1]);

                        if (sameRow) {
                            const row = possibleCells[0][0];
                            for (let col = 0; col < 9; col++) {
                                const inBox = Math.floor(col / 3) === boxCol;
                                if (!inBox && board[row][col] === 0) {
                                    const possible = this.getPossibleValuesForBoard(board, row, col);
                                    if (possible.includes(num)) {
                                        progress = true;
                                    }
                                }
                            }
                        }

                        if (sameCol) {
                            const col = possibleCells[0][1];
                            for (let row = 0; row < 9; row++) {
                                const inBox = Math.floor(row / 3) === boxRow;
                                if (!inBox && board[row][col] === 0) {
                                    const possible = this.getPossibleValuesForBoard(board, row, col);
                                    if (possible.includes(num)) {
                                        progress = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return progress;
    }

    applyBoxLineReduction(board) {
        let progress = false;

        for (let row = 0; row < 9; row++) {
            for (let num = 1; num <= 9; num++) {
                const possibleCols = [];
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0 && this.isValidForBoard(board, row, col, num)) {
                        possibleCols.push(col);
                    }
                }

                if (possibleCols.length >= 2 && possibleCols.length <= 3) {
                    const boxCol = Math.floor(possibleCols[0] / 3);
                    if (possibleCols.every(col => Math.floor(col / 3) === boxCol)) {
                        const boxRow = Math.floor(row / 3);
                        for (let r = 0; r < 3; r++) {
                            for (let c = 0; c < 3; c++) {
                                const checkRow = boxRow * 3 + r;
                                const checkCol = boxCol * 3 + c;
                                if (checkRow !== row && board[checkRow][checkCol] === 0) {
                                    const possible = this.getPossibleValuesForBoard(board, checkRow, checkCol);
                                    if (possible.includes(num)) {
                                        progress = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return progress;
    }

    applyNakedPairs(board) {
        let progress = false;

        for (let row = 0; row < 9; row++) {
            const candidates = [];
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const possible = this.getPossibleValuesForBoard(board, row, col);
                    if (possible.length === 2) {
                        candidates.push({ row, col, possible });
                    }
                }
            }

            for (let i = 0; i < candidates.length; i++) {
                for (let j = i + 1; j < candidates.length; j++) {
                    const c1 = candidates[i];
                    const c2 = candidates[j];
                    if (c1.possible.length === 2 && c2.possible.length === 2 &&
                        c1.possible[0] === c2.possible[0] && c1.possible[1] === c2.possible[1]) {
                        progress = true;
                    }
                }
            }
        }

        return progress;
    }

    applyHiddenPairs(board) {
        return false;
    }

    isValidSolution(board) {
        for (let row = 0; row < 9; row++) {
            const rowSet = new Set();
            for (let col = 0; col < 9; col++) {
                if (board[row][col] < 1 || board[row][col] > 9 || rowSet.has(board[row][col])) {
                    return false;
                }
                rowSet.add(board[row][col]);
            }
        }

        for (let col = 0; col < 9; col++) {
            const colSet = new Set();
            for (let row = 0; row < 9; row++) {
                if (colSet.has(board[row][col])) {
                    return false;
                }
                colSet.add(board[row][col]);
            }
        }

        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const boxSet = new Set();
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const val = board[boxRow * 3 + r][boxCol * 3 + c];
                        if (boxSet.has(val)) {
                            return false;
                        }
                        boxSet.add(val);
                    }
                }
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
