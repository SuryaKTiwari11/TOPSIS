# TOPSIS Web Application

A modern web application for TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) multi-criteria decision making analysis.

## Features

- **Modern Web Interface**: Built with Next.js and TypeScript
- **File Upload**: CSV file upload with validation
- **Dynamic Inputs**: Automatic weight and impact configuration based on CSV criteria
- **Data Validation**: Comprehensive validation without comma ambiguity
- **Real-time Results**: Instant TOPSIS calculation and ranking
- **Export Results**: Download results as CSV
- **Responsive Design**: Works on desktop and mobile devices
- **Beautiful UI**: Modern design with custom color scheme

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Vercel](https://vercel.com) and sign in

3. Click "New Project" and import your repository

4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Click "Deploy"

Your application will be automatically deployed with a custom URL.

## Usage

1. **Upload CSV File**: Select a CSV file with the first column as identifiers and remaining columns as criteria values

2. **Set Weights**: Enter positive weights for each criterion. The weights don't need to sum to 1 (they will be normalized internally)

3. **Configure Impacts**: Select '+' for benefit criteria (higher is better) or '-' for cost criteria (lower is better)

4. **Enter Email**: Provide your email address for notifications

5. **Run Analysis**: Click "RUN TOPSIS" to calculate scores and rankings

6. **Download Results**: Export the complete results as a CSV file

## CSV Format

Your input CSV should follow this format:

```csv
Fund Name,P1,P2,P3,P4,P5
M1,0.83,0.69,5.8,41.4,12.18
M2,0.83,0.69,5.8,63,17.58
...
```

- First column: Identifier/Name
- Remaining columns: Numerical criteria values
- No missing values allowed
- All criteria columns must contain numeric data

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Custom CSS with modern design
- **File Processing**: PapaParse for CSV handling
- **Deployment**: Vercel (recommended)

## Color Scheme

- Primary Cyan: `#00F7FF`
- Light Cyan: `#B0FFFA`
- Primary Pink: `#FF0087`
- Light Pink: `#FF7DB0`

## Author

Surya Kant Tiwari

## License

This project is licensed under the MIT License.
