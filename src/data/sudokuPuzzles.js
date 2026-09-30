// 9 nguyên tố đại diện cho 9 "số" trong Sudoku
export const SUDOKU_ELEMENTS = [
  { key: 'H',  symbol: 'H',  name: 'Hiđro',    color: '#e8f5e9' },
  { key: 'C',  symbol: 'C',  name: 'Cacbon',   color: '#263238' },
  { key: 'N',  symbol: 'N',  name: 'Nitơ',     color: '#bbdefb' },
  { key: 'O',  symbol: 'O',  name: 'Oxi',      color: '#ffcdd2' },
  { key: 'Na', symbol: 'Na', name: 'Natri',    color: '#ffcc80' },
  { key: 'Mg', symbol: 'Mg', name: 'Magie',    color: '#c8e6c9' },
  { key: 'Al', symbol: 'Al', name: 'Nhôm',     color: '#d7ccc8' },
  { key: 'Cl', symbol: 'Cl', name: 'Clo',      color: '#dcedc8' },
  { key: 'Fe', symbol: 'Fe', name: 'Sắt',      color: '#cfd8dc' },
];

// Puzzles — mỗi puzzle là mảng 9x9, 0 = ô trống
export const SUDOKU_PUZZLES = {
  easy: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  medium: [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  hard: [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 6, 0],
    [9, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 1, 0, 0],
  ],
};

// Câu hỏi gợi ý — khi user cần hint
export const SUDOKU_HINTS = [
  { q: 'Nguyên tố nào có ký hiệu H?', a: 'H', wrong: ['He', 'Hg', 'Ho'] },
  { q: 'Nguyên tố nào có số hiệu 6?', a: 'C', wrong: ['N', 'O', 'B'] },
  { q: 'Nguyên tố nào chiếm 78% không khí?', a: 'N', wrong: ['O', 'CO2', 'Ar'] },
  { q: 'Nguyên tố nào cần cho sự cháy?', a: 'O', wrong: ['H', 'N', 'C'] },
  { q: 'Kim loại kiềm phổ biến trong muối ăn?', a: 'Na', wrong: ['K', 'Li', 'Ca'] },
  { q: 'Nguyên tố nào có trong diệp lục?', a: 'Mg', wrong: ['Fe', 'Ca', 'Zn'] },
  { q: 'Kim loại nhẹ dùng làm vỏ máy bay?', a: 'Al', wrong: ['Fe', 'Cu', 'Ti'] },
  { q: 'Nguyên tố nào tạo muối ăn với Na?', a: 'Cl', wrong: ['F', 'Br', 'I'] },
  { q: 'Nguyên tố nào có trong hemoglobin?', a: 'Fe', wrong: ['Cu', 'Zn', 'Mg'] },
];

// Kiểm tra nước đi hợp lệ
export function isValidMove(board, row, col, value) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === value) return false;
  }
  // Check col
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === value) return false;
  }
  // Check 3x3 box
  const boxR = Math.floor(row / 3) * 3;
  const boxC = Math.floor(col / 3) * 3;
  for (let r = boxR; r < boxR + 3; r++) {
    for (let c = boxC; c < boxC + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) return false;
    }
  }
  return true;
}

// Đếm số ô còn trống
export function countEmpty(board) {
  return board.flat().filter((v) => v === 0).length;
}

// Kiểm tra hoàn thành
export function isComplete(board) {
  return board.flat().every((v) => v !== 0);
}