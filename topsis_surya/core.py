
"""
TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
Multi-criteria decision-making implementation using NumPy and Pandas.
Author: SURYA KANT TIWARI (102303737)

This file contains detailed comments explaining each step and the use of inbuilt functions from pandas (pd) and numpy (np).
"""


import sys
import pandas as pd  # pandas for data manipulation and CSV I/O
import numpy as np    # numpy for fast numerical operations



def error_and_exit(message: str) -> None:
    """Print error message and exit."""
    print(f"Error: {message}")
    sys.exit(1)



def parse_and_validate(weights_arg: str, impacts_arg: str, ncols: int):
    """Parse weights/impacts and validate against criteria count."""
    try:
        # np.array: Convert list of weights to numpy array for vectorized math
        weights = np.array([
            float(w.strip()) for w in weights_arg.split(",") if w.strip()
        ])
    except ValueError:
        error_and_exit("Weights must be numeric and separated by commas")

    # List comprehension to clean up impacts
    impacts = [imp.strip() for imp in impacts_arg.split(",") if imp.strip()]
    # all(): Python built-in, checks all impacts are '+' or '-'
    if not all(imp in ("+", "-") for imp in impacts):
        error_and_exit("Impacts must be '+' or '-' and separated by commas")

    # Check that weights and impacts match number of criteria
    if len(weights) != ncols or len(impacts) != ncols:
        error_and_exit(f"Weights and impacts count must equal criteria count ({ncols})")

    # Return weights as numpy array, impacts as numpy array for later vectorized use
    return weights, np.array(impacts)



def read_and_validate_csv(path: str):
    """Read CSV and validate structure using pandas."""
    try:
        # pd.read_csv: Read CSV file into DataFrame
        df = pd.read_csv(path)
    except FileNotFoundError:
        error_and_exit("File not found")
    except Exception as e:
        error_and_exit(f"Unable to read file: {e}")

    # df.shape: tuple (rows, columns), check at least 3 columns
    if df.shape[1] < 3:
        error_and_exit("Input file must have at least 3 columns")

    # df.iloc[:, 1:]: select all rows, columns 2 onward (criteria columns)
    # pd.to_numeric(..., errors='coerce'): convert to numeric, non-numeric becomes NaN
    # .notna(): True for numeric, False for NaN
    # .all().all(): check all values in all columns are numeric
    if not df.iloc[:, 1:].apply(pd.to_numeric, errors="coerce").notna().all().all():
        error_and_exit("Columns 2 onwards must contain only numeric values")

    return df



def topsis_calculation(data: np.ndarray, weights: np.ndarray, impacts: np.ndarray):
    """
    Complete TOPSIS algorithm:
    1. Normalize (vector normalization)
    2. Apply weights
    3. Find ideal best/worst
    4. Calculate separation measures
    5. Compute scores and ranks
    """
    # Step 1: Normalize columns (criteria) using np.linalg.norm (Euclidean norm)
    norms = np.linalg.norm(data, axis=0)  # shape: (num_criteria,)
    # np.any: check for any zero-norm columns (all zeros)
    if np.any(norms == 0):
        error_and_exit("Column with all zeros detected")

    # Step 2: Apply weights (broadcasting)
    # (data / norms): normalized matrix, shape (alternatives, criteria)
    # * weights: element-wise multiply by weights
    weighted = (data / norms) * weights

    # Step 3: Find ideal best/worst using np.where
    # weighted.max(axis=0): best for each criterion
    # weighted.min(axis=0): worst for each criterion
    # impacts == '+': beneficial, impacts == '-': cost
    ideal_best = np.where(impacts == "+", weighted.max(axis=0), weighted.min(axis=0))
    ideal_worst = np.where(impacts == "+", weighted.min(axis=0), weighted.max(axis=0))

    # Step 4: Calculate separation measures (Euclidean distance to ideal best/worst)
    s_best = np.linalg.norm(weighted - ideal_best, axis=1)   # distance to ideal best
    s_worst = np.linalg.norm(weighted - ideal_worst, axis=1) # distance to ideal worst

    # Step 5: Compute TOPSIS scores (relative closeness)
    # np.divide: element-wise division, out=..., where=... handles division by zero
    scores = np.divide(
        s_worst,
        s_best + s_worst,
        out=np.zeros_like(s_worst),
        where=(s_best + s_worst) != 0,
    )
    # np.argsort(-scores): indices for descending sort, .argsort() again gives ranks
    ranks = np.argsort(-scores).argsort() + 1  # 1-indexed ranks

    return scores, ranks



def run_topsis(
    input_path: str, weights_arg: str, impacts_arg: str, output_path: str
) -> None:
    """Main TOPSIS execution pipeline."""
    # Read and validate input CSV using pandas
    df = read_and_validate_csv(input_path)
    # Number of criteria columns (excluding identifier)
    ncols = df.shape[1] - 1

    # Parse and validate weights/impacts
    weights, impacts = parse_and_validate(weights_arg, impacts_arg, ncols)
    # df.iloc[:, 1:]: select numeric columns, .to_numpy(dtype=float): convert to numpy array
    data = df.iloc[:, 1:].to_numpy(dtype=float)
    # Run TOPSIS calculation
    scores, ranks = topsis_calculation(data, weights, impacts)

    # Add results to DataFrame
    df["Topsis Score"] = scores
    df["Rank"] = ranks
    # Write output CSV using pandas
    df.to_csv(output_path, index=False)



def main(argv=None) -> None:
    # Parse command-line arguments
    args = argv if argv is not None else sys.argv[1:]
    if len(args) != 4:
        error_and_exit("Usage: <InputDataFile> <Weights> <Impacts> <OutputResultFile>")
    run_topsis(*args)
    print(f"Result written to {args[3]}")



def cli() -> None:
    main()
