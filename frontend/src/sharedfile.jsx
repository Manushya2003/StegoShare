import { useState } from 'react'
import './sharedfile.css'

function SharedFile() {
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('')

  const handleLoadFile = () => {
    const savedFileName = localStorage.getItem('sharedFileName')

    if (savedFileName) {
      setFileName(savedFileName)
      setStatus('File is ready to access.')
    } else {
      setStatus('No shared file found.')
    }
  }

  const handleDownload = () => {
    const serverFileName = localStorage.getItem('serverFileName')

    if (!serverFileName) {
      setStatus('File information not found.')
      return
    }

    const downloadUrl =
      `http://localhost:5000/download/${encodeURIComponent(serverFileName)}`

    window.open(downloadUrl, '_blank')

    setStatus('Download started.')
  }

  return (
    <div className="shared-container">
      <div className="shared-card">

        <h1>🔐 Shared File</h1>

        <p className="subtitle">
          A file has been securely shared with you.
        </p>

        <button
          className="download-btn"
          onClick={handleLoadFile}
        >
          Load Shared File
        </button>

        {fileName && (
          <div className="file-box">

            <p>
              📄 <strong>{fileName}</strong>
            </p>

            <p className="file-info">
              {status}
            </p>

            <button
              className="download-btn"
              onClick={handleDownload}
            >
              Download File
            </button>

          </div>
        )}

        {status && !fileName && (
          <p className="file-info">
            {status}
          </p>
        )}

      </div>
    </div>
  )
}

export default SharedFile