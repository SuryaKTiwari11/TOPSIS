export interface TopsisData {
  [key: string]: string | number;
}

export interface TopsisResult {
  data: TopsisData[];
  scores: number[];
  ranks: number[];
}

export function validateCSVData(data: TopsisData[]): string | null {
  if (!data || data.length === 0) {
    return "CSV file is empty or invalid";
  }

  const headers = Object.keys(data[0]);
  if (headers.length < 3) {
    return "CSV must have at least 3 columns (1 identifier + 2 criteria minimum)";
  }

  // Check if all numeric columns contain valid numbers
  const numericHeaders = headers.slice(1); // Skip first column (identifier)

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (const header of numericHeaders) {
      const value = row[header];
      if (value === null || value === undefined || value === "") {
        return `Missing value in row ${i + 1}, column "${header}"`;
      }
      if (isNaN(Number(value))) {
        return `Non-numeric value "${value}" in row ${i + 1}, column "${header}"`;
      }
    }
  }

  return null; // No errors
}

export function validateWeights(
  weights: number[],
  criteriaCount: number,
): string | null {
  if (weights.length !== criteriaCount) {
    return `Number of weights (${weights.length}) must match number of criteria (${criteriaCount})`;
  }

  if (weights.some((w) => w <= 0)) {
    return "All weights must be positive numbers";
  }

  return null;
}

export function validateImpacts(
  impacts: string[],
  criteriaCount: number,
): string | null {
  if (impacts.length !== criteriaCount) {
    return `Number of impacts (${impacts.length}) must match number of criteria (${criteriaCount})`;
  }

  if (impacts.some((impact) => impact !== "+" && impact !== "-")) {
    return "All impacts must be either '+' (benefit) or '-' (cost)";
  }

  return null;
}

export function calculateTOPSIS(
  data: TopsisData[],
  weights: number[],
  impacts: string[],
): TopsisResult {
  const headers = Object.keys(data[0]);
  const criteriaHeaders = headers.slice(1); // Skip identifier column

  // Extract numeric data matrix
  const matrix: number[][] = data.map((row) =>
    criteriaHeaders.map((header) => Number(row[header])),
  );

  const numAlternatives = matrix.length;
  const numCriteria = matrix[0].length;

  // Step 1: Normalize the decision matrix using vector normalization
  const normalizedMatrix: number[][] = [];
  for (let j = 0; j < numCriteria; j++) {
    const columnSum = Math.sqrt(
      matrix.reduce((sum, row) => sum + Math.pow(row[j], 2), 0),
    );

    if (columnSum === 0) {
      throw new Error(`Column ${j + 1} contains all zeros`);
    }

    for (let i = 0; i < numAlternatives; i++) {
      if (!normalizedMatrix[i]) normalizedMatrix[i] = [];
      normalizedMatrix[i][j] = matrix[i][j] / columnSum;
    }
  }

  // Step 2: Calculate weighted normalized matrix
  const weightedMatrix: number[][] = normalizedMatrix.map((row) =>
    row.map((value, j) => value * weights[j]),
  );

  // Step 3: Determine ideal best and worst solutions
  const idealBest: number[] = [];
  const idealWorst: number[] = [];

  for (let j = 0; j < numCriteria; j++) {
    const columnValues = weightedMatrix.map((row) => row[j]);
    const maxVal = Math.max(...columnValues);
    const minVal = Math.min(...columnValues);

    if (impacts[j] === "+") {
      idealBest[j] = maxVal;
      idealWorst[j] = minVal;
    } else {
      idealBest[j] = minVal;
      idealWorst[j] = maxVal;
    }
  }

  // Step 4: Calculate separation measures
  const separationBest: number[] = [];
  const separationWorst: number[] = [];

  for (let i = 0; i < numAlternatives; i++) {
    let distanceBest = 0;
    let distanceWorst = 0;

    for (let j = 0; j < numCriteria; j++) {
      distanceBest += Math.pow(weightedMatrix[i][j] - idealBest[j], 2);
      distanceWorst += Math.pow(weightedMatrix[i][j] - idealWorst[j], 2);
    }

    separationBest[i] = Math.sqrt(distanceBest);
    separationWorst[i] = Math.sqrt(distanceWorst);
  }

  // Step 5: Calculate TOPSIS scores and ranks
  const scores: number[] = [];
  for (let i = 0; i < numAlternatives; i++) {
    const denominator = separationBest[i] + separationWorst[i];
    if (denominator === 0) {
      scores[i] = 0;
    } else {
      scores[i] = separationWorst[i] / denominator;
    }
  }

  // Calculate ranks
  const indexedScores = scores.map((score, index) => ({ score, index }));
  indexedScores.sort((a, b) => b.score - a.score);

  const ranks: number[] = new Array(numAlternatives);
  indexedScores.forEach((item, rank) => {
    ranks[item.index] = rank + 1;
  });

  return {
    data,
    scores,
    ranks,
  };
}

export function formatCSVForDownload(result: TopsisResult): string {
  const headers = Object.keys(result.data[0]);
  const csvHeaders = [...headers, "Topsis Score", "Rank"].join(",");

  const csvRows = result.data.map((row, index) => {
    const rowValues = headers.map((header) => {
      const value = row[header];
      // Handle values that contain commas by wrapping in quotes
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value;
    });

    // Add score and rank
    rowValues.push(result.scores[index].toFixed(10));
    rowValues.push(result.ranks[index].toString());

    return rowValues.join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}
