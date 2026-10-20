import { useState } from 'react'
import './sharefile.css'

function ShareFile() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [status, setStatus] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [stegoFileName, setStegoFileName] = useState('')

  // Select secret file
  const handleFileChange = (event) => {
    const file = event.target.files[0]

    setSelectedFile(file)
    setStatus('')
    setShareLink('')
    setStegoFileName('')
  }

  // Select cover image
  const handleCoverImageChange = (event) => {
    const file = event.target.files[0]

    setCoverImage(file)
    setStatus('')
    setShareLink('')
    setStegoFileName('')
  }

  // Upload file and cover image
  const handleUpload = async () => {
    // Check secret file
    if (!selectedFile) {
      setStatus('Please choose a secret file first!')
      return
    }

    // Check cover image
    if (!coverImage) {
      setStatus('Please choose a cover image first!')
      return
    }

    setStatus('Uploading, encrypting and hiding data...')

    const formData = new FormData()

    // Must match backend multer field names
    formData.append('file', selectedFile)
    formData.append('coverImage', coverImage)

    try {
      const response = await fetch(
        'http://localhost:5000/upload',
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()

      console.log('Backend response:', data)

      if (!response.ok) {
        setStatus(data.message || 'Upload failed!')
        return
      }

      // Get stego image name from backend
      setStegoFileName(data.stegoFileName)

      // Save information
      localStorage.setItem(
        'originalFileName',
        data.originalFileName
      )

      localStorage.setItem(
        'stegoFileName',
        data.stegoFileName
      )

      setStatus(
        'Success! File encrypted and hidden inside the cover image.'
      )

    } catch (error) {
      console.error(error)

      setStatus(
        'Upload failed. Make sure backend is running.'
      )
    }
  }

  // Generate link for STEGO IMAGE
  const handleGenerateLink = () => {
    if (!stegoFileName) {
      setStatus('Please upload the file first!')
      return
    }

    const link =
      'http://localhost:5000/download-stego/' +
      encodeURIComponent(stegoFileName)

    setShareLink(link)

    localStorage.setItem(
      'sharedLink',
      link
    )

    setStatus('Stego image share link generated successfully!')
  }

  // Copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)

      setStatus('Share link copied successfully!')
    } catch (error) {
      console.error(error)

      setStatus(
        'Copy failed. Please copy the link manually.'
      )
    }
  }

  return (
    <div className="share-container">
      <div className="share-card">

        <h1>Share File</h1>

        <p className="subtitle">
          Encrypt your secret file and hide it inside a cover image.
        </p>

        {/* Secret File */}
        <div className="input-group">

          <label>Choose Secret File</label>

          <input
            type="file"
            onChange={handleFileChange}
          />

          {selectedFile && (
            <p className="selected">
              Secret File: {selectedFile.name}
            </p>
          )}

        </div>

        {/* Cover Image */}
        <div className="input-group">

          <label>Choose Cover Image</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
          />

          {coverImage && (
            <p className="selected">
              Cover Image: {coverImage.name}
            </p>
          )}

        </div>

        {/* Upload Button */}
        <button
          className="share-btn"
          onClick={handleUpload}
        >
          Encrypt & Hide Data
        </button>

        {/* Status */}
        {status && (
          <p className="status">
            {status}
          </p>
        )}

        {/* Generate Link */}
        {stegoFileName && (
          <button
            className="share-btn"
            onClick={handleGenerateLink}
          >
            Generate Stego Image Link
          </button>
        )}

        {/* Share Link */}
        {shareLink && (
          <div className="link-section">

            <p>Stego Image Share Link:</p>

            <input
              type="text"
              value={shareLink}
              readOnly
            />

            <button
              className="share-btn"
              onClick={handleCopyLink}
            >
              Copy Link
            </button>

            <br />
            <br />

            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="share-btn">
                Download Stego Image
              </button>
            </a>

          </div>
        )}

      </div>
    </div>
  )
}

export default ShareFile