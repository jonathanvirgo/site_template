import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Modal, message, Typography, Input } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { pageApi } from '../services/api';

const { Title } = Typography;

export default function Pages() {
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadPages();
    }, [pagination.current]);

    const loadPages = async () => {
        setLoading(true);
        try {
            const response = await pageApi.getAll({
                limit: pagination.pageSize,
                offset: (pagination.current - 1) * pagination.pageSize,
            });
            setPages(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
            }));
        } catch (error) {
            message.error('Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (page) => {
        Modal.confirm({
            title: 'Delete Page?',
            content: `Are you sure you want to delete "${page.title}"?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await pageApi.delete(page.id);
                    message.success('Page deleted');
                    loadPages();
                } catch (error) {
                    message.error('Failed to delete page');
                }
            },
        });
    };

    const handlePublish = async (page) => {
        try {
            if (page.status === 'PUBLISHED') {
                await pageApi.unpublish(page.id);
                message.success('Page unpublished');
            } else {
                await pageApi.publish(page.id);
                message.success('Page published');
            }
            loadPages();
        } catch (error) {
            message.error('Failed to update page status');
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Space>
                    {record.isHomepage && <HomeOutlined style={{ color: '#6366f1' }} />}
                    <a onClick={() => navigate(`/pages/${record.id}`)}>{text}</a>
                </Space>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug) => <code>/{slug}</code>,
        },
        {
            title: 'Template',
            dataIndex: 'template',
            key: 'template',
            render: (template) => <Tag>{template}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'PUBLISHED' ? 'green' : status === 'DRAFT' ? 'orange' : 'default'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Author',
            dataIndex: ['author', 'name'],
            key: 'author',
        },
        {
            title: 'Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/pages/${record.id}`)}
                    />
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePublish(record)}
                    />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Pages</Title>
                <Space>
                    <Input
                        placeholder="Search pages..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 200 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/pages/new')}
                    >
                        New Page
                    </Button>
                </Space>
            </div>

            <Card>
                <Table
                    dataSource={pages.filter(p =>
                        !search || p.title.toLowerCase().includes(search.toLowerCase())
                    )}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        onChange: (page) => setPagination(prev => ({ ...prev, current: page })),
                    }}
                />
            </Card>
        </div>
    );
}
