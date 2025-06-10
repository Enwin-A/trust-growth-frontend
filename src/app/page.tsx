'use client';
import { useState } from 'react';

type AnalysisResult = {
  ticker: string;
  trustScore: number;
  trustJustification: string;
  trustRecommendations: string[];
  growthScore: number;
  growthJustification: string;
  growthRecommendations: string[];
  summary: string;
  runId: string;
};

export default function HomePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [ticker, setTicker] = useState<'VOLV-B' | 'HM-B'>('VOLV-B');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // the file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  // backend submit form stuff
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError('Please select at least one PDF file.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append('ticker', ticker);
    Array.from(files).forEach((f) => form.append('files', f));

    try {
      const res = await fetch('http://localhost:4000/api/analyze', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        // trying to parse JSON error, else text
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          errMsg = errJson.error || JSON.stringify(errJson);
        } catch {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }
      const json = (await res.json()) as AnalysisResult;
      setResult(json);
    } catch (e: any) {
      console.error('Fetch error:', e);
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // the export JSON client side
  const handleExportJson = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.ticker}_analysis_${result.runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Trust & Growth Analyzer</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-lg space-y-4"
      >
        <div>
          <label className="block font-medium">Select Company:</label>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value as 'VOLV-B' | 'HM-B')}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="VOLV-B">Volvo Group (VOLV-B)</option>
            <option value="HM-B">H&amp;M (HM-B)</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Upload up to 5 Annual Report PDFs:</label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="annual-report-upload"
          />
          <label
            htmlFor="annual-report-upload"
            className="mt-1 inline-block cursor-pointer bg-blue-300 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out"
          >
            Choose PDF Files
          </label>
          {files && files.length > 0 && (
            <div className="mt-2 text-sm text-gray-700">
              Selected Files:
              <ul className="list-disc list-inside ml-4">
                {Array.from(files).map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Run Analysis'}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

      {result && (
        <div className="mt-8 w-full max-w-lg bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Results for {result.ticker}</h2>

          {/* the trust section */}
          <div className="mb-6">
            <h3 className="font-medium text-lg">Trust (Transparency): {result.trustScore}/100</h3>
            <p className="mt-1 text-gray-700">{result.trustJustification}</p>
            {result.trustRecommendations && result.trustRecommendations.length > 0 && (
              <>
                <h4 className="font-medium mt-3">Transparency Recommendations:</h4>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {result.trustRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* the growth section */}
          <div className="mb-6">
            <h3 className="font-medium text-lg">Growth (Differentiation): {result.growthScore}/100</h3>
            <p className="mt-1 text-gray-700">{result.growthJustification}</p>
            {result.growthRecommendations && result.growthRecommendations.length > 0 && (
              <>
                <h4 className="font-medium mt-3">Differentiation Recommendations:</h4>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {result.growthRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <p className="mt-4 italic text-gray-600">{result.summary}</p>
          <p className="mt-2 text-sm text-gray-500">Run ID: {result.runId}</p>

          {/* the export JSON button */}
          <div className="mt-4">
            <button
              onClick={handleExportJson}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
