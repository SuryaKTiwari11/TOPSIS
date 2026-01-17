# Topsis-SURYA-102303737

TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) command-line package by **SURYA KANT TIWARI** (Roll 102303737).

**Repository**: https://github.com/SuryaKTiwari11/TOPSIS

## Installation

### From PyPI (after publishing)

```bash
pip install Topsis-SURYA-102303737
```

### Local development

```bash
git clone https://github.com/SuryaKTiwari11/TOPSIS.git
cd TOPSIS
pip install -e .
```

## Usage

### Command-line interface

```bash
python -m topsis_surya <InputDataFile> <Weights> <Impacts> <OutputResultFile>
```

Or after installation:

```bash
topsis-cli data.csv "1,1,1,2" "+,+,-,+" output.csv
```

### Parameters

- **InputDataFile**: CSV file with first column as identifier, remaining columns as numeric criteria
- **Weights**: Comma-separated numeric values (e.g., `1,1,1,2`)
- **Impacts**: Comma-separated `+` (beneficial) or `-` (cost) for each criterion (e.g., `+,+,-,+`)
- **OutputResultFile**: Path for result CSV with added `Topsis Score` and `Rank` columns

### Example

```bash
topsis-cli input.csv "1,1,1,1" "+,+,-,+" result.csv
```

## Input Format

CSV file with:

- Header row
- First column: Alternative names/IDs
- Remaining columns: Numeric criteria values (minimum 2 criteria required)

## Output Format

Input data with two additional columns:

- **Topsis Score**: Closeness coefficient (0-1)
- **Rank**: Rank based on score (1 = best)

## Publishing to PyPI

### Build

```bash
python -m build
```

### Upload

```bash
python -m twine upload dist/*
```

### Test installation

```bash
pip install Topsis-SURYA-102303737
topsis-cli --help
```

## License

MIT License - see [LICENSE](LICENSE) file

## Author

SURYA KANT TIWARI - Roll No. 102303737
