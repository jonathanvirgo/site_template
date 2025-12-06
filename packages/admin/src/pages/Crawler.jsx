import { useState, useEffect } from 'react';
import {
    Card, Table, Button, Input, Tag, Space, Modal, message,
    Typography, Form, Spin, Drawer
} from 'antd';
import {
    CloudDownloadOutlined,
    ImportOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { crawlerApi } from '../services/api';

const { Title, Paragraph } = Typography;

export default function Crawler() {
    const [loading, setLoading] = useState(true);
    const [crawling, setCrawling] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const response = await crawlerApi.getJobs({ limit: 50 });
            setJobs(response.data.data || []);
        } catch (error) {
            message.error('Failed to load crawl jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleCrawl = async (values) => {
        setCrawling(true);
        try {
            await crawlerApi.crawl(values.url, {
                extractImages: true,
                downloadImagesLocal: true,
            });
            message.success('Crawl job started! Refresh to see results.');
            form.resetFields();
            loadJobs();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to start crawl');
        } finally {
            setCrawling(false);
        }
    };

    const handleViewJob = async (job) => {
        try {
            const response = await crawlerApi.getJob(job.id);
            setSelectedJob(response.data.data);
            setDrawerOpen(true);
        } catch (error) {
            message.error('Failed to load job details');
        }
    };

    const handleImport = (job) => {
        Modal.confirm({
            title: 'Import as Page?',
            content: `Import "${job.title || 'Untitled'}" as a new draft page?`,
            okText: 'Import',
            onOk: async () => {
                try {
                    await crawlerApi.importAsPage(job.id, {
                        title: job.title,
                    });
                    message.success('Content imported as page!');
                    loadJobs();
                } catch (error) {
                    message.error('Failed to import content');
                }
            },
        });
    };

    const handleDelete = (job) => {
        Modal.confirm({
            title: 'Delete Crawl Job?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await crawlerApi.deleteJob(job.id);
                    message.success('Job deleted');
                    loadJobs();
                } catch (error) {
                    message.error('Failed to delete job');
                }
            },
        });
    };

    const columns = [
        {
            title: 'URL',
            dataIndex: 'sourceUrl',
            key: 'sourceUrl',
            ellipsis: true,
            render: (url) => (
                <a href={url} target="_blank" rel="noopener noreferrer">
                    {url.length > 50 ? url.substring(0, 50) + '...' : url}
                </a>
            ),
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    PENDING: 'default',
                    PROCESSING: 'processing',
                    COMPLETED: 'success',
                    IMPORTED: 'purple',
                    FAILED: 'error',
                };
                return <Tag color={colors[status]}>{status}</Tag>;
            },
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewJob(record)}
                    />
                    {record.status === 'COMPLETED' && (
                        <Button
                            type="text"
                            icon={<ImportOutlined />}
                            onClick={() => handleImport(record)}
                        />
                    )}
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="fade-in">
            <Title level={3} style={{ marginBottom: 24 }}>Content Crawler</Title>

            {/* New Crawl Form */}
            <Card style={{ marginBottom: 24 }}>
                <Title level={5}>Crawl New URL</Title>
                <Form
                    form={form}
                    layout="inline"
                    onFinish={handleCrawl}
                    style={{ gap: 16 }}
                >
                    <Form.Item
                        name="url"
                        rules={[
                            { required: true, message: 'URL is required' },
                            { type: 'url', message: 'Please enter a valid URL' },
                        ]}
                        style={{ flex: 1 }}
                    >
                        <Input
                            placeholder="https://example.com/article"
                            size="large"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            icon={<CloudDownloadOutlined />}
                            loading={crawling}
                        >
                            Start Crawl
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Jobs Table */}
            <Card
                title="Crawl Jobs"
                extra={
                    <Button icon={<ReloadOutlined />} onClick={loadJobs}>
                        Refresh
                    </Button>
                }
            >
                <Table
                    dataSource={jobs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Job Details Drawer */}
            <Drawer
                title="Crawled Content"
                placement="right"
                width={600}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
            >
                {selectedJob && (
                    <div>
                        <Title level={5}>{selectedJob.title || 'Untitled'}</Title>
                        <Paragraph type="secondary">
                            <a href={selectedJob.sourceUrl} target="_blank" rel="noopener noreferrer">
                                {selectedJob.sourceUrl}
                            </a>
                        </Paragraph>

                        <Title level={5} style={{ marginTop: 24 }}>Content Preview</Title>
                        <div
                            style={{
                                maxHeight: 400,
                                overflow: 'auto',
                                border: '1px solid #f0f0f0',
                                padding: 16,
                                borderRadius: 8,
                            }}
                            dangerouslySetInnerHTML={{ __html: selectedJob.content || 'No content' }}
                        />

                        {selectedJob.images && selectedJob.images.length > 0 && (
                            <>
                                <Title level={5} style={{ marginTop: 24 }}>
                                    Images ({selectedJob.images.length})
                                </Title>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {selectedJob.images.slice(0, 10).map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img.local || img.url || img}
                                            alt=""
                                            style={{
                                                width: 80,
                                                height: 80,
                                                objectFit: 'cover',
                                                borderRadius: 4,
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {selectedJob.status === 'COMPLETED' && (
                            <Button
                                type="primary"
                                icon={<ImportOutlined />}
                                style={{ marginTop: 24 }}
                                onClick={() => {
                                    setDrawerOpen(false);
                                    handleImport(selectedJob);
                                }}
                            >
                                Import as Page
                            </Button>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
