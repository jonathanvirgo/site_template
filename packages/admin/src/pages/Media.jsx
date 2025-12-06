import { useState, useEffect } from 'react';
import { Card, Upload, Image, Button, Modal, message, Spin, Typography, Input, Empty } from 'antd';
import {
    UploadOutlined,
    DeleteOutlined,
    CopyOutlined,
    SearchOutlined,
    InboxOutlined
} from '@ant-design/icons';
import { mediaApi } from '../services/api';

const { Title } = Typography;
const { Dragger } = Upload;

export default function Media() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [media, setMedia] = useState([]);
    const [search, setSearch] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        try {
            const response = await mediaApi.getAll({ limit: 100 });
            setMedia(response.data.data || []);
        } catch (error) {
            message.error('Failed to load media');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (options) => {
        const { file, onSuccess, onError } = options;
        setUploading(true);

        try {
            const response = await mediaApi.upload(file);
            onSuccess(response.data);
            message.success('File uploaded!');
            loadMedia();
        } catch (error) {
            onError(error);
            message.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (item) => {
        Modal.confirm({
            title: 'Delete File?',
            content: `Delete "${item.originalName}"? This cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await mediaApi.delete(item.id);
                    message.success('File deleted');
                    loadMedia();
                } catch (error) {
                    message.error('Failed to delete file');
                }
            },
        });
    };

    const handleCopyUrl = (item) => {
        navigator.clipboard.writeText(item.url);
        message.success('URL copied to clipboard!');
    };

    const filteredMedia = media.filter(item =>
        !search ||
        item.originalName?.toLowerCase().includes(search.toLowerCase()) ||
        item.alt?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Media Library</Title>
                <Input
                    placeholder="Search media..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 250 }}
                />
            </div>

            {/* Upload Area */}
            <Card style={{ marginBottom: 24 }}>
                <Dragger
                    customRequest={handleUpload}
                    showUploadList={false}
                    accept="image/*"
                    multiple
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag files to upload</p>
                    <p className="ant-upload-hint">
                        Support for images: JPG, PNG, GIF, WebP, SVG
                    </p>
                </Dragger>
            </Card>

            {/* Media Grid */}
            <Card>
                {filteredMedia.length === 0 ? (
                    <Empty description="No media files yet" />
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 16,
                    }}>
                        {filteredMedia.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    background: '#fafafa',
                                }}
                            >
                                <div
                                    style={{
                                        height: 120,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                    }}
                                    onClick={() => setPreviewImage(item.url)}
                                >
                                    <img
                                        src={item.url}
                                        alt={item.alt || item.originalName}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </div>
                                <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                                    <p style={{
                                        fontSize: 12,
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {item.originalName}
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        marginTop: 8,
                                        gap: 4,
                                    }}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => handleCopyUrl(item)}
                                        />
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDelete(item)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Image Preview */}
            <Image
                style={{ display: 'none' }}
                preview={{
                    visible: !!previewImage,
                    src: previewImage,
                    onVisibleChange: (visible) => {
                        if (!visible) setPreviewImage(null);
                    },
                }}
            />
        </div>
    );
}
