'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { 
  TopsisData, 
  TopsisResult, 
  validateCSVData, 
  validateWeights, 
  validateImpacts, 
  calculateTOPSIS,
  formatCSVForDownload 
} from '@/lib/topsis';

export default function Home() {
  const [csvData, setCsvData] = useState<TopsisData[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [weights, setWeights] = useState<number[]>([]);
  const [impacts, setImpacts] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [result, setResult] = useState<TopsisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as TopsisData[];
        
        const validationError = validateCSVData(data);
        if (validationError) {
          setError(validationError);
          return;
        }

        setCsvData(data);
        
        // Initialize weights and impacts arrays based on criteria count
        const headers = Object.keys(data[0]);
        const criteriaCount = headers.length - 1; // Exclude identifier column
        
        // Set default weights: 0.25, 0.25, 0.2, 0.3 for first 4, then equal for rest
        const defaultWeights = [];
        for (let i = 0; i < criteriaCount; i++) {
          if (i === 0) defaultWeights.push(0.25);
          else if (i === 1) defaultWeights.push(0.25);
          else if (i === 2) defaultWeights.push(0.2);
          else if (i === 3) defaultWeights.push(0.3);
          else defaultWeights.push(1 / criteriaCount);
        }
        
        // Set default impacts: +, -, +, -, +, -, ...
        const defaultImpacts = [];
        for (let i = 0; i < criteriaCount; i++) {
          defaultImpacts.push(i % 2 === 0 ? '+' : '-');
        }
        
        setWeights(defaultWeights);
        setImpacts(defaultImpacts);
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate inputs
      if (csvData.length === 0) {
        throw new Error('Please upload a CSV file');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const criteriaCount = Object.keys(csvData[0]).length - 1;
      
      // Validate that we have the right number of weights and impacts
      if (weights.length !== criteriaCount) {
        throw new Error(`Number of weights (${weights.length}) must match number of criteria (${criteriaCount})`);
      }
      
      if (impacts.length !== criteriaCount) {
        throw new Error(`Number of impacts (${impacts.length}) must match number of criteria (${criteriaCount})`);
      }
      
      const weightError = validateWeights(weights, criteriaCount);
      if (weightError) {
        throw new Error(weightError);
      }

      const impactError = validateImpacts(impacts, criteriaCount);
      if (impactError) {
        throw new Error(impactError);
      }

      // Calculate TOPSIS
      const topsisResult = calculateTOPSIS(csvData, weights, impacts);
      setResult(topsisResult);

      // Send email with results
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            csvData: formatCSVForDownload(topsisResult),
            fileName
          }),
        });

        const emailResult = await emailResponse.json();
        if (emailResult.success) {
          setSuccess(`✓ Results sent to ${email}!`);
        } else {
          setError('Email sending failed, but results are available below');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole operation if email fails
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const csvContent = formatCSVForDownload(result);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `result_${fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getCriteriaHeaders = () => {
    if (csvData.length === 0) return [];
    return Object.keys(csvData[0]).slice(1); // Skip identifier column
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">TOPSIS</h1>
        <p className="subtitle">Multi-Criteria Decision Making Analysis</p>
        <div className="author-section">
          <a 
            href="https://github.com/SuryaKTiwari11/TOPSIS" 
            target="_blank" 
            rel="noopener noreferrer"
            className="author-link"
          >
            <span className="author">By Surya Kant Tiwari</span>
            <svg 
              className="github-icon" 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {success && (
          <div className="success">
            {success}
          </div>
        )}

        <div className="form-group">
          <label className="label">CSV FILE</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="file-input"
          />
          <div className="input-help">
            Upload a CSV file with the first column as identifier and remaining columns as criteria values
          </div>
        </div>

        {csvData.length > 0 && (
          <>
            <div className="form-group">
              <label className="label">WEIGHTS</label>
              <div className="weights-display">
                <input
                  type="text"
                  value={weights.join(',')}
                  onChange={(e) => {
                    const weightStr = e.target.value;
                    const newWeights = weightStr.split(',').map(w => {
                      const num = parseFloat(w.trim());
                      return isNaN(num) ? 0 : num;
                    });
                    setWeights(newWeights);
                  }}
                  className="input"
                  placeholder="0.25,0.25,0.2,0.3"
                />
              </div>
              <div className="input-help">
                Enter comma-separated weights (e.g., 0.25,0.25,0.2,0.3)
              </div>
            </div>

            <div className="form-group">
              <label className="label">IMPACTS</label>
              <div className="impacts-display">
                <input
                  type="text"
                  value={impacts.join(',')}
                  onChange={(e) => {
                    const impactStr = e.target.value;
                    const newImpacts = impactStr.split(',').map(i => i.trim()).filter(i => i === '+' || i === '-');
                    setImpacts(newImpacts);
                  }}
                  className="input"
                  placeholder="+,-,+,-"
                />
              </div>
              <div className="input-help">
                Enter comma-separated impacts (+ for benefit, - for cost, e.g., +,-,+,-)
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="label">EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="your@email.com"
          />
          <div className="input-help">
            Enter your email address to receive results notification
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || csvData.length === 0}
          className="submit-button"
        >
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Processing...
            </div>
          ) : (
            'RUN TOPSIS'
          )}
        </button>
      </div>

      {result && (
        <div className="results-table">
          <table className="table">
            <thead>
              <tr>
                <th>Alternative</th>
                <th>TOPSIS Score</th>
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row, index) => {
                const identifier = Object.values(row)[0];
                return (
                  <tr key={index}>
                    <td>{identifier}</td>
                    <td>{result.scores[index].toFixed(10)}</td>
                    <td>
                      <span className="rank-badge">
                        {result.ranks[index]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <button onClick={handleDownload} className="download-button">
            Download Results CSV
          </button>
        </div>
      )}
    </div>
  );
}