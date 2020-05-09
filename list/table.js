// Nomenclature:
// Column
// TerminalWidth
// Overhead
// Rows

const ansiRegex = require('ansi-regex');

const allAnsiEscapeSequencesRegExp = ansiRegex();

const minimumColumnWidth = 5;

const tableFrameTopLeft = '┌';
const tableFrameTopLine = '─';
const tableFrameTopSeparator = '┬';
const tableFrameTopRight = '┐';

const tableFrameMiddleLeft = '├';
const tableFrameMiddleLine = '─';
const tableFrameMiddleSeparator = '┼';
const tableFrameMiddleRight = '┤';

const tableFrameBottomLeft = '└';
const tableFrameBottomLine = '─';
const tableFrameBottomSeparator = '┴';
const tableFrameBottomRight = '┘';

const cellEdge = '│';

const tableCellLeftPad = ' ';
const tableCellRightPad = ' ';

const cellPadLength = tableCellLeftPad.length + tableCellRightPad.length;

const output = process.stdout;

function getTextWithoutAnsiEscapeCodes(text) {
  return text.replace(allAnsiEscapeSequencesRegExp, '');
}

function findWidestCellsInRows(rows) {
  return rows.reduce(
    (acc, row) => {
      row.forEach((cellValue, rowIndex) => {
        const maxCellRowLength = Math.max(...cellValue.split('\n').map(cellRow => getTextWithoutAnsiEscapeCodes(cellRow).length));
        acc[rowIndex] = maxCellRowLength > acc[rowIndex] ? maxCellRowLength : acc[rowIndex];
      });

      return acc;
    },
    rows[0].map(() => 0)
  );
}

function fitColumnWidthsToBoundingFrameWidth(boundingWidth, columnWidths) {
  const columnWidthSum = columnWidths.reduce((acc, columnWidth) => acc + columnWidth, 0);
  const overhead = columnWidths.length * (tableFrameMiddleLeft.length + tableCellLeftPad.length + tableCellRightPad.length) + tableFrameMiddleRight.length;

  const rowWidth = columnWidthSum + overhead;

  // Happy case
  if (boundingWidth >= rowWidth) {
    return columnWidths;
  }

  const numberOfCharsToRemove = rowWidth - boundingWidth;
  const columnsWiderThanMinimum = columnWidths.filter(cellWidth => cellWidth > minimumColumnWidth);

  const widthPossibleToShrink = columnsWiderThanMinimum.reduce((acc, columnWidth) => acc + columnWidth - minimumColumnWidth, 0);
  if (widthPossibleToShrink < numberOfCharsToRemove) {
    // We can't trim down enough to accommodate for bounding frame width
    // Return minimumColumnWidth or it's width - whatever is less
    return columnWidths.map(columnWidth => (columnWidth > minimumColumnWidth ? minimumColumnWidth : columnWidth));
  }

  // Algo:
  // The columns that have width greater than minimumColumnWidth
  // Set them to mimiumColumnWidth and then gradually increase
  // their width until the total row width + overhead
  // is equal to the terminal width.

  // To maintain relative scaling of the columns as we increase
  // each column has an total cost and a cost for increasing
  // that column with one that is proportional to the columns
  // length. This way it's cheaper to increase a long column
  // with one than a short and relative scaling will be maintained.

  // Increase the column with the lowest total cost until
  // we've scaled up the number of characters until terminal width.

  // The columns that have less than minimumColumnWidth are
  // simply maintained as is by having an inifinite cost to increase
  const columnCosts = columnWidths.map(columnWidth => {
    let scaledWidth = columnWidth;
    let totalCost = Number.MAX_SAFE_INTEGER;
    let costOfIncreaseWithOne = Number.MAX_SAFE_INTEGER;

    if (columnWidth > minimumColumnWidth) {
      scaledWidth = minimumColumnWidth;
      totalCost = 0;
      costOfIncreaseWithOne = 1 / (columnWidth - minimumColumnWidth);
    }

    return {
      scaledWidth,
      totalCost,
      costOfIncreaseWithOne,
    };
  });

  const initialStateWidth = columnCosts.reduce((acc, { scaledWidth }) => acc + scaledWidth, 0);
  let numberOfCharsToIncrease = boundingWidth - overhead - initialStateWidth;

  while (numberOfCharsToIncrease > 0) {
    let lowestCostIndex = 0;
    let currentLowestCost = Number.MAX_SAFE_INTEGER;

    // Find the index of the minimum increase in totalCost when adding one column
    columnCosts.forEach((columnCost, index) => {
      const { totalCost, costOfIncreaseWithOne } = columnCost;
      const newTotalCost = totalCost + costOfIncreaseWithOne;

      if (currentLowestCost > newTotalCost) {
        lowestCostIndex = index;
        currentLowestCost = newTotalCost;
      }
    });

    columnCosts[lowestCostIndex].scaledWidth += 1;
    columnCosts[lowestCostIndex].totalCost = currentLowestCost;

    numberOfCharsToIncrease--;
  }

  return columnCosts.map(({ scaledWidth }) => scaledWidth);
}

function getInitAndLast(arr) {
  const shallowCopy = [...arr];
  const last = shallowCopy.pop();

  return [shallowCopy, last];
}

function printFrameRow(textWidths, leftEdge, line, separator, rightEdge) {
  output.write(leftEdge);

  const [init, last] = getInitAndLast(textWidths);

  init.forEach(textWidth => {
    output.write(line.repeat(textWidth + cellPadLength));
    output.write(separator);
  });

  output.write(line.repeat(last + cellPadLength));
  output.write(rightEdge);

  output.write('\n');
}

const isFirstInStringAnAnsiEscapeSequenceRegExp = new RegExp(`^${ansiRegex({ onlyFirst: true }).source}`);

function ellipsizeWithAnsiEscapeSequences(string, ellipsizeLength) {
  let result = '';
  let addedChars = 0;

  while (addedChars < ellipsizeLength - 3) {
    const isFirstInStringAnsiEscSequenceMatch = string.match(isFirstInStringAnAnsiEscapeSequenceRegExp);

    if (isFirstInStringAnsiEscSequenceMatch) {
      result += isFirstInStringAnsiEscSequenceMatch[0];
      string = string.substring(isFirstInStringAnsiEscSequenceMatch[0].length);
    } else {
      result += string.charAt(0);
      string = string.substring(1);
      addedChars++;
    }
  }

  result += '...';

  while (string.length) {
    const isFirstInStringAnsiEscSequenceMatch = string.match(ansiRegex({ onlyFirst: true }));

    if (isFirstInStringAnsiEscSequenceMatch) {
      result += isFirstInStringAnsiEscSequenceMatch[0];
      string = string.substring(isFirstInStringAnsiEscSequenceMatch[0].length);
    } else {
      string = string.substring(1);
    }
  }

  return result;
}

function padOrElipsize(columWidth, text) {
  const textLength = getTextWithoutAnsiEscapeCodes(text).length;
  const paddedTextWidth = columWidth - textLength;

  if (paddedTextWidth < 0) {
    return ellipsizeWithAnsiEscapeSequences(text, columWidth);
  }

  return text + ' '.repeat(paddedTextWidth);
}

function printDataRow(row, columnWidths) {
  const rowsSplitOnNewline = row.map(cellValue => cellValue.split('\n'));
  const tallestRow = Math.max(...rowsSplitOnNewline.map(newlineCell => newlineCell.length));

  for (let i = 0; i < tallestRow; i++) {
    output.write(cellEdge);

    rowsSplitOnNewline.forEach((newlineCell, columnIndex) => {
      let cellValue = '';
      if (i < newlineCell.length) {
        cellValue = newlineCell[i];
      }

      output.write(tableCellLeftPad + padOrElipsize(columnWidths[columnIndex], cellValue) + tableCellRightPad);
      output.write(cellEdge);
    });

    output.write('\n');
  }
}

function printRows(data, columnWidths) {
  const [init, lastRow] = getInitAndLast(data);

  printFrameRow(columnWidths, tableFrameTopLeft, tableFrameTopLine, tableFrameTopSeparator, tableFrameTopRight);

  init.forEach(row => {
    printDataRow(row, columnWidths);
    printFrameRow(columnWidths, tableFrameMiddleLeft, tableFrameMiddleLine, tableFrameMiddleSeparator, tableFrameMiddleRight);
  });

  printDataRow(lastRow, columnWidths);
  printFrameRow(columnWidths, tableFrameBottomLeft, tableFrameBottomLine, tableFrameBottomSeparator, tableFrameBottomRight);
}

module.exports = {
  table() {
    const data = [];
    let dataArity;

    return {
      addData(...rowData) {
        if (!dataArity) {
          dataArity = rowData.length;
        } else {
          const rowArity = rowData.length;
          if (dataArity !== rowArity) {
            throw new Error(`Row does not have correct arity. Previous row(s) arity: ${dataArity} - this rows arity: ${rowArity}`);
          }
        }

        // Filter out undefineds here and make them empty strings
        rowData = rowData.map(rowValue => rowValue || '');

        data.push(rowData);
      },
      display() {
        let columnWidths = findWidestCellsInRows(data);
        const terminalWidth = process.stdout.columns;

        columnWidths = fitColumnWidthsToBoundingFrameWidth(terminalWidth, columnWidths);

        printRows(data, columnWidths);
      },
    };
  },
};
