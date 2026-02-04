import React, { useState } from 'react';
import { FiX, FiFlag, FiUpload, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { getCourseImageUrl } from '../../utils/images';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose }) => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: 'OTHER',
        description: '',
        evidenceUrls: []
    });
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [...formData.evidenceUrls];

        try {
            for (const file of files) {
                // Client-side validation
                if (!file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image file`);
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} is too large (max 5MB)`);
                    continue;
                }

                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                    const data = new FormData();
                    data.append('image', file);

                    const res = await axios.post(`${API_URL}/upload/image`, data, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`
                        },
                        timeout: 15000 // 15s timeout
                    });

                    if (res.data.success) {
                        uploadedUrls.push(res.data.data.url);
                    }
                } catch (error) {
                    console.error('File upload error:', error);
                    const errorMsg = error.code === 'ECONNABORTED'
                        ? 'Request timed out'
                        : (error.response?.data?.message || 'Upload failed');
                    toast.error(`Failed to upload ${file.name}: ${errorMsg}`);
                }
            }
            setFormData({ ...formData, evidenceUrls: uploadedUrls });
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeImage = (url) => {
        setFormData({
            ...formData,
            evidenceUrls: formData.evidenceUrls.filter(item => item !== url)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description.trim()) {
            toast.error('Please describe the issue');
            return;
        }

        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const payload = {
                reportedItemType: 'USER', // System general report can be categorized under USER or a new type
                reportedItemId: 'SYSTEM',   // Special ID for system-wide reports
                category: formData.category,
                description: formData.description,
                evidenceUrls: formData.evidenceUrls
            };

            const res = await axios.post(`${API_URL}/users/report`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success('Report submitted successfully! Thank you for your feedback.');
                onClose();
            }
        } catch (error) {
            console.error('Report submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h2><FiFlag /> Report an Issue</h2>
                    <button className="btn-close" onClick={onClose} aria-label="Close modal">
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="report-form">
                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="INACCURATE">Content Inaccuracy</option>
                            <option value="INAPPROPRIATE">Inappropriate Content</option>
                            <option value="OFFENSIVE">Offensive Behavior</option>
                            <option value="HARASSMENT">Harassment</option>
                            <option value="COPYRIGHT">Copyright Violation</option>
                            <option value="SPAM">Spam</option>
                            <option value="TECHNICAL_ERROR">Technical Bug/Error</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            rows="4"
                            placeholder="Please provide details about the issue..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Evidence (Screenshots/Images)</label>
                        <label className="file-upload-area">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input-hidden"
                            />
                            <FiUpload className="upload-icon" />
                            <p>{uploading ? 'Uploading...' : 'Click or Drag images to upload'}</p>
                        </label>

                        {formData.evidenceUrls.length > 0 && (
                            <div className="preview-container">
                                {formData.evidenceUrls.map((url, idx) => (
                                    <div key={idx} className="image-preview">
                                        <img src={getCourseImageUrl(url)} alt="preview" />
                                        <button type="button" className="remove-img" onClick={() => removeImage(url)}>
                                            <FiX />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="report-modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading || uploading}>
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
