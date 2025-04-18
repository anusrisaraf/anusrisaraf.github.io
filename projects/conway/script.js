// let cols, rows;
//         let cellSize = 10;
//         let grid;
//         let isPaused = false;
//         let isMouseDragging = false; // Track if mouse is being dragged
//         let lastCellToggled = null; // Track the last cell toggled to prevent immediate overwrite
//         let startX, startY; // Track the starting position of a drag

//         function setup() {
//             createCanvas(600, 400);
//             cols = floor(width / cellSize);
//             rows = floor(height / cellSize);
//             grid = make2DArray(cols, rows);
//             for (let i = 0; i < cols; i++) {
//                 for (let j = 0; j < rows; j++) {
//                     grid[i][j] = floor(random(2));
//                 }
//             }
//         }

//         function draw() {
//             background(220);
//             for (let i = 0; i < cols; i++) {
//                 for (let j = 0; j < rows; j++) {
//                     fill(grid[i][j] === 1 ? 0 : 255);
//                     stroke(200);
//                     rect(i * cellSize, j * cellSize, cellSize, cellSize);
//                 }
//             }
            
//             // Handle drawing while mouse is dragged
//             if (isMouseDragging) {
//                 let x = floor(mouseX / cellSize);
//                 let y = floor(mouseY / cellSize);
                
//                 // Only draw if we've moved to a new cell
//                 if (x >= 0 && x < cols && y >= 0 && y < rows) {
//                     // Don't overwrite the initial clicked cell
//                     if (!(x === startX && y === startY)) {
//                         grid[x][y] = 1; // Set cell to alive
//                     }
//                 }
//             }
            
//             if (!isPaused) {
//                 let next = make2DArray(cols, rows);
//                 for (let i = 0; i < cols; i++) {
//                     for (let j = 0; j < rows; j++) {
//                         let state = grid[i][j];
//                         let neighbors = countNeighbors(grid, i, j);
//                         if (state === 0 && neighbors === 3) {
//                             next[i][j] = 1;
//                         } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
//                             next[i][j] = 0;
//                         } else {
//                             next[i][j] = state;
//                         }
//                     }
//                 }
//                 grid = next;
//             }
//         }

//         function make2DArray(cols, rows) {
//             let arr = new Array(cols);
//             for (let i = 0; i < cols; i++) {
//                 arr[i] = new Array(rows);
//             }
//             return arr;
//         }

//         function countNeighbors(grid, x, y) {
//             let sum = 0;
//             for (let i = -1; i <= 1; i++) {
//                 for (let j = -1; j <= 1; j++) {
//                     let col = (x + i + cols) % cols;
//                     let row = (y + j + rows) % rows;
//                     sum += grid[col][row];
//                 }
//             }
//             sum -= grid[x][y];
//             return sum;
//         }

//         function mousePressed() {
//             let x = floor(mouseX / cellSize);
//             let y = floor(mouseY / cellSize);
            
//             if (x >= 0 && x < cols && y >= 0 && y < rows) {
//                 // Toggle cell state
//                 grid[x][y] = grid[x][y] === 1 ? 0 : 1;
                
//                 // Remember where the drag started
//                 startX = x;
//                 startY = y;
//                 isMouseDragging = false; // Start with dragging off
//             }
            
//             return false; // Prevent default
//         }

//         function mouseDragged() {
//             // Only mark as dragging after mouse has moved a bit
//             let x = floor(mouseX / cellSize);
//             let y = floor(mouseY / cellSize);
            
//             // If the mouse has moved to a different cell, we're officially dragging
//             if (x !== startX || y !== startY) {
//                 isMouseDragging = true;
                
//                 if (x >= 0 && x < cols && y >= 0 && y < rows) {
//                     grid[x][y] = 1; // Set cell to alive
//                 }
//             }
            
//             return false; // Prevent default
//         }

//         function mouseReleased() {
//             isMouseDragging = false; // Stop dragging
//             return false;
//         }

//         function keyPressed() {
//             if (key === ' ') {
//                 isPaused = !isPaused;
//             }
//         }

let cols, rows;
        let cellSize = 10;
        let grid;
        let isPaused = false;
        let isMouseDragging = false; 
        let canvas;
        
        document.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.code === 'Space') {
                if (document.activeElement.tagName !== 'BUTTON' && 
                    document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                }
            }
            
            if (e.key === 'Shift') {
                shiftKeyPressed = true;
            }
        }, false);

        document.addEventListener('keyup', function(e) {
            if (e.key === 'Shift') {
                shiftKeyPressed = false;
            }
        }, false);

        function setup() {
            canvas = createCanvas(1000, 600);
            updateGridSize(parseInt(document.getElementById('densitySlider').value, 10));
    
    document.getElementById('densitySlider').addEventListener('input', function() {
        updateGridSize(parseInt(this.value, 10));
    });
            // cols = floor(width / cellSize);
            // rows = floor(height / cellSize);
            // grid = make2DArray(cols, rows);
            // randomizeGrid();
            
            document.getElementById('resetBtn').addEventListener('click', function() {
                randomizeGrid();
                this.blur();
            });
            
            document.getElementById('clearBtn').addEventListener('click', function() {
                clearGrid();
                this.blur();
            });
            
            document.getElementById('imageUpload').addEventListener('change', function(event) {
                // Update file name display
                const fileNameSpan = document.getElementById('fileName');
                if (this.files && this.files.length > 0) {
                    fileNameSpan.textContent = this.files[0].name;
                } else {
                    fileNameSpan.textContent = 'No file chosen';
                }
                handleImageUpload(event);
                this.blur();
            });

            // Custom upload button triggers hidden file input
            const customUploadBtn = document.getElementById('customUploadBtn');
            if (customUploadBtn) {
                customUploadBtn.addEventListener('click', function() {
                    document.getElementById('imageUpload').click();
                });
            }
        }

        function updateGridSize(newCellSize) {
            let oldGrid = grid;
            let oldCols = cols;
            let oldRows = rows;
            
            cellSize = newCellSize;
            cols = floor(width / cellSize);
            rows = floor(height / cellSize);
            
            grid = make2DArray(cols, rows);
            
            if (oldGrid) {
                clearGrid();
                
                for (let i = 0; i < oldCols; i++) {
                    for (let j = 0; j < oldRows; j++) {
                        let oldPropX = i / oldCols;
                        let oldPropY = j / oldRows;
                        
                        let newI = floor(oldPropX * cols);
                        let newJ = floor(oldPropY * rows);
                        
                        if (newI < cols && newJ < rows) {
                            grid[newI][newJ] = oldGrid[i][j];
                        }
                    }
                }
            } else {
                randomizeGrid();
            }
        }
        
        function randomizeGrid() {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    grid[i][j] = floor(random(2));
                }
            }
        }
        
        function clearGrid() {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    grid[i][j] = 0;
                }
            }
        }
        
        function handleImageUpload(event) {
            isPaused = true;
            
            const file = event.target.files[0];
            if (!file || !file.type.match('image.*')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('imagePreview');
                img.src = e.target.result;
                img.style.display = 'block';
                
                img.onload = function() {
                    processImageToGrid(img);
                };
            };
            reader.readAsDataURL(file);
        }
        
        function processImageToGrid(img) {
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            tempCanvas.width = cols;
            tempCanvas.height = rows;
            
            ctx.drawImage(img, 0, 0, cols, rows);
            
            const imageData = ctx.getImageData(0, 0, cols, rows).data;
            
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    const pos = (j * cols + i) * 4;
                    
                    const gray = (imageData[pos] + imageData[pos + 1] + imageData[pos + 2]) / 3;
                    
                    grid[i][j] = gray < 128 ? 1 : 0;
                }
            }
        }

        function draw() {
            background(230, 208, 184);
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    // fill(grid[i][j] === 1 ? 0 : 255);
                    // stroke(200);
                    fill(grid[i][j] === 1 ? '#5d4037' : '#e6d0b8');
                    stroke('#8d6e63');
                    rect(i * cellSize, j * cellSize, cellSize, cellSize);
                }
            }
            
            if (isMouseDragging) {
                let x = floor(mouseX / cellSize);
                let y = floor(mouseY / cellSize);
                if (x >= 0 && x < cols && y >= 0 && y < rows) {
                    grid[x][y] = 1;
                }
            }
            
            if (!isPaused) {
                let next = make2DArray(cols, rows);
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        let state = grid[i][j];
                        let neighbors = countNeighbors(grid, i, j);
                        if (state === 0 && neighbors === 3) {
                            next[i][j] = 1;
                        } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                            next[i][j] = 0;
                        } else {
                            next[i][j] = state;
                        }
                    }
                }
                grid = next;
            }
        }

        function make2DArray(cols, rows) {
            let arr = new Array(cols);
            for (let i = 0; i < cols; i++) {
                arr[i] = new Array(rows);
            }
            return arr;
        }

        function countNeighbors(grid, x, y) {
            let sum = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let col = (x + i + cols) % cols;
                    let row = (y + j + rows) % rows;
                    sum += grid[col][row];
                }
            }
            sum -= grid[x][y];
            return sum;
        }

        function mousePressed() {
            isMouseDragging = true;
            let x = floor(mouseX / cellSize);
            let y = floor(mouseY / cellSize);
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
                grid[x][y] = 1;
            }
        }

        function mouseDragged() {
            let x = floor(mouseX / cellSize);
            let y = floor(mouseY / cellSize);
            if (x >= 0 && x < cols && y >= 0 && y < rows) {

                grid[x][y] = 1;
            }
            return false;
        }

        function mouseReleased() {
            isMouseDragging = false;
        }

        function keyPressed() {
    if (key === ' ' && 
        document.activeElement.tagName !== 'BUTTON' && 
        document.activeElement.tagName !== 'INPUT') {
        isPaused = !isPaused;
        return false;
    }
    return true;
}